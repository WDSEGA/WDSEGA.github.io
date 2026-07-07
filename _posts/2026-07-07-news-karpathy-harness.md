---
layout: post
title: "Karpathy解读：Agent性能差距在Harness而非模型 | Karpathy: Agent Performance Gap Is in the Harness, Not the Model"
date: 2026-07-07 12:00:00 +0800
categories: [AI新闻, AI News]
tags: [karpathy, agents, harness, llm]
description: "Hugging Face实验证明：冻结DeepSeek-V4-Pro权重，仅优化Agent Harness就能追平Claude Sonnet 4.6，成本降至1/7。"
author: 编译员
---

# Karpathy解读：Agent性能差距在Harness而非模型

> 同一个模型，换5种Agent框架，分数从3.5%到80.1%波动76分。模型没变，变的是"壳"。

Anthropic预训练研究员Andrej Karpathy在播客《AGI is still a decade away》中指出："今天AI行业最大的误区，是大家都在逼Agent尽快干活，却没有先把底层模型和系统机制理解吃透。"

Hugging Face工程师Joel Niklaus的实验《Don't Train the Model, Evolve the Harness》为这一判断提供了硬数据支撑。

## 实验设计

- **模型**：DeepSeek-V4-Pro，全程冻结权重，不做任何微调
- **变量**：仅替换5种不同的Agent Harness（即模型外层的工具调用、记忆管理、推理流程编排框架）
- **基准**：100个held-out test任务

## 关键数据

| 指标 | 数值 |
|------|------|
| 5种Harness的分数波动范围 | 3.5% ~ 80.1% |
| 差距 | 76分 |
| 优化后最佳Harness得分 | 80.1% |
| 对标模型 | Claude Sonnet 4.6（同分） |
| 运行成本 | 原来的1/7 |
| 代码自动迭代轮数 | ~22轮 |
| 同Harness迁移到DeepSeek-V4-Flash的提升 | +14.4分 |

## 这意味着什么

**同一个模型，不同Harness之间差76分。** 这说明当前Agent性能的瓶颈不在模型本身，而在于模型外层的工程框架——工具选择策略、上下文窗口管理、多轮对话状态维护、错误恢复机制等。

更值得关注的是成本效率：优化后的Harness让DeepSeek-V4-Pro追平了Claude Sonnet 4.6的性能，但运行成本仅为原来的1/7。这意味着如果企业愿意在Harness工程上投入，完全可以用更便宜的模型达到更贵模型的效果。

Harness的可迁移性同样重要：同一个优化后的Harness从V4-Pro迁移到V4-Flash（更小更便宜的版本）仍能提升14.4分。这证明Harness优化比prompt调优更容易沉淀和跨模型迁移——prompt是"一次性技巧"，Harness是"工程资产"。

## Karpathy的核心观点

Karpathy认为行业目前的注意力错配：大量资源投入到模型训练和模型选择上，但Agent的实际表现往往由Harness决定。与其不断换模型，不如先把Harness做到位。

这与当前"模型军备竞赛"的叙事形成对比。当开源模型（如DeepSeek-V4-Pro）配合优秀Harness就能追平闭源旗舰模型时，模型能力的差距可能被高估了，而工程能力的差距被低估了。

---

# Karpathy: Agent Performance Gap Is in the Harness, Not the Model

> Same model, 5 different Agent frameworks, scores swing from 3.5% to 80.1% — a 76-point gap. The model didn't change; the "shell" did.

Anthropic pre-training researcher Andrej Karpathy stated on the podcast "AGI Is Still a Decade Away": "The biggest misconception in today's AI industry is that everyone is pushing Agents to produce results quickly without first thoroughly understanding the underlying models and system mechanisms."

Hugging Face engineer Joel Niklaus's experiment "Don't Train the Model, Evolve the Harness" provides hard data supporting this judgment.

## Experiment Design

- **Model**: DeepSeek-V4-Pro, weights frozen throughout, no fine-tuning
- **Variable**: Only 5 different Agent Harnesses (the framework layer handling tool calling, memory management, reasoning flow orchestration)
- **Benchmark**: 100 held-out test tasks

## Key Data

| Metric | Value |
|--------|-------|
| Score range across 5 Harnesses | 3.5% ~ 80.1% |
| Gap | 76 points |
| Best Harness score after optimization | 80.1% |
| Comparison model | Claude Sonnet 4.6 (same score) |
| Operating cost | 1/7 of original |
| Code auto-iteration rounds | ~22 |
| Improvement when migrated to DeepSeek-V4-Flash | +14.4 points |

## What This Means

**The same model varies by 76 points across different Harnesses.** This suggests the current Agent performance bottleneck is not in the model itself, but in the engineering framework surrounding it — tool selection strategies, context window management, multi-turn dialogue state maintenance, error recovery mechanisms.

Even more noteworthy is cost efficiency: the optimized Harness enables DeepSeek-V4-Pro to match Claude Sonnet 4.6's performance at 1/7 the operating cost. If enterprises are willing to invest in Harness engineering, they can achieve premium model results with cheaper models.

Harness portability is equally important: the same optimized Harness migrated from V4-Pro to V4-Flash (smaller, cheaper) still improves by 14.4 points. This proves Harness optimization is easier to codify and transfer across models than prompt tuning — prompts are "one-time tricks," Harnesses are "engineering assets."

## Karpathy's Core Argument

Karpathy argues that the industry's attention is misallocated: massive resources go into model training and selection, but actual Agent performance is often determined by the Harness. Rather than constantly switching models, it's better to get the Harness right first.

This contrasts with the current "model arms race" narrative. When open-source models (like DeepSeek-V4-Pro) with excellent Harnesses can match closed-source flagship models, the model capability gap may be overstated while the engineering capability gap is understated.

---

*本文由无人日报（Deskless Daily）编译员整理发布。*
