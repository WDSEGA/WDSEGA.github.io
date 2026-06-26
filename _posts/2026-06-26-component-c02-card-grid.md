---
layout: post
title: "组件详解#14：卡片网格布局，让页面排版像搭积木一样简单 | Component Deep Dive #14: Card Grid Layout — Page Layout as Simple as Building Blocks"
date: 2026-06-26 08:30:00 +0800
categories: blog
tags: [代码产品, web components, card, grid, responsive, css]
canonical_url: https://wdsega.github.io/2026/06/26/component-c02-card-grid/
---

## 产品介绍

本文组件来自 **Web Component Dictionary v2.0 · 网页组件活字典**，83 组件 / 8 分类 / 中英双语 / 实时预览 / 单文件无依赖。  
在线体验：[wdsega.github.io/web-components](https://wdsega.github.io/web-components) | 购买：[payhip.com/b/S9pj2](https://payhip.com/b/S9pj2) 仅 ¥9.99

---

## 钩子

CSS Grid 推出快十年了，但多数开发者仍然只用它做最简单的两栏三栏布局。真正的问题不是"不会用 Grid"，而是"不知道它能多优雅地解决卡片排版"。今天这个组件会让你看到：只需 4 行 CSS 核心代码，就能实现一个自适应、等高等宽、自动换行的卡片网格——而且完全不需要媒体查询。

## 组件是什么

卡片网格布局（Card Grid Layout）是一个纯 CSS 驱动的自适应卡片排列系统。它使用 CSS Grid 的 `auto-fill` + `minmax()` 组合，让卡片根据容器宽度自动决定每行显示几列，始终保持等宽和对齐。无需 JavaScript 计算、无需 `@media` 断点。

## 效果预览

- 宽屏 1200px：4 列卡片
- 中屏 768px：3 列卡片
- 窄屏 480px：2 列卡片
- 超窄屏 320px：1 列全宽
- 所有卡片等高、间距均匀、边缘自动贴齐

## 代码拆解

### HTML 结构

```html
<div class="card-grid">
  <article class="card">
    <img src="thumb.jpg" alt="Thumbnail" class="card-img">
    <div class="card-body">
      <h3 class="card-title">Card Title</h3>
      <p class="card-text">Card description goes here.</p>
    </div>
  </article>
  <!-- 更多卡片... -->
</div>
```

### CSS 核心魔法

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding: 20px;
}
```

这就是全部。`auto-fill` 告诉浏览器"能塞几列塞几列"，`minmax(280px, 1fr)` 设定每列最小 280px、最大均分剩余空间。当容器宽度从 1200px 缩到 320px，列数从 4 自动变成 1——不需要一行媒体查询。

### JavaScript（可选增强）

```javascript
// 瀑布流模式：用 CSS columns 实现不等高卡片自然排列
document.querySelectorAll('.card-grid.masonry').forEach(grid => {
  grid.style.columnCount = Math.floor(grid.offsetWidth / 300);
  window.addEventListener('resize', () => {
    grid.style.columnCount = Math.floor(grid.offsetWidth / 300);
  });
});
```

## 关键技术点深挖

### auto-fill vs auto-fit 的区别

这是 CSS Grid 中最容易被误解的两个关键词：
- `auto-fill`：有空位就创建轨道，即使没有内容填充，轨道位置保留
- `auto-fit`：有空位就创建轨道，但空轨道会坍缩为 0

卡片网格用 `auto-fill` 更合适，因为它保证最后一行的卡片宽度和其他行一致。`auto-fit` 会在卡片不够填满一行时把卡片拉伸到全宽。

### 等高卡片的两种方案

方案 A（推荐）：Grid 默认行为——同一行的所有 grid item 自动等高  
方案 B：Flexbox + `align-items: stretch`——需要所有卡片在同一 flex 容器中

Grid 方案的优势在于：即使卡片内容量差异巨大，同一行也永远等高，且换行后各行独立计算高度。

## 常见坑点

**坑：Grid gap 导致外层出现多余滚动条**  
如果 `.card-grid` 有 `width: 100%` 且 `gap: 24px`，在 `box-sizing: content-box` 下会溢出。解决方案：确保全局 `box-sizing: border-box`。

**坑：图片破环网格**  
未设置 `width: 100%` 的大图会撑破 grid cell。给所有卡片内图片加上：
```css
.card-img { width: 100%; height: auto; display: block; }
```

## 完整可复制代码

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Card Grid Layout</title>
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, sans-serif; background: #f0f2f5; padding: 40px 20px; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto; }
.card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); transition: transform 0.3s, box-shadow 0.3s; }
.card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0,0,0,0.15); }
.card-img { width: 100%; height: 180px; object-fit: cover; display: block; }
.card-body { padding: 20px; }
.card-title { font-size: 18px; margin-bottom: 8px; color: #1a1a2e; }
.card-text { color: #666; line-height: 1.6; font-size: 14px; }
.card-footer { padding: 0 20px 20px; display: flex; justify-content: space-between; align-items: center; }
.card-tag { background: #e8f0fe; color: #1a73e8; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
.card-date { color: #999; font-size: 12px; }
@media (max-width: 600px) { body { padding: 20px 12px; } .card-grid { gap: 16px; } }
</style>
</head>
<body>
<div class="card-grid">
  <article class="card">
    <img src="https://picsum.photos/400/200?random=1" alt="Post 1" class="card-img">
    <div class="card-body"><h3 class="card-title">Getting Started with CSS Grid</h3><p class="card-text">Master the modern layout system in 15 minutes.</p></div>
    <div class="card-footer"><span class="card-tag">CSS</span><span class="card-date">2026-06-26</span></div>
  </article>
  <article class="card">
    <img src="https://picsum.photos/400/200?random=2" alt="Post 2" class="card-img">
    <div class="card-body"><h3 class="card-title">Why JavaScript Frameworks Keep Evolving</h3><p class="card-text">From jQuery to React to the next big thing.</p></div>
    <div class="card-footer"><span class="card-tag">JavaScript</span><span class="card-date">2026-06-25</span></div>
  </article>
  <article class="card">
    <img src="https://picsum.photos/400/200?random=3" alt="Post 3" class="card-img">
    <div class="card-body"><h3 class="card-title">Building Accessible Web Components</h3><p class="card-text">ARIA roles, keyboard navigation, and screen readers.</p></div>
    <div class="card-footer"><span class="card-tag">A11y</span><span class="card-date">2026-06-24</span></div>
  </article>
  <article class="card">
    <img src="https://picsum.photos/400/200?random=4" alt="Post 4" class="card-img">
    <div class="card-body"><h3 class="card-title">The Rise of Edge Computing</h3><p class="card-text">Why running code closer to users matters more than ever.</p></div>
    <div class="card-footer"><span class="card-tag">Infra</span><span class="card-date">2026-06-23</span></div>
  </article>
  <article class="card">
    <img src="https://picsum.photos/400/200?random=5" alt="Post 5" class="card-img">
    <div class="card-body"><h3 class="card-title">TypeScript 5.7: What's New</h3><p class="card-text">Type narrowing improvements and new utility types.</p></div>
    <div class="card-footer"><span class="card-tag">TypeScript</span><span class="card-date">2026-06-22</span></div>
  </article>
  <article class="card">
    <img src="https://picsum.photos/400/200?random=6" alt="Post 6" class="card-img">
    <div class="card-body"><h3 class="card-title">Designing Dark Mode That Works</h3><p class="card-text">Beyond inverting colors: contrast, readability, and brand.</p></div>
    <div class="card-footer"><span class="card-tag">Design</span><span class="card-date">2026-06-21</span></div>
  </article>
</div>
</body>
</html>
```

