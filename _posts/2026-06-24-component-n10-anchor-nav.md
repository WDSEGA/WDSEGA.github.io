---
layout: post
title: "组件详解#10：锚点导航，让长页面从'滚筒洗衣机'变成'目录书' | Component Deep Dive #10: Anchor Nav — Turn Your Long Page From a Scroll Marathon Into a Clickable Book"
date: 2026-06-24 12:00:00 +0800
categories: components
tags: [代码产品, Web Components, CSS, JavaScript, AnchorNav]
---

> 本文组件来自 **Web Component Dictionary v2.0** · 网页组件活字典，83组件/8分类/中英双语/实时预览/单文件无依赖。  
> 在线体验：[wdsega.github.io/web-components](https://wdsega.github.io/web-components/) | 购买完整版：[payhip.com/b/S9pj2](https://payhip.com/b/S9pj2) ¥9.99

---

## 你的用户正在疯狂滚动，而你根本不知道

长页面是内容型网站的标配——产品文档、博文、Landing Page。用户进来后，你的页面等于一本没有目录的书。他们会怎么做？**无目的地滚动**。滚到一半失去耐心，关掉。

锚点导航（Anchor Nav）解决的就是这个问题：页面左侧或右侧放一排导航点，点击哪个点，页面平滑滚动到对应区块。用户在哪个区块，对应的导航点就高亮。像一本书的侧边索引标签。

## 组件是什么

锚点导航由两部分组成：**导航点（dots/nav items）** 和 **页面区块（sections）**。核心逻辑：
1. 点击导航点 → 页面滚动到对应区块
2. 页面滚动 → 导航点跟随高亮（Scroll Spy）

Web Component Dictionary v2.0 里的这个组件是纯前端实现，不依赖任何框架。

## 效果预览

在字典的在线演示页（wdsega.github.io/web-components）搜索 "Anchor" 即可看到效果：左侧固定一排圆点，页面右侧是多个全高区块。点击圆点页面平滑滚动，滚动时圆点自动切换活跃态。

## 代码拆解

### HTML 结构

```html
<nav class="anchor-nav">
  <a href="#section1" class="anchor-dot active" data-target="section1"></a>
  <a href="#section2" class="anchor-dot" data-target="section2"></a>
  <a href="#section3" class="anchor-dot" data-target="section3"></a>
  <a href="#section4" class="anchor-dot" data-target="section4"></a>
</nav>

<section id="section1" class="anchor-section">Section 1</section>
<section id="section2" class="anchor-section">Section 2</section>
<section id="section3" class="anchor-section">Section 3</section>
<section id="section4" class="anchor-section">Section 4</section>
```

结构很简单：`<nav>` 里是一组 `<a>` 标签充当导航点，页面上是带 `id` 的 `<section>` 作为锚点目标。关键不在于 HTML，在于 CSS 的定位和 JS 的滚动监听。

### CSS 关键样式

```css
.anchor-nav {
  position: fixed;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 100;
}

.anchor-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  border: 2px solid rgba(255,255,255,0.5);
  transition: all 0.3s ease;
  cursor: pointer;
  text-decoration: none;
}

.anchor-dot.active {
  background: #e94560;
  border-color: #e94560;
  transform: scale(1.3);
  box-shadow: 0 0 12px rgba(233,69,96,0.5);
}
```

三个关键点：
- `position: fixed` + `right: 30px` + `top: 50%` + `translateY(-50%)` = 垂直居中固定在页面右侧
- 导航点用圆点（`border-radius: 50%`），hover 和 active 态有缩放+发光效果
- `z-index: 100` 确保不被内容遮挡

### JavaScript：Scroll Spy

```javascript
const dots = document.querySelectorAll('.anchor-dot');
const sections = document.querySelectorAll('.anchor-section');

// 点击导航点 → 平滑滚动
dots.forEach(dot => {
  dot.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = dot.dataset.target;
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// 滚动时 → 更新活跃导航点
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.scrollY >= sectionTop - 100) {
      current = section.getAttribute('id');
    }
  });

  dots.forEach(dot => {
    dot.classList.toggle('active', dot.dataset.target === current);
  });
});
```

## 关键技术点深挖

### Scroll Spy 的偏移量陷阱

注意 `window.scrollY >= sectionTop - 100` 里的 `-100`。如果不减这个偏移量，用户滚到区块的最顶部时，导航点才会切换——视觉上会感觉"慢了半拍"。

100px 是一个经验值，应该根据你的页面布局调整。如果你的顶部有固定导航栏（比如 60px 高），偏移量应该至少等于导航栏高度加上一些缓冲。

### 性能：不要忘记节流

`scroll` 事件在快速滚动时每秒触发几十次。上面的代码每次触发都要遍历所有 section 计算位置。如果页面有 20+ 区块而且计算逻辑复杂，页面会卡顿。

修复方案：

```javascript
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateActiveDot();
      ticking = false;
    });
    ticking = true;
  }
});
```

用 `requestAnimationFrame` 包裹，确保每帧只执行一次。

## 常见坑点

**坑1：移动端上导航点太小**

12px 的圆点在手机上基本点不中。建议在 `@media (max-width: 768px)` 里要么放大到 16px+，要么直接隐藏改为底部横排标签。

**坑2：`scroll-behavior: smooth` 和 JS 冲突**

你可能想在 `<html>` 上加 `scroll-behavior: smooth` 省掉 JS。但这样 `scrollIntoView` 和 CSS 的平滑滚动会叠加，导致滚动行为诡异。建议二选一：要么纯 CSS `scroll-behavior: smooth` + `<a href="#id">`，要么纯 JS `scrollIntoView({ behavior: 'smooth' })`。

**坑3：区块高度不够**

如果某个 section 高度小于视口高度，用户滚过一个区块时，Scroll Spy 可能同时匹配两个 section。解决方案：给每个 section 设置 `min-height: 100vh`，或者改用 Intersection Observer API（更精准）。

## 完整可复制代码

（从 Web Component Dictionary v2.0 复制完整HTML/CSS/JS，单文件直接可用）

## 变体拓展

1. **文字标签版**：圆点旁边加区块名称，适合文档类页面
2. **进度条版**：导航点之间用线连接，滚动时线逐渐填充，强化"看到哪了"
3. **横向版**：移动端把竖排圆点改成底部横排小标签，更像手机相册的缩略图导航

## 下一个组件预告

下一篇讲 n11：**底部固定导航**——移动端最常用的导航模式，但实现细节比看起来多得多。

---

> 本文组件来自 **Web Component Dictionary v2.0** — 83个开箱即用的网页组件，导航/表单/数据展示/多媒体等8大分类，中英双语，实时预览，单文件无依赖。  
> 🔗 在线体验：[wdsega.github.io/web-components](https://wdsega.github.io/web-components/)  
> 🛒 购买完整版源码（¥9.99 一次性买断）：[payhip.com/b/S9pj2](https://payhip.com/b/S9pj2)

---

## Component Deep Dive #10: Anchor Nav — Turn Your Long Page From a Scroll Marathon Into a Clickable Book

### Your Users Are Scrolling Blind

Long pages are standard for content-heavy sites — docs, blogs, landing pages. When users land, your page is effectively a book without a table of contents. What do they do? **Scroll aimlessly**. Halfway through, they lose patience and leave.

Anchor navigation solves this: a row of nav dots on the side of the page. Click a dot, smooth-scroll to that section. Wherever the user is, the corresponding dot highlights — like those index tabs on the edge of a reference book.

### How It Works

Two parts: **nav dots** and **page sections**. Core logic:
1. Click dot → scroll to section
2. Scroll page → update active dot (Scroll Spy)

### Code Breakdown

The HTML is minimal: a `<nav>` with `<a>` dots, and `<section>` elements with matching IDs. The magic is in CSS positioning and JS scroll listening.

CSS: `position: fixed; right: 30px; top: 50%; transform: translateY(-50%)` pins the dots vertically centered on the right. Dots are 12px circles with a scale+glow effect on active state.

JS: click handlers call `scrollIntoView({ behavior: 'smooth' })`. A scroll listener compares `window.scrollY` against each section's `offsetTop` to determine which dot should be active.

### Key Insight: The Offset Trap

Notice `window.scrollY >= sectionTop - 100` — that `-100` offset prevents the "half-beat-late" feeling. Without it, the dot only switches when you hit the exact top of a section. 100px is an empirical value; adjust based on your fixed navbar height plus a buffer.

### Common Pitfalls

- **Too small for mobile**: 12px dots are unclickable on touchscreens. Scale up or switch to horizontal tabs.
- **CSS vs JS scroll conflict**: Pick one smooth-scroll mechanism; don't mix `scroll-behavior: smooth` with `scrollIntoView({ behavior: 'smooth' })`.
- **Short sections**: If sections are shorter than the viewport, Scroll Spy can match two at once. Use `min-height: 100vh` or the Intersection Observer API.

### Variants

- **Label version**: text labels beside dots for documentation pages
- **Progress bar version**: connect dots with a line that fills as you scroll
- **Horizontal version**: bottom-row tabs for mobile, like photo gallery thumbnails

---

> This component is from **Web Component Dictionary v2.0** — 83 ready-to-use web components across 8 categories. Bilingual, live preview, single-file, zero dependencies.  
> 🔗 Live demo: [wdsega.github.io/web-components](https://wdsega.github.io/web-components/)  
> 🛒 Buy full source code ($9.99 one-time): [payhip.com/b/S9pj2](https://payhip.com/b/S9pj2)
