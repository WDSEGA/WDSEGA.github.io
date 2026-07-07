---
layout: post
title: "腾讯混元3正式版发布：295B参数搜索追平GPT-5.5，幻觉率减半 | Tencent Hunyuan 3: 295B Params, Search Matches GPT-5.5, Hallucination Halved"
date: 2026-07-07 12:00:00 +0800
categories: [AI新闻, AI News]
tags: [tencent, hunyuan, llm, china-ai]
description: "姚顺雨加入腾讯后首个重量级产品落地。混元3正式版总参295B，激活21B，搜索能力追平GPT-5.5，幻觉率减半。"
author: 编译员
---

# 腾讯混元3正式版发布：295B参数搜索追平GPT-5.5，幻觉率减半

> 姚顺雨加入腾讯后的第一张成绩单：MoE架构295B总参，搜索追平GPT-5.5，幻觉率砍半。

7月7日，腾讯正式发布混元3（Hunyuan 3 / Hy3）正式版。这是姚顺雨（前清华大学姚班教授）加入腾讯后首个重量级AI产品落地。模型采用MoE（混合专家）架构，总参数量295B，单次激活参数21B，另含3.8B MTP（多Token预测）层。

## 架构细节

- **MoE结构**：192个专家中选取top-8，有效参数量约为GLM 5.2的一半
- **注意力机制**：80层GQA分组注意力，64头中8个KV头
- **隐藏层维度**：4096，中间层13312
- **上下文窗口**：256K
- **词表大小**：120,832
- **精度**：BF16

架构与此前发布的Hy3 preview版完全一致。腾讯官方将性能提升归因于"后训练数据质量与多样性提升"和"RL算力规模扩大"，而非架构调整。

## 性能

官方称Hy3正式版在搜索能力上追平GPT-5.5，幻觉率较preview版减半。这一表现使得腾讯成为国内首个在搜索基准上达到GPT-5.5级别的大模型厂商。

姚顺雨的加入被认为是关键变量。他在清华大学期间的研究方向涵盖大模型训练优化和强化学习对齐，与Hy3正式版"后训练数据质量"和"RL算力规模"的提升路径高度吻合。

## 行业影响

混元3的发布标志着国产大模型在MoE效率上的新突破。295B总参但仅激活21B，这意味着推理成本远低于同等性能的稠密模型。在GLM 5.2已引发"AI利润率塌缩"讨论的背景下，混元3进一步压缩了单位推理成本。

同时，搜索能力追平GPT-5.5意味着国产模型在RAG（检索增强生成）和Web搜索场景中已具备与海外顶尖模型正面竞争的能力。幻觉率减半则直接解决了企业落地中最被诟病的可靠性问题。

---

# Tencent Hunyuan 3 Officially Released: 295B Params, Search Matches GPT-5.5, Hallucination Halved

> Yao Shunyu's first major deliverable at Tencent: MoE architecture with 295B total params, search capability matching GPT-5.5, hallucination rate cut in half.

On July 7, Tencent officially released Hunyuan 3 (Hy3). This is the first major AI product launch since Yao Shunyu (former Tsinghua University Yao Class professor) joined Tencent. The model uses MoE (Mixture of Experts) architecture with 295B total parameters, 21B activated per token, plus a 3.8B MTP (Multi-Token Prediction) layer.

## Architecture Details

- **MoE structure**: 192 experts with top-8 selection, effective parameters roughly half of GLM 5.2
- **Attention**: 80-layer GQA grouped attention, 8 KV heads out of 64
- **Hidden dimension**: 4096, intermediate layer 13312
- **Context window**: 256K
- **Vocabulary**: 120,832
- **Precision**: BF16

The architecture is identical to the previously released Hy3 preview. Tencent attributes the performance gains to "improved post-training data quality and diversity" and "expanded RL compute scale," rather than architectural changes.

## Performance

Tencent claims Hy3's search capability matches GPT-5.5, with hallucination rate halved compared to the preview version. This makes Tencent the first Chinese AI company to reach GPT-5.5-level performance on search benchmarks.

Yao Shunyu's arrival is considered a key factor. His research at Tsinghua covered large model training optimization and RL alignment — directly aligned with Hy3's improvement path of "post-training data quality" and "RL compute scale."

## Industry Impact

Hunyuan 3's release marks a new breakthrough for Chinese LLMs in MoE efficiency. With 295B total but only 21B activated parameters, inference costs are far lower than a dense model of equivalent performance. Against the backdrop of GLM 5.2 already triggering "AI margin collapse" discussions, Hunyuan 3 further compresses per-unit inference costs.

Meanwhile, search capability matching GPT-5.5 means Chinese models can now compete head-to-head with top international models in RAG and web search scenarios. The halved hallucination rate directly addresses the reliability issue most criticized in enterprise deployment.

---

*本文由无人日报（Deskless Daily）编译员整理发布。*
