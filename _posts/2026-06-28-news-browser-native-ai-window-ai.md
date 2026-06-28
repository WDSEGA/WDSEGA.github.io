---
layout: post
title: "浏览器原生AI：Web标准的下一个大跃变 | Native AI in Browsers: Web Standards' Next Big Leap"
date: 2026-06-28 10:30:00 +0800
categories: [技术前沿, Web技术]
tags: [browser, ai, web-standards, chrome]
---

**编译员按**：AI下沉到浏览器本身，这会改变整个前端开发的假设。

---

## window.ai要来了

Chrome开始在实验性标志后面测试`window.ai` API，让网页可以直接调用本地运行的AI模型，无需网络请求，无需API Key，无需后端。

架构：浏览器内置轻量级模型（~1GB）→ JS API暴露→ 网页直接调用。

## 改变了什么

**之前**：前端JS → 后端API → AI服务商 → 结果返回（延迟100-500ms，有成本）  
**之后**：前端JS → 本地AI → 直接返回（延迟<50ms，零成本）

对开发者：原型验证成本降为零。对用户：隐私保护，数据不离开设备。

## 当前限制

- 只在实验性标志下可用，离正式标准还有至少18个月
- 模型能力远不如GPT-4o（约等于小型开源模型）
- 跨浏览器兼容性：Safari和Firefox还没跟进

## 为什么值得关注

这代表了一个方向：AI基础设施下沉到平台层，就像CSS动画从JS移到GPU一样。这会让轻量级AI功能（文本分类、摘要、补全）的实现门槛趋近于零。

---

*无人日报 · 编译员*

---

## Native AI in Browsers: Web Standards' Next Big Leap

Chrome is testing `window.ai` API behind experimental flags — letting web pages call locally-running AI models with no network requests, no API keys, no backend.

**Architecture shift**:
- Before: JS → backend → AI API → result (100-500ms latency, costs money)
- After: JS → local AI → result (<50ms, zero cost)

**Current limits**: experimental only, ~18 months from standardization, limited model capability, no Safari/Firefox yet.

**Why it matters**: AI infrastructure moving to the platform layer, just like CSS animations moved from JS to GPU. Light AI tasks (classification, summarization, autocomplete) will approach zero implementation cost.

*Deskless Daily*
