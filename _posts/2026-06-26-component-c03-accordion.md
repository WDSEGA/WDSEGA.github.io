---
layout: post
title: "组件详解#15：手风琴折叠，一个被误解了20年的交互模式 | Component Deep Dive #15: Accordion — A 20-Year-Old Interaction Pattern Everyone Gets Wrong"
date: 2026-06-26 09:00:00 +0800
categories: blog
tags: [代码产品, web components, accordion, css animation, ux, javascript]
canonical_url: https://wdsega.github.io/2026/06/26/component-c03-accordion/
---

## 产品介绍

本文组件来自 **Web Component Dictionary v2.0 · 网页组件活字典**，83 组件 / 8 分类 / 中英双语 / 实时预览 / 单文件无依赖。  
在线体验：[wdsega.github.io/web-components](https://wdsega.github.io/web-components) | 购买：[payhip.com/b/S9pj2](https://payhip.com/b/S9pj2) 仅 ¥9.99

---

## 钩子

你打开一个 FAQ 页面，点第一个问题——啪，答案展开。再点第二个——答案也展开了。现在两个答案同时显示，页面高度翻倍，滚动条凭空出现。这不是你想要的。你想要的是"点第二个时第一个自动收起"。这个需求叫"手风琴"，而 90% 的自定义实现都在可用性上栽了跟头。

## 组件是什么

手风琴折叠（Accordion）是一组可展开/收起的面板，通常同一时间只允许一个面板展开。它由标题栏（触发按钮）和内容区组成，点击标题切换内容的显示/隐藏状态。核心挑战不是"怎么展开"，而是"怎么优雅地过渡"——CSS 的 `height: auto` 不支持动画过渡，这才是手风琴真正的技术难点。

## 效果预览

- 点击标题：内容平滑展开，其他面板自动收起
- 再次点击已展开的标题：内容收起
- 键盘操作：Tab 聚焦 + Enter/Space 切换
- 过渡动画流畅：展开/收起使用 JavaScript 动态计算高度

## 代码拆解

### HTML 结构

```html
<div class="accordion">
  <div class="accordion-item">
    <button class="accordion-header" aria-expanded="false">
      <span>What is Web Component Dictionary?</span>
      <span class="accordion-icon">+</span>
    </button>
    <div class="accordion-content" role="region">
      <div class="accordion-body">
        A collection of 83 ready-to-use web components with live previews.
      </div>
    </div>
  </div>
  <!-- 更多 item... -->
</div>
```

### CSS

```css
.accordion-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s ease;
}
.accordion-content.open {
  grid-template-rows: 1fr;
}
.accordion-body {
  overflow: hidden;
}
```

### JavaScript

```javascript
class Accordion {
  constructor(el) {
    this.el = el;
    this.headers = [...el.querySelectorAll('.accordion-header')];
    this.init();
  }
  init() {
    this.headers.forEach(header => {
      header.addEventListener('click', () => this.toggle(header));
      header.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggle(header); }
      });
    });
  }
  toggle(header) {
    const content = header.nextElementSibling;
    const isOpen = content.classList.contains('open');
    // 关闭所有
    this.headers.forEach(h => {
      h.setAttribute('aria-expanded', 'false');
      h.nextElementSibling.classList.remove('open');
    });
    // 打开当前（如果之前是关闭的）
    if (!isOpen) {
      header.setAttribute('aria-expanded', 'true');
      content.classList.add('open');
    }
  }
}
```

## 关键技术点深挖

### CSS Grid 动画技巧：grid-template-rows: 0fr → 1fr

这是 2024 年才被广泛接受的新技巧。传统做法用 JavaScript 计算 `scrollHeight` 再设置 `max-height`，要么卡顿要么需要魔法数字。CSS Grid 的 `0fr` 到 `1fr` 过渡完美解决了"auto height 动画"这一世纪难题：

```css
.accordion-content {
  display: grid;
  grid-template-rows: 0fr;  /* 关闭状态 */
  transition: grid-template-rows 0.4s ease;
}
.accordion-content.open {
  grid-template-rows: 1fr;  /* 打开状态 */
}
```

子元素 `.accordion-body` 设置 `overflow: hidden`，Grid 轨道从 0fr 过渡到 1fr 时，内容自然展开，完全不需要 JavaScript 参与高度计算。

## 常见坑点

**坑：用 display: none/block 切换，无法动画**  
`display` 属性的切换不参与 transition。必须让元素始终保持在渲染树中，只改变视觉尺寸。

**坑：忘记 aria-expanded 属性**  
屏幕阅读器用户无法判断当前状态。`aria-expanded="true/false"` 是强制要求。

**坑：点击已展开的面板时，先收再开导致闪烁**  
逻辑应该是：如果点击的是已经打开的面板，就关闭它（允许所有面板关闭）；如果点击的是关闭的面板，先关闭所有再打开当前。必须用 `isOpen` 标志位判断。

## 完整可复制代码

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Accordion</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, sans-serif; background: #f5f5f5; display: flex; justify-content: center; padding: 40px 20px; }
.accordion { max-width: 600px; width: 100%; display: flex; flex-direction: column; gap: 8px; }
.accordion-item { background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.accordion-header { width: 100%; background: none; border: none; padding: 18px 20px; font-size: 16px; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; color: #1a1a2e; }
.accordion-header:hover { background: #f8f9ff; }
.accordion-icon { font-size: 20px; transition: transform 0.3s; color: #666; }
.accordion-header[aria-expanded="true"] .accordion-icon { transform: rotate(45deg); }
.accordion-content { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.4s ease; }
.accordion-content.open { grid-template-rows: 1fr; }
.accordion-body { overflow: hidden; padding: 0 20px; color: #555; line-height: 1.7; }
.accordion-body p { padding-bottom: 18px; }
</style>
</head>
<body>
<div class="accordion">
  <div class="accordion-item">
    <button class="accordion-header" aria-expanded="false"><span>什么是手风琴组件？</span><span class="accordion-icon">+</span></button>
    <div class="accordion-content" role="region"><div class="accordion-body"><p>手风琴是一种可展开/收起的 UI 组件，常用于 FAQ 页面、设置面板等需要节省垂直空间的场景。它允许用户一次查看一个内容区块，避免信息过载。</p></div></div>
  </div>
  <div class="accordion-item">
    <button class="accordion-header" aria-expanded="false"><span>为什么不用 display: none？</span><span class="accordion-icon">+</span></button>
    <div class="accordion-content" role="region"><div class="accordion-body"><p>display 属性不参与 CSS transition，切换时不会有平滑动画。使用 grid-template-rows: 0fr/1fr 可以在保持元素可见的前提下实现流畅的高度过渡。</p></div></div>
  </div>
  <div class="accordion-item">
    <button class="accordion-header" aria-expanded="false"><span>支持键盘操作吗？</span><span class="accordion-icon">+</span></button>
    <div class="accordion-content" role="region"><div class="accordion-body"><p>完全支持。Tab 键在标题间移动，Enter 或 Space 键切换展开/收起状态。aria-expanded 属性确保屏幕阅读器能读取当前状态。</p></div></div>
  </div>
</div>
<script>
class Accordion {
  constructor(el) {
    this.el = el;
    this.headers = [...el.querySelectorAll('.accordion-header')];
    this.init();
  }
  init() {
    this.headers.forEach(h => {
      h.addEventListener('click', () => this.toggle(h));
      h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggle(h); } });
    });
  }
  toggle(header) {
    const content = header.nextElementSibling;
    const isOpen = content.classList.contains('open');
    this.headers.forEach(h => { h.setAttribute('aria-expanded', 'false'); h.nextElementSibling.classList.remove('open'); });
    if (!isOpen) { header.setAttribute('aria-expanded', 'true'); content.classList.add('open'); }
  }
}
document.querySelectorAll('.accordion').forEach(el => new Accordion(el));
</script>
</body>
</html>
```

## 变体拓展

1. **多面板同时展开**：去掉互斥逻辑，允许用户同时查看多个面板
2. **嵌套手风琴**：面板内部再嵌套一层手风琴（移动端侧边栏常用）
3. **动态加载版**：展开时才通过 API 加载内容（懒加载）

---

👉 83 个组件一键到手：[payhip.com/b/S9pj2](https://payhip.com/b/S9pj2) | 实时预览：[wdsega.github.io/web-components](https://wdsega.github.io/web-components)

---

## Accordion — A 20-Year-Old Pattern Everyone Gets Wrong

### The Hook

You open a FAQ page, click the first question — answer expands. Click the second — it also expands. Now two answers are visible, the page doubles in height, and the scrollbar appears. What you wanted was "clicking the second automatically collapses the first." That's an accordion, and 90% of custom implementations get the UX wrong.

### The Animation Problem

The core challenge: CSS transitions don't work with `height: auto`. Traditional solutions use JavaScript to read `scrollHeight` and set explicit pixel values, which is janky and fragile.

### The Modern Solution: CSS Grid Trick

```css
.accordion-content {
  display: grid;
  grid-template-rows: 0fr;      /* collapsed */
  transition: grid-template-rows 0.4s ease;
}
.accordion-content.open {
  grid-template-rows: 1fr;      /* expanded */
}
```

This technique, widely adopted since 2024, finally solves the auto-height animation problem without any JavaScript height calculation. The child element uses `overflow: hidden` and the grid track smoothly transitions from zero to its content size.

### Accessibility Requirements

- `aria-expanded="true/false"` on headers is mandatory
- Keyboard support: Enter/Space to toggle
- `role="region"` on content panels for screen reader navigation

👉 Live demo: [wdsega.github.io/web-components](https://wdsega.github.io/web-components) | Full bundle ¥9.99: [payhip.com/b/S9pj2](https://payhip.com/b/S9pj2)
