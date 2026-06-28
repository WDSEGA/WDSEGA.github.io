---
layout: post
title: "c12-空状态组件 Empty State | 最容易被忽视的用户体验时刻"
date: 2026-06-28 08:30:00 +0800
categories: [组件, Web Component Dictionary]
tags: [empty-state, css, web-components, ux]
---


> **Web Component Dictionary v2.0 · 网页组件活字典**  
> 83个组件/8大分类/中英双语/实时预览/单文件无依赖  
> [在线体验](https://wdsega.github.io/web-components) | [购买 ¥9.99](https://payhip.com/b/S9pj2)



"什么都没有"——这个时刻，是用户和产品最脆弱的连接点。空状态做好了，用户继续走；做差了，用户离开。

## 组件是什么

Empty State（空状态）是当列表、搜索结果、数据面板没有内容时显示的占位界面。它不只是"没有数据"的告知，更是引导用户下一步行动的重要入口。

## 三种场景

**1. 首次使用（First Time Empty）**
```html
<div class="empty-state">
  <div class="empty-icon">📋</div>
  <h3 class="empty-title">还没有任务</h3>
  <p class="empty-desc">创建你的第一个任务，开始追踪工作进度</p>
  <button class="btn-primary">+ 创建任务</button>
</div>
```

**2. 搜索无结果**
```html
<div class="empty-state">
  <div class="empty-icon">🔍</div>
  <h3 class="empty-title">没有找到"<span id="search-keyword"></span>"</h3>
  <p class="empty-desc">试试其他关键词，或者清除筛选条件</p>
  <button class="btn-secondary" onclick="clearSearch()">清除搜索</button>
</div>
```

**3. 加载失败**
```html
<div class="empty-state">
  <div class="empty-icon">⚠️</div>
  <h3 class="empty-title">加载失败</h3>
  <p class="empty-desc">网络连接出了问题，请稍后重试</p>
  <button class="btn-primary" onclick="retry()">重新加载</button>
</div>
```

## CSS 实现

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px;
  max-width: 360px;
  line-height: 1.6;
}

/* 用SVG插图替代emoji时 */
.empty-illustration {
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
  opacity: 0.6;
}
```

## 关键设计原则

1. **说清楚发生了什么**：不只是"没有数据"，要告诉用户为什么没有
2. **给出明确下一步**：每个空状态至少有一个行动按钮
3. **语气要友好**：不是"ERROR: No records found"，是"你的收藏夹还是空的"
4. **首次空和清空后的空不同**：首次引导探索，清空后可能需要确认或撤销

## 常见坑点

1. 空状态不加行动按钮是大忌——这是引导用户创建内容的最佳时机
2. 搜索无结果时要展示搜索词，让用户确认是不是打错了
3. 加载失败和真实空数据要区分，给出不同的提示和操作

---

*本文组件收录于 [Web Component Dictionary v2.0](https://payhip.com/b/S9pj2)，83个实用组件，¥9.99即可获取全套。*

---

## Empty State Component - The Most Overlooked UX Moment


> **Web Component Dictionary v2.0**  
> 83 components / 8 categories / bilingual / live preview / zero dependencies  
> [Live Demo](https://wdsega.github.io/web-components) | [Buy $1.38](https://payhip.com/b/S9pj2)



Empty state is when your list, search, or dashboard has no content to show. Done right, users continue. Done wrong, users leave.

### Three Scenarios

1. **First-time empty**: Guide users to create their first item
2. **Search no results**: Show the search term, offer to clear it
3. **Load failure**: Explain why and offer retry

### Design Principles

1. Explain what happened (not just "no data")
2. Always include a clear CTA button
3. Friendly tone: "Your wishlist is empty" not "No records found"
4. First-time empty ≠ post-delete empty — different messages needed

*Part of [Web Component Dictionary v2.0](https://payhip.com/b/S9pj2)*
