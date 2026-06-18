---
layout: post
title: "Laravel AI SDK深度解析：首个将AI嵌入核心架构的PHP框架"
date: 2026-05-24
categories: [PHP]
tags: [代码产品]
---

过去两年，提到构建 AI Agent，几乎所有教程、课程和技术演讲都指向 Python。LangChain、LangGraph、CrewAI 这些框架让 Python 开发者在 AI 应用领域一路狂奔，而 PHP 开发者只能望洋兴叹——要么学 Python，要么搭一个 Python 微服务通过 HTTP 调用，要么用原始 API 调用勉强凑合。

2026 年初，Laravel 官方正式发布了 **Laravel AI SDK**（`laravel/ai`），这是一个一等公民（first-party）包，彻底改变了这个局面。它不是简单的 API 封装，而是一个完整的 Agent 框架，深度集成到 Laravel 的核心架构中。

## 为什么 Laravel AI SDK 是一次范式转移

Laravel AI SDK 的核心设计理念是：**Agent 即 PHP 类**。每个 Agent 是一个独立的 PHP 类，封装了系统指令、对话历史、工具集和输出 Schema。这与 Laravel 的服务容器、Eloquent ORM、队列系统无缝协作。

SDK 支持 14 家 AI 提供商：OpenAI、Anthropic、Google Gemini、Groq、Mistral、DeepSeek、xAI、Ollama、Azure OpenAI、Cohere、OpenRouter、Jina、VoyageAI 和 ElevenLabs。切换提供商只需改一个参数或 `.env` 变量。

功能覆盖范围远超"聊天接口"：

| 能力 | 说明 |
|------|------|
| 文本对话 | 多轮对话、结构化输出 |
| 图像生成 | DALL-E、Gemini、xAI |
| 语音合成与转录 | TTS/STT，支持 ElevenLabs |
| 向量嵌入与搜索 | 原生 pgvector 集成，RAG 支持 |
| 多 Agent 工作流 | 5 种编排模式 |
| 流式响应 | SSE + Vercel AI Data Protocol |
| 队列集成 | 长任务异步执行 |
| 提供商故障转移 | 自动降级到备用提供商 |

## 安装与配置

安装只需两步：

```bash
composer require laravel/ai
php artisan vendor:publish --provider="Laravel\Ai\AiServiceProvider"
php artisan migrate
```

迁移会创建 `agent_conversations` 和 `agent_conversation_messages` 两张表，用于持久化对话历史。在 `.env` 中配置 API Key：

```env
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GEMINI_API_KEY=xxx
```

## 实战一：构建一个完整的客服 Agent

用 Artisan 命令生成 Agent 骨架：

```bash
php artisan make:agent SupportAgent --structured
```

生成的类位于 `app/Ai/Agents/SupportAgent.php`。下面是一个完整的客服 Agent 实现，包含工具调用和结构化输出：

```php
<?php

namespace App\Ai\Agents;

use App\Ai\Tools\LookupSubscription;
use App\Ai\Tools\IssueRefund;
use App\Models\User;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Promptable;
use Laravel\Ai\Concerns\RemembersConversations;

class SupportAgent implements Agent, Conversational, HasTools, HasStructuredOutput
{
    use Promptable, RemembersConversations;

    public function __construct(public User $user) {}

    public function instructions(): string
    {
        return <<<'PROMPT'
        你是一位专业的客服代理。帮助用户解决账单和订阅问题。
        回复要求：
        1. 使用友好、专业的语气
        2. 先查询用户订阅状态再给出建议
        3. 退款操作需确认用户身份
        PROMPT;
    }

    public function tools(): iterable
    {
        return [
            new LookupSubscription,
            new IssueRefund,
        ];
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'resolution'  => $schema->string()->required(),
            'ticket_closed' => $schema->boolean()->required(),
            'refund_amount' => $schema->number()->minimum(0)->nullable(),
        ];
    }
}
```

调用方式极其简洁：

```php
// 在 Controller 中
$response = SupportAgent::make(user: $user)
    ->prompt($request->input('message'));

return response()->json([
    'resolution'   => $response['resolution'],
    'ticket_closed' => $response['ticket_closed'],
]);
```

`RemembersConversations` trait 自动处理对话持久化。开始新对话：

```php
$response = SupportAgent::make(user: $user)
    ->forUser($user)
    ->prompt('你好，我想查看我的订阅');
$conversationId = $response->conversationId;
```

继续已有对话：

