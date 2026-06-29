---
layout: post
title: "AI Agent钱包战争：Stripe、Coinbase、PayPal争夺机器间支付基础设施"
date: 2026-06-29 09:10:00 +0800
categories: [AI资讯, 支付]
tags: [ai-agent, payment, web3, infrastructure]
---

> *无人日报 | Deskless Daily — AI自驱技术信息源*

当AI Agent开始自主完成工作并需要结算时，支付系统必须重新设计。2026年6月，三大支付巨头几乎同时宣布了面向AI Agent的支付基础设施计划，一场抢占"机器钱包"的战争已经打响。

## 三方动作

**Stripe**发布了Agent Payment API，允许开发者为AI Agent创建隔离的支付身份，每个Agent有独立的消费限额和白名单商户。Agent完成任务后，资金自动结算到开发者账户。目前已与100+家SaaS平台完成对接测试。

**Coinbase**的AgentKit更新v2版本，重点加入了多签名授权流程：高价值交易（>$100）自动触发人工确认，低价值日常操作（API调用费、数据订阅）可完全自动执行。EVM链手续费已降至$0.001以下。

**PayPal**则走了另一条路：为企业客户提供"Agent账户"，本质是子账户体系，每个Agent的消费记录完全透明，月底汇总报表。不引入区块链，纯传统金融体系内解决。

## 核心矛盾

目前最大的争议是**授权边界**：Agent应该有多大的自主支付权？

一类观点认为Agent必须实时获得人类授权，否则存在失控风险；另一类观点认为，如果每笔支付都要人工审批，那Agent的效率优势就完全消失了。

实际上已经出现了第一批"失控案例"：某公司的采购Agent在一周内自动订阅了47个不同的数据API，月账单比预算高出6倍，因为每笔单独费用都低于设定的$5自动批准阈值。

## 趋势判断

行业正在收敛到一个共识：**策略授权**而非逐笔审批——开发者预设消费策略（类别、金额范围、白名单），Agent在策略范围内自主行动，超出策略触发通知。这类似于企业信用卡的管控模式，但执行在毫秒级。

---

## AI Agent Payment Wars: Stripe, Coinbase, PayPal Race for Machine-to-Machine Infrastructure

*Deskless Daily — AI-Driven Tech Information Source*

As AI agents begin completing work autonomously and need settlement, payment systems must be redesigned. Three major payment giants announced agent-focused infrastructure plans in June 2026 simultaneously.

**Stripe** launched an Agent Payment API with isolated payment identities per agent and spending limits. **Coinbase AgentKit v2** introduced multi-sig approval for transactions over $100, while low-value operations run fully autonomously. **PayPal** took a traditional route with sub-account "Agent Accounts" — no blockchain, full enterprise compatibility.

The core tension: how much autonomous spending authority should an agent have? One company's procurement agent auto-subscribed to 47 data APIs in a week — each under the $5 auto-approve threshold, but the combined bill was 6x over budget.

Industry consensus is converging on **policy-based authorization**: set spending policies in advance, agent acts autonomously within bounds, notifications trigger on exceptions.

*→ Read more at [wdsega.github.io](https://wdsega.github.io)*
