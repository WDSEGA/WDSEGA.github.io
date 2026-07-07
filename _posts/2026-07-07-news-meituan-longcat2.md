---
layout: post
title: "美团开源LongCat-2.0：1.6万亿参数全国产算力，英伟达含量为零 | Meituan Open-Sources LongCat-2.0: 1.6T Params, Zero Nvidia, All Domestic Chips"
date: 2026-07-07 12:00:00 +0800
categories: [AI新闻, AI News]
tags: [meituan, longcat, open-source, china-ai]
description: "美团开源1.6万亿参数MoE模型LongCat-2.0，从训练到推理全流程在5万卡国产算力集群上完成，英伟达含量为零。"
author: 编译员
---

# 美团开源LongCat-2.0：1.6万亿参数全国产算力，英伟达含量为零

> 美团用5万张国产芯片训练了一个万亿参数模型，然后把它开源了。

7月7日，美团正式开源新一代基础大模型LongCat-2.0。模型总参数量达1.6万亿，采用MoE架构，每个Token激活参数约480亿。该模型最突出的特点是从训练到推理全流程均在5万卡国产算力集群上完成，英伟达含量为零。

## 关键信息

- **总参数量**：1.6万亿（1.6T）
- **激活参数**：约480亿/Token
- **架构**：MoE（混合专家）
- **上下文窗口**：原生支持100万Token
- **算力**：5万卡国产芯片集群，全流程零英伟达
- **开源内容**：模型权重 + 针对国产算力深度优化的推理代码

这是业界首个完全依靠国产芯片从训练到推理全流程支撑的万亿参数大模型。此前，国产芯片主要用于推理侧，训练侧仍严重依赖英伟达GPU。LongCat-2.0证明了国产芯片+国产模型组合已具备与国际顶尖水平正面竞争的能力。

## 为什么重要

在当前地缘政治背景下，英伟达高端GPU对华出口受限，国产算力的训练能力一直是行业关注的焦点。此前业界普遍认为国产芯片在集群互联、软件生态和训练稳定性上与英伟达存在差距，难以支撑万亿参数模型的训练。

LongCat-2.0的发布打破了这一认知。5万卡规模集群训练万亿参数模型，需要在通信带宽、故障恢复、检查点管理和数据并行等多个维度具备工程能力。美团同步开源针对国产算力深度优化的推理代码，意味着其他开发者也可以在国产芯片上直接部署该模型。

## 开源意义

美团将LongCat-2.0完全开源（包括权重和优化代码），这与此前DeepSeek、GLM等开源模型形成呼应。开源生态的持续扩大为开发者提供了更多自托管选择，降低了对闭源API的依赖。

值得注意的是，LongCat-2.0原生支持100万Token超长上下文，这在文档分析、代码理解和长对话场景中具有显著优势。结合国产算力的成本优势，LongCat-2.0可能在需要长上下文处理的企业场景中形成差异化竞争力。

---

# Meituan Open-Sources LongCat-2.0: 1.6T Params, Zero Nvidia, All Domestic Chips

> Meituan trained a trillion-parameter model on 50,000 domestic chips, then open-sourced it.

On July 7, Meituan officially open-sourced LongCat-2.0, its new foundation model. With 1.6 trillion total parameters in MoE architecture and ~480B activated parameters per token, the model's most distinctive feature is that the entire pipeline — from training to inference — runs on a 50,000-card domestic compute cluster with zero Nvidia content.

## Key Facts

- **Total parameters**: 1.6 trillion (1.6T)
- **Activated parameters**: ~480B per token
- **Architecture**: MoE (Mixture of Experts)
- **Context window**: Natively supports 1 million tokens
- **Compute**: 50,000-card domestic chip cluster, zero Nvidia throughout
- **Open-sourced**: Model weights + inference code optimized for domestic chips

This is the industry's first trillion-parameter model fully supported by domestic chips from training through inference. Previously, domestic chips were primarily used on the inference side, with training still heavily dependent on Nvidia GPUs. LongCat-2.0 demonstrates that the domestic chip + domestic model combination can now compete head-to-head with top international standards.

## Why It Matters

Against the backdrop of geopolitical restrictions on Nvidia GPU exports to China, domestic compute training capability has been an industry focus. The prevailing view was that domestic chips lagged behind Nvidia in cluster interconnect, software ecosystem, and training stability, making trillion-parameter model training impractical.

LongCat-2.0's release breaks this perception. Training a trillion-parameter model on a 50,000-card cluster requires engineering capability across communication bandwidth, fault recovery, checkpoint management, and data parallelism. Meituan's simultaneous release of inference code optimized for domestic chips means other developers can deploy the model directly on domestic hardware.

## Open Source Significance

Meituan's full open-source release (weights + optimization code) continues the trend established by DeepSeek, GLM, and other open-source models. The expanding open-source ecosystem gives developers more self-hosting options, reducing dependence on closed APIs.

Notably, LongCat-2.0's native 1-million-token context support provides significant advantages in document analysis, code understanding, and long conversation scenarios. Combined with the cost advantages of domestic compute, LongCat-2.0 may form differentiated competitiveness in enterprise use cases requiring long-context processing.

---

*本文由无人日报（Deskless Daily）编译员整理发布。*
