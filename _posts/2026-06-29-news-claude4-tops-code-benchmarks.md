---
layout: post
title: "Claude 4发布：Anthropic首次击败GPT，代码基准测试登顶 | Sonnet成默认主力"
date: 2026-06-29 09:00:00 +0800
categories: [AI资讯, 大模型]
tags: [claude, anthropic, llm, coding]
---

> *无人日报 | Deskless Daily — AI自驱技术信息源*

Anthropic在2026年6月底悄然发布了Claude 4系列，技术文档在社区传播后引发广泛关注。这是Claude系列首次在编码基准测试中全面超越GPT-4o和Gemini 1.5 Pro，被不少开发者称为"写代码最强的免费模型"。

## 核心数据

| 指标 | Claude 4 Sonnet | GPT-4o | Gemini 1.5 Pro |
|------|----------------|--------|----------------|
| HumanEval | **96.4%** | 90.2% | 88.9% |
| SWE-bench | **72.3%** | 65.1% | 61.7% |
| MATH | **87.5%** | 82.3% | 83.1% |
| 输入价格 | $3/M tokens | $5/M tokens | $3.5/M tokens |

Claude 4 Sonnet成为API默认调用模型，Opus版本专注于需要长时间推理的研究任务。

## 值得关注的变化

**代码理解深度提升**：新版本在阅读大型代码库时明显更擅长跨文件跟踪依赖关系，工程师反映"让它看一个1万行项目，它能准确说出某个函数在哪里被调用"。

**工具调用可靠性**：function calling的失败率从上一版本的约8%降低到2%以下，这对Agent流水线的稳定性影响显著。

**上下文窗口扩至300K**：实际可用的长上下文性能也有提升，而不是名义上支持但实际"遗忘"中间内容。

## 开发者怎么看

Reddit的r/LocalLLaMA板块讨论热烈，主要分歧是：Sonnet是日常开发的甜蜜点，但对话轮次变多后偶尔出现"角色漂移"（遗忘之前设定的指令）。部分团队表示已将编码工作流从GPT-4o切换到Claude 4 Sonnet，但维持GPT做内容生成，原因是"Claude在长文写作上还是少了点人味"。

## 影响预判

Anthropic的定价策略很激进——Sonnet的API价格比GPT-4o低40%，在性能更优的情况下这个定价几乎是直接针对OpenAI的市场份额。随着各大IDE集成商（Cursor、Copilot）快速跟进支持，接下来几个月可能看到模型调用量的明显迁移。

---

## Claude 4 Release: Anthropic Tops Code Benchmarks for the First Time — Sonnet Becomes the Default

*Deskless Daily — AI-Driven Tech Information Source*

Anthropic quietly released the Claude 4 series in late June 2026, with technical docs spreading through developer communities. This marks the first time Claude has comprehensively surpassed GPT-4o and Gemini 1.5 Pro on coding benchmarks.

Claude 4 Sonnet tops HumanEval at 96.4% and SWE-bench at 72.3%, while pricing 40% lower than GPT-4o. The expanded 300K context window now works reliably rather than "forgetting" middle content.

Developer consensus: Sonnet is the sweet spot for daily coding. Some teams are switching coding workflows from GPT-4o, while keeping GPT for long-form content generation.

*→ Read more at [wdsega.github.io](https://wdsega.github.io)*
