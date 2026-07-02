---
layout: post
title: "组件详解#23：无限滚动，让你的列表永远没有'下一页'按钮 | Component Deep Dive #23: Infinite Scroll — Never Show a 'Next Page' Button Again"
date: 2026-07-02
categories: [component, javascript, webdev]
tags: [infinite-scroll, pagination, javascript, webdev, frontend]
lang: bilingual
---

Instagram、Twitter、TikTok — 你从来没在这些App上看到过"下一页"按钮。

它们用无限滚动。你往下滑，内容自动加载。永远没有尽头。

**但如果实现错了，用户会看到：重复内容、卡顿闪烁、或突然跳回顶部。**

---

## 无限滚动的核心原理

一句话：**IntersectionObserver 监听底部哨兵元素 → 触发数据加载 → 替换哨兵**。

```html
<div id="content">
  <!-- 已加载的内容 -->
</div>
<div id="sentinel" class="sentinel">Loading more...</div>
```

```javascript
const sentinel = document.getElementById('sentinel');
const content = document.getElementById('content');

const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    loadMore();
  }
}, { rootMargin: '200px' });

observer.observe(sentinel);

async function loadMore() {
  observer.unobserve(sentinel); // 防止重复触发
  
  const data = await fetch(`/api/posts?page=${currentPage++}`);
  const html = renderPosts(data);
  content.insertAdjacentHTML('beforeend', html);
  
  if (data.hasMore) {
    observer.observe(sentinel); // 重新监听
  } else {
    sentinel.remove(); // 没有更多了
  }
}
```

---

## `rootMargin: '200px'` 是关键

默认 IntersectionObserver 在元素**进入视口**时触发。但这意味着用户已经滚到底了才开始加载 — 等数据回来又要等1-2秒。

`rootMargin: '200px'` 让哨兵在**距离视口200px时**就触发。用户还没滚到底，数据已经在加载了。

**经验值：200px-400px** — 太小没提前量，太大浪费请求。

---

## 3个必防的Bug

### Bug 1：重复触发

快速滚动时，`isIntersecting` 可能在同一帧触发多次。

**修复**：`unobserve` → 加载 → `observe`。加载期间不监听。

### Bug 2：页面跳动

新内容插入后，浏览器重新计算布局，用户当前阅读位置可能跳动。

**修复**：`insertAdjacentHTML('beforeend', html)` 而非 `innerHTML += html`。前者不重新解析已有DOM。

### Bug 3：滚回顶部

移动端最常见：新内容加载时，列表突然跳回顶部。

**修复**：加载时保持 `scrollTop` 不变。如果用虚拟列表，确保 `scrollTop` 映射关系不变。

---

## 何时该用无限滚动，何时不该用

| 场景 | 无限滚动 | 分页 |
|------|----------|------|
| 社交feed、图片流 | ✅ | ❌ |
| 电商商品列表 | ⚠️（需"加载更多"按钮） | ✅ |
| 搜索结果 | ❌ | ✅ |
| 数据表格 | ❌ | ✅ |
| 后台管理 | ❌ | ✅ |

电商列表为什么不适合纯无限滚动？用户需要**定位特定商品** — 无限滚动没有页码，无法跳转。

**折中方案**："加载更多"按钮 — 用户主动选择是否加载下一批。

---

## 虚拟列表：万条数据的终极方案

1000条以上数据时，无限滚动会DOM爆炸。虚拟列表只渲染可见区域的元素：

```javascript
// 虚拟列表核心逻辑
const ITEM_HEIGHT = 60;
const BUFFER = 5;

function renderVirtualList(scrollTop, containerHeight, totalItems) {
  const startIdx = Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER;
  const endIdx = Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER;
  
  // 只渲染 startIdx 到 endIdx 的元素
  // 容器总高度 = totalItems * ITEM_HEIGHT（用padding模拟）
}
```

React的 `react-window`、Vue的 `vue-virtual-scroller` 都是这个原理。

---

## 性能优化清单

1. `rootMargin: 200px` — 提前加载
2. 加载时 `unobserve` — 防重复
3. `insertAdjacentHTML` — 不重解析
4. 图片懒加载 — `loading="lazy"`
5. `will-change: transform` — 滚动时GPU加速
6. `>1000条` 用虚拟列表

---

## 总结

无限滚动的本质不是"永远没有尽头"，而是**永远不让用户感觉到等待**。

IntersectionObserver + rootMargin 提前加载 + unobserve防重复 = 基础实现。

万条数据 → 虚拟列表。

你的列表还在用"下一页"按钮吗？

---

> **Web Component Dictionary v2.0** — 83组件双语完整版 + Live Preview
> [在线预览](https://wdsega.github.io/web-components) | [购买完整版](https://payhip.com/b/S9pj2)

---

Instagram, Twitter, TikTok — you've never seen a "Next Page" button on these apps.

They use infinite scroll. You swipe down, content auto-loads. No end ever.

**But if implemented wrong, users see: duplicate content, stuttering, or sudden jumps back to top.**

## Core Principle

One sentence: **IntersectionObserver watches a bottom sentinel element → triggers data fetch → re-observes sentinel.**

## `rootMargin: '200px'` Is Key

Default IntersectionObserver fires when element enters viewport — meaning user already hit bottom before loading starts. 1-2s wait for data.

`rootMargin: '200px'` fires when sentinel is 200px away from viewport. Data loads before user reaches bottom.

Best value: 200-400px.

## 3 Must-Fix Bugs

1. **Duplicate triggers** — `unobserve` during load, `observe` after
2. **Page jumping** — use `insertAdjacentHTML('beforeend')`, not `innerHTML +=`
3. **Jump to top on mobile** — preserve `scrollTop` during load

## When to Use vs Not

Social feeds ✅ | E-commerce ⚠️ (use "Load More" button) | Search results ❌ | Data tables ❌ | Admin panels ❌

## Virtual List: The Ultimate Solution for 10k+ Items

Only render visible area items. `react-window` / `vue-virtual-scroller` both use this principle.

## Performance Checklist

1. `rootMargin: 200px` — pre-load
2. `unobserve` during load — prevent duplicates
3. `insertAdjacentHTML` — no re-parse
4. `loading="lazy"` on images
5. `will-change: transform` — GPU acceleration
6. Virtual list for >1000 items

## Summary

Infinite scroll's essence: **never let users feel they're waiting.**

> **Web Component Dictionary v2.0** — 83 components, bilingual, live preview
> [Live Demo](https://wdsega.github.io/web-components) | [Buy Full Version](https://payhip.com/b/S9pj2)
