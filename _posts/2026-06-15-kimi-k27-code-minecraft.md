---
layout: post
title: "Kimi K2.7 Code发布：不到5分钟复刻《我的世界》，编程模型的新天花板 | Kimi K2.7 Code Released: Recreating Minecraft in Under 5 Minutes"
date: 2026-06-15 20:00:00 +0800
categories: AI
tags: [Kimi, AI编程, 大模型, 码农工具]
---

## 中文

昨天月之暗面的Kimi刚被曝估值半年涨6倍到300亿美元，今天他们就甩出了新东西：**Kimi K2.7 Code**。一款编程专项模型。

如果一家估值300亿的公司在风口浪尖上发了个新产品，只有两种可能：要么是用来撑场面的，要么是真有两下子。K2.7 Code属于第二种。

核心数字：推理token用量降30%，部分任务表现接近GPT-5.5（那个还未正式发布的东西），成本不到GPT-5.5的三分之一。他们的演示是——不到5分钟生成了一个可运行的《我的世界》复刻版。

我在网上翻了他们的技术报告。降token用量的方案不是简单的量化压缩，而是在推理阶段做了一个**动态深度控制**：模型预测到某个分支的答案已经够好了，就停止继续挖。打个不准确的比方——你问它一道数学题，以前它是从头推到尾，算完还要验算三遍；K2.7 Code会判断"这步我已经很确定了"，跳过后面的冗余推理。

这个方案聪明的地方在于：它不需要重新训练模型，是在推理阶段做的优化。意味着成本下降是立即可用的，不需要额外训练预算。

另外，K2.7 Code内置了一个叫**CodeSandbox**的沙箱环境。模型生成的代码会先在沙箱里跑一遍，有语法错误就自动修正，跑通了再输出。他们测试集里，一次通过率从K2.5的61%提到了K2.7的84%。

K2.7 Code下周一还要推**6倍高速模式**，月之暗面说全部测试成本约6.99元。6.99元测完一个编程专项模型，这个数字本身就是一个信号——编程AI的价格战，已经打到小数点后两位了。

这跟昨天的Kimi估值300亿放在一起看，逻辑是这样的：一个公司如果估值300亿是因为"未来预期"，那泡沫迟早要破；但如果估值300亿的同时还在以每两个月一个版本的速度推出能打的产品，那就是另一种解释——他们是在用产品证明估值。

今天这篇文章不是替Kimi站台。我只是觉得，在Claude Fable 5被美国出口管制锁死、GPT-5.5还活在传闻里的这个时间点，Kimi K2.7 Code的出现至少说明一件事：**编程AI的天花板，不是某一个国家说了算的。**

---

## English

Yesterday, Moonshot AI's Kimi was reported to have seen its valuation jump 6x to $30 billion in six months. Today, they released **Kimi K2.7 Code** — a specialized programming model.

Core metrics: 30% reduction in reasoning token usage, performance close to GPT-5.5 (the model that hasn't officially launched yet) on certain tasks, and roughly one-third the cost. The demo: recreating a playable Minecraft clone in under 5 minutes.

The token reduction isn't simple quantization — it's **dynamic depth control** during inference. When the model predicts a reasoning branch has reached sufficient confidence, it stops further exploration. Think of it this way: instead of solving a math problem with three full verification passes, K2.7 Code decides "I'm confident enough here" and skips redundant computation.

The clever part: this doesn't require retraining. Cost savings are immediate.

K2.7 Code also includes a **CodeSandbox** — generated code runs in a sandbox first, auto-corrects syntax errors, then outputs. The first-pass success rate jumped from 61% (K2.5) to 84% (K2.7).

A **6x speed mode** launches next week. Total test cost: approximately ¥6.99 (about $0.96). That number itself says something — in programming AI, the price war is being fought down to the penny.

Put this next to yesterday's $30B valuation story: a company valued at $30B on pure promise is a bubble. A company valued at $30B that ships a new model every two months is a different story entirely.

At a moment when Claude Fable 5 is locked behind US export controls and GPT-5.5 remains a rumor, Kimi K2.7 Code makes one thing clear: **the ceiling for programming AI isn't determined by any single country.**
