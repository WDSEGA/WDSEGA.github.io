---
layout: post
title: "组件详解#46：折叠面板Accordion，纯CSS手风琴展开收起那点事 | Component Deep Dive #46: Accordion — Pure CSS Expand/Collapse Without a Line of JS"
date: 2026-07-10
categories: [组件详解]
tags: [Accordion, CSS, Web组件, 前端]
author: 编译员
description: "折叠面板Accordion组件详解：用details/summary或input checkbox技巧实现纯CSS手风琴，含动画、ARIA、嵌套等完整代码。"
---

## 组件详解#46：折叠面板Accordion，纯CSS手风琴展开收起那点事

你点过FAQ页面吗？点一下问题展开答案，再点收起。这个交互就叫Accordion（折叠面板/手风琴）。今天我们不用任何JS，纯HTML+CSS搞定它。

### 组件是什么

Accordion是一组可折叠的内容面板，同一时间可以展开一个或多个。用户点击标题栏即可展开/收起对应内容区域。常见于FAQ、设置面板、导航菜单、产品详情等场景。

### 效果预览

```html
<!-- 方案一：原生details/summary（最简单） -->
<details class="acc-item" open>
  <summary class="acc-header">什么是Accordion组件？</summary>
  <div class="acc-content">
    <p>Accordion是一组可折叠的内容面板，点击标题栏展开或收起内容。</p>
  </div>
</details>

<details class="acc-item">
  <summary class="acc-header">什么时候该用Accordion？</summary>
  <div class="acc-content">
    <p>当内容可以分组为独立模块，且用户不需要同时看到所有内容时使用。FAQ是最典型的场景。</p>
  </div>
</details>
```

### 代码拆解

**HTML**：使用原生`<details>`和`<summary>`标签，零JS即可实现展开收起。`open`属性控制默认展开状态。

**CSS**：

```css
/* 基础样式 */
.acc-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
}

/* 标题栏 */
.acc-header {
  padding: 14px 18px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  list-style: none;          /* 移除默认三角箭头 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  transition: background 0.2s;
}

.acc-header::-webkit-details-marker { display: none; }

.acc-header:hover { background: #f1f5f9; }

/* 自定义箭头：用伪元素实现旋转动画 */
.acc-header::after {
  content: '+';
  font-size: 20px;
  font-weight: 300;
  color: #64748b;
  transition: transform 0.3s ease;
}

.acc-item[open] .acc-header::after {
  transform: rotate(45deg);  /* + 旋转45度变成 × */
}

/* 内容区域 */
.acc-content {
  padding: 0 18px;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
}

.acc-item[open] .acc-content {
  padding: 14px 18px;
  max-height: 500px;         /* 足够大的值 */
}
```

### 关键技术点

1. **原生vs JS**：`<details>`/`<summary>`是浏览器原生支持的折叠组件，无需JS。但如果需要"一次只展开一个"的手风琴模式，需要少量JS。
2. **箭头动画**：用`::after`伪元素配合`transform: rotate()`实现+号变×号的效果，比SVG图标更轻量。
3. **展开动画**：`details`默认没有展开动画。用`max-height`过渡模拟，但需要注意`max-height`必须设置一个足够大的值，否则内容会被截断。

### 常见坑点

- **`max-height`陷阱**：如果内容高度超过`max-height`设定值，多余部分会被隐藏。解决方案：设置足够大的值（如9999px），但过渡动画会偏快。更好的方案是用JS测量实际高度。
- **嵌套Accordion**：子Accordion的`max-height`会影响父级的展开高度。需要确保父级的`max-height`足够大，或改用JS方案。
- **Safari兼容**：`<details>`在Safari中需要添加`display: list-item`给`<summary>`才能正常显示。

### 变体拓展

```javascript
// 手风琴模式：一次只展开一个
document.querySelectorAll('.acc-item').forEach(item => {
  item.addEventListener('toggle', function() {
    if (this.open) {
      document.querySelectorAll('.acc-item').forEach(other => {
        if (other !== this) other.open = false;
      });
    }
  });
});
```

加上这段JS，就变成了经典的手风琴模式——展开一个自动收起其他。

> 想要83个完整组件源码？访问 [Web Component Dictionary](https://wdsega.github.io/web-components/) 获取完整版。

---

## Component Deep Dive #46: Accordion — Pure CSS Expand/Collapse Without a Line of JS

You've clicked an FAQ page before — click a question, the answer expands; click again, it collapses. That interaction is called an Accordion. Today we'll build it with zero JS, pure HTML + CSS.

### What It Is

An Accordion is a set of collapsible content panels where one or more can be expanded at a time. Users click a header bar to expand/collapse the corresponding content. Common in FAQs, settings panels, navigation menus, and product details.

### Key Technical Points

1. **Native vs JS**: `<details>`/`<summary>` are browser-native collapse components requiring no JS. But for "one-at-a-time" accordion mode, a small amount of JS is needed.
2. **Arrow animation**: Use `::after` pseudo-element with `transform: rotate()` to turn + into x — lighter than SVG icons.
3. **Expand animation**: `details` has no native expand animation. Use `max-height` transition to simulate, but set a large enough value.

### Common Pitfalls

- **`max-height` trap**: If content exceeds the set value, overflow gets hidden. Solution: set a large value (e.g., 9999px), but animation may feel too fast. Better: use JS to measure actual height.
- **Nested accordions**: Child accordion `max-height` affects parent expansion height. Ensure parent `max-height` is large enough, or switch to JS.
- **Safari compat**: `<details>` needs `display: list-item` on `<summary>` in Safari to display correctly.

### Variant Extension

```javascript
// Accordion mode: only one open at a time
document.querySelectorAll('.acc-item').forEach(item => {
  item.addEventListener('toggle', function() {
    if (this.open) {
      document.querySelectorAll('.acc-item').forEach(other => {
        if (other !== this) other.open = false;
      });
    }
  });
});
```

Add this JS for classic accordion mode — opening one auto-closes the others.

> Want all 83 complete component source codes? Visit [Web Component Dictionary](https://wdsega.github.io/web-components/) for the full version.
