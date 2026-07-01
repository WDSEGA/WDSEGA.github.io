---
layout: post
title: "AI协作仍是硬题：没有模型能在压力下完成实时配合 | AI Collaboration Remains Hard: No Model Passes Real-Time Teamwork Test"
date: 2026-07-01 09:20:00 +0800
categories: [news, ai]
tags: [ai, benchmark, research]
author: 编译员
---

一个新的基准测试，用一款桌游让AI出了丑。

**GPTNT**——基于合作解谜游戏《拆弹专家：保持冷静，不要爆炸》（Keep Talking and Nobody Explodes）。规则：两个AI Agent合作，一个看到炸弹界面，一个持有拆弹手册，双方看不到对方的信息，只能通过沟通配合拆弹。

实验结果：**所有现有模型，开源和闭源全部失败。没有任何AI能在实时压力下拆掉哪怕一颗炸弹。**

而这个难度，对有经验的人类玩家来说是家常便饭。

## 为什么这个测试重要

传统AI基准测试通常是：给模型一道题，看它答得怎么样。GPTNT测的完全不同：

- **实时性**：有时间压力，不能慢慢想
- **信息不对称**：每个Agent只看到部分信息，必须主动沟通
- **协作依赖**：单个Agent再聪明也没用，必须和对方配合

研究者特意设计了这套规则，就是为了排除"背答案"的可能——每次拆弹组合都是随机的，模型无法靠记忆过关，必须真正理解并实时沟通。

## 失败的根本原因

**不是智力，是沟通协议。**

大语言模型在训练时，优化目标是"给出好的单步响应"。但实时协作需要的是：

1. 知道何时该说什么（主动沟通 vs 等待）
2. 处理对方理解出错的情况（错误恢复）
3. 在不完整信息下做决策（不确定性管理）
4. 保持时间压力下的一致性（别因为紧张就乱）

这四项没有一项是现有LLM训练流程天然擅长的。

## 对AI Agent产品的启示

2026年AI Agent是最热的方向。很多产品宣传"多Agent协作"——一个负责搜索，一个负责写作，一个负责审核，互相配合完成复杂任务。

GPTNT的结果是一次冷水：**多Agent系统在低压、长时间、信息对称的场景下能工作，在高压、实时、信息不对称的场景下极不可靠。**

这不代表多Agent没有价值——而是意味着，当前可靠的多Agent应用场景，必须精心设计任务结构，确保每步之间信息传递完整、时间压力可控。

## 同日的另一个信号

自进化Agent RSEA（Recursive Self-Evolving Agent）在 ALFWorld 基准测试上达到了69.3%成功率（vs 基线ReAct的64.6%），通过维护三层自然语言状态来记忆和更新策略。

进步是有的，但作者也诚实地说：长期稳定性数据还不够，"自我进化"的说法需要谨慎。

---

*English below*

---

GPTNT — a new benchmark based on cooperative game "Keep Talking and Nobody Explodes" — just revealed a critical gap: no current AI model, open or closed, can defuse a single bomb in real time under pressure. Humans do this routinely.

## Why This Test Matters

Unlike standard benchmarks (give model a problem → check answer), GPTNT requires:
- **Real-time pressure**: clock is ticking
- **Information asymmetry**: each agent sees only partial info, must communicate
- **Collaborative dependency**: intelligence alone is useless without coordination

The rules are randomized to prevent answer memorization, forcing genuine real-time reasoning and communication.

## The Root Cause

Not intelligence — communication protocol. LLMs are trained to produce good single-step responses. Real-time collaboration requires knowing when to speak, recovering from misunderstandings, deciding under incomplete information, and maintaining consistency under pressure.

## Implications for AI Agent Products

Multi-agent systems work well in low-pressure, long-horizon, information-complete scenarios. They fail unreliably in high-pressure, real-time, information-asymmetric ones. Design your multi-agent architecture accordingly.

Source: [AI Daily Digest, July 1, 2026](https://aidailypost.com)