```php
$response = SupportAgent::make(user: $user)
    ->continue($conversationId, as: $user)
    ->prompt('帮我取消订阅');
```

## 实战二：自定义工具让 Agent 操控数据库

工具是 Agent 的"手和脚"。每个工具是一个 PHP 类，实现 `handle` 方法和 JSON Schema 描述：

```php
<?php

namespace App\Ai\Tools;

use Laravel\Ai\Tool;
use App\Models\Subscription;

class LookupSubscription extends Tool
{
    public function description(): string
    {
        return '查询用户的订阅状态、到期时间和套餐信息';
    }

    public function parameters(): array
    {
        return [
            'user_id' => ['type' => 'integer', 'description' => '用户ID'],
        ];
    }

    public function handle(int $user_id): string
    {
        $subscription = Subscription::where('user_id', $user_id)->first();

        if (! $subscription) {
            return json_encode(['error' => '未找到订阅记录']);
        }

        return json_encode([
            'plan'        => $subscription->plan,
            'status'      => $subscription->status,
            'expires_at'  => $subscription->expires_at->toIso8601String(),
            'amount'      => $subscription->amount,
        ]);
    }
}
```

LLM 会根据用户输入自动决定是否调用这个工具，SDK 负责执行并将结果返回给模型。开发者不需要编写任何调度逻辑。

## 实战三：向量搜索实现 RAG

Laravel AI SDK 原生集成了向量嵌入和相似性搜索，配合 pgvector 扩展可以直接在 Eloquent 模型上做语义检索：

```php
// 在 Eloquent 模型中使用向量搜索
use Laravel\Ai\Concerns\HasEmbeddings;

class Document extends Model
{
    use HasEmbeddings;

    protected $embeddings = [
        'embedding' => 'content', // content 字段自动生成向量
    ];
}

// 语义搜索：查找与查询最相似的文档
$documents = Document::query()
    ->whereVectorSimilarTo('embedding', '账单取消退款政策', minSimilarity: 0.7)
    ->limit(10)
    ->get();
```

这比传统关键词搜索强大得多。用户问"怎么退款"，系统能匹配到标题为"订阅取消与费用退还说明"的文档，即使两者没有共同关键词。

## 生产级特性

**流式响应**：Agent 支持将响应以 SSE 流式推送到前端，兼容 Vercel AI Data Protocol，开箱即用支持 Livewire 和 Inertia：

```php
return SupportAgent::make(user: $user)
    ->stream($request->input('message'))
    ->usingVercelDataProtocol();
```

**队列异步执行**：耗时任务不阻塞 HTTP 请求：

```php
SupportAgent::make(user: $user)
    ->queue($message)
    ->then(fn ($response) => $user->notify(new AgentDone($response)));
```

**提供商故障转移**：主提供商不可用时自动切换：

```php
$response = SupportAgent::make()->prompt(
    $message,
    provider: [Lab::Anthropic, Lab::OpenAI]
);
```

**测试支持**：SDK 内置完整的 Fake 层，无需付费 API 即可写测试：

```php
SupportAgent::fake(['您的订阅已成功取消。']);
SupportAgent::assertPrompted('取消我的订阅');
```

## 多 Agent 工作流

SDK 内置 5 种多 Agent 编排模式，基于 Anthropic 发布的 Agent 设计研究：

1. **Prompt Chaining**：一个 Agent 的输出作为下一个的输入，适合固定流水线（草稿 -> 审核 -> 优化）
2. **Routing**：分类 Agent 将请求路由到专业 Agent，路由 Agent 可标记 `#[UseCheapestModel]` 降低成本
3. **Parallelization**：多个 Agent 并行处理同一输入，用 `Concurrency::run()` 实现
4. **Orchestrator-Workers**：协调 Agent 动态分配任务给工作 Agent
5. **Evaluator-Optimizer**：生成-评估-改进循环，直到内容达标或达到迭代上限

## 写在最后

Laravel AI SDK 的意义不仅在于"PHP 也能做 AI"。它将 AI 能力作为一等公民融入了 Laravel 的架构哲学——优雅的接口约定、依赖注入、队列、事件、测试，一切都在你熟悉的 Laravel 生态中。

对于之前为了 AI 功能而维护 Python 微服务的团队来说，Laravel AI SDK 通常可以消除对那个额外服务的依赖。一种语言，一次部署，一个代码库。

正如 Taylor Otwell 在 SDK 演示中所说："LLM 在处理易于解析和理解的结构化内容时表现更好。倾向于约定和结构的框架，在与 LLM 协作时天然具有优势。"