## 变体拓展

1. **瀑布流版**：用 CSS `columns` 属性实现 Pinterest 风格不等高排列
2. **筛选网格**：配合 JavaScript 标签筛选，动画隐藏不匹配卡片
3. **无限滚动版**：Intersection Observer 检测底部，动态追加卡片
4. **可拖拽排序版**：HTML5 Drag and Drop API 实现卡片位置互换

---

👉 83 个组件一键到手：[payhip.com/b/S9pj2](https://payhip.com/b/S9pj2) | 实时预览：[wdsega.github.io/web-components](https://wdsega.github.io/web-components)

---

## Card Grid Layout — Page Layout as Simple as Building Blocks

### The Hook

CSS Grid has been around for years, yet most developers still use it for basic two-column layouts. The real magic isn't "learning Grid" — it's knowing how elegantly it solves adaptive card layouts with just four lines of CSS.

### The Magic Formula

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
```

That's it. `auto-fill` fills the row with as many columns as fit; `minmax(280px, 1fr)` ensures each column is at least 280px and evenly distributes remaining space. From 1200px down to 320px, columns auto-adjust from 4 to 1 — zero media queries required.

### auto-fill vs auto-fit

- `auto-fill` preserves empty tracks, keeping last-row cards the same width as others
- `auto-fit` collapses empty tracks, stretching remaining cards to full width

For card grids, `auto-fill` is almost always the right choice.

### Common Pitfalls

- Gap + `width: 100%` without `border-box` causes overflow
- Images without `width: 100%` break grid cell boundaries
- Grid items in the same row are automatically equal height — no extra CSS needed

### Try It & Buy It

👉 Live demo: [wdsega.github.io/web-components](https://wdsega.github.io/web-components)  
👉 Full bundle ¥9.99: [payhip.com/b/S9pj2](https://payhip.com/b/S9pj2)
