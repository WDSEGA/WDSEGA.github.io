---
layout: post
title: "Anthropic发布Claude Science：AI开始当科学家了 | Anthropic Launches Claude Science: AI Is Now a Research Instrument"
date: 2026-07-01 09:00:00 +0800
categories: [news, ai]
tags: [ai, anthropic, science]
author: 编译员
---

2026年7月1日，旧金山某制药高管峰会上，Anthropic CEO Dario Amodei 现场演示了 Claude Science——它不是在回答"蛋白质折叠是什么"，而是实时访问数据库、调用计算生物学软件、逐步推演，把一个通常需要研究团队几小时的分析，压缩到几分钟内完成。

房间里鸦雀无声。

## Claude Science是什么

Anthropic这次发布的不是一个孤立的产品。Claude Science是三件套之一：

- **Claude Code**：给软件工程师用的 AI Agent
- **Claude Cowork**：通用任务协作
- **Claude Science**：专攻计算生物学与药物研发

科学版本的特点是：可以执行科学软件、查询专业数据库，并实时展示推理过程。不只是"生成文本答案"，而是"参与科学过程"。

## NVIDIA也在做同样的事

同日，NVIDIA发布了 BioNeMo Agent Toolkit，用来解决AI辅助研究里最大的瓶颈：速度。

其中一个案例：RAPIDS-singlecell 组件能把130万细胞的预处理工作流从**52分钟压缩到25秒**，124倍加速。

nvMolKit 把化学信息学运算加速3000倍。这意味着AI可以在"实时"的时间尺度里，遍历巨大的化学空间。

## 为什么这件事值得关注

以前说AI能帮助科学研究，通常是指：帮写论文摘要、快速文献综述、做一些统计分析。

现在这条线正在向前移动。

当一个AI系统能在几分钟内完成研究团队几小时的分析工作，它就不再是"科研辅助工具"，而是开始**参与科学方法本身**——生成假设、验证假设、迭代。

这对制药行业是真实的商业压力：一款药从研发到上市平均10-15年。如果AI能把某些阶段压缩一个数量级，那就是几十亿美元的竞争优势。

## 但协作还是硬伤

同日还有一项研究值得泼冷水：斯坦福团队发布了GPTNT基准测试（基于合作游戏《拆弹专家》），要求两个AI Agent实时协作——一个看到炸弹，一个拿着拆弹手册，都看不到对方的信息，必须通过沟通配合。

结论：没有任何现有AI模型，不管是开源还是闭源，能在实时压力下成功拆弹。而这个难度对人类玩家来说是常规操作。

AI在单任务上越来越强，但在"实时、信息不对称、高压协作"场景下，还差得远。

---

*English below*

---

On July 1, Anthropic CEO Dario Amodei demoed Claude Science at a pharmaceutical executive summit in San Francisco. The AI agent didn't just answer questions — it accessed specialized databases, executed computational biology software, and completed in minutes what normally takes a research team hours.

## What Is Claude Science

It's one of three new Claude tools: Claude Code (software engineers), Claude Cowork (general tasks), and Claude Science (computational biology and drug development). The science variant can execute scientific software and query specialized databases in real time.

## The NVIDIA Parallel

NVIDIA's BioNeMo Agent Toolkit promises 124x speedup for 1.3-million-cell genomic preprocessing workflows (52 minutes → 25 seconds) and 3,000x acceleration for cheminformatics operations.

## Why This Matters

When AI can compress hours of research into minutes, it stops being a "writing assistant" and starts participating in the scientific method itself — generating and testing hypotheses in near real-time. For pharma, where drug development takes 10-15 years, this is a real competitive advantage.

## The Collaboration Problem

GPTNT benchmark (based on cooperative game "Keep Talking and Nobody Explodes") found that no current AI model can defuse a single bomb in real time under pressure — a bar human players routinely clear. AI excels at single tasks but still fails at real-time, information-asymmetric collaboration.

Source: [AI Daily Digest, July 1, 2026](https://aidailypost.com)
