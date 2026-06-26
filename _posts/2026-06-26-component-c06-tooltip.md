---
layout: post
title: "组件详解#18：Tooltip提示，一行CSS就能解决的问题为什么要写50行JS | Component Deep Dive #18: Tooltip — Why Write 50 Lines of JS When One Line of CSS Works?"
date: 2026-06-26 10:30:00 +0800
categories: blog
tags: [代码产品, web components, tooltip, css, accessibility, javascript]
canonical_url: https://wdsega.github.io/2026/06/26/component-c06-tooltip/
---

## 产品介绍

本文组件来自 **Web Component Dictionary v2.0 · 网页组件活字典**，83 组件 / 8 分类 / 中英双语 / 实时预览 / 单文件无依赖。  
在线体验：[wdsega.github.io/web-components](https://wdsega.github.io/web-components) | 购买：[payhip.com/b/S9pj2](https://payhip.com/b/S9pj2) 仅 ¥9.99

---

## 钩子

按钮上有个图标，用户不知道它是什么意思。你把鼠标悬停上去——什么都没发生。你点击它——页面跳转了。这就是缺 Tooltip 的代价：用户焦虑、误操作、流失。Tooltip 是 Web 上最小的 UI 组件，但它的可访问性要求比表面上复杂得多。

## 组件是什么

Tooltip 是一个悬浮提示标签，当用户将鼠标悬停或键盘聚焦到某个元素时出现，移开时消失。它用于解释图标按钮的功能、缩写词的全称、或提供不打断操作的辅助信息。

## 代码拆解

### CSS-only Tooltip（最简单）

```html
<button class="tooltip-trigger" data-tooltip="保存当前文档">
  💾
</button>
```

```css
.tooltip-trigger { position: relative; }
.tooltip-trigger::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 12px;
  background: #333;
  color: #fff;
  font-size: 13px;
  border-radius: 6px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}
.tooltip-trigger:hover::after,
.tooltip-trigger:focus-visible::after {
  opacity: 1;
}
```

## 关键技术点

### CSS vs JavaScript Tooltip

| 方案 | 优点 | 缺点 |
|------|------|------|
| CSS `::after` + `attr()` | 零 JS、性能好、简单 | 不支持多行、不支持 HTML、无法动态定位 |
| JavaScript Popper.js | 智能定位、支持 HTML | 需要库依赖 |

对于绝大多数场景，CSS-only 足够且更好。只在需要智能翻转定位（例如 Tooltip 靠近屏幕边缘时自动翻到下方）时才需要 JavaScript。

### 键盘可访问性

CSS `:hover` 触发的 Tooltip 对键盘用户无效。必须加上 `:focus-visible`，并且触发元素必须是可聚焦的（`<button>` 或 `tabindex="0"`）。

## 常见坑点

- 忘记 `pointer-events: none`，导致 Tooltip 遮挡下方按钮无法点击
- 用 `title` 属性代替 Tooltip——`title` 在移动端完全不可用
- Tooltip 内容太长——Tooltip 不是迷你文档，控制在 15 字以内

## 完整可复制代码

```html
<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Tooltip</title>
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;gap:20px;background:#f0f2f5}
.btn{width:56px;height:56px;border-radius:12px;border:none;background:#fff;font-size:24px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.1);position:relative}
.tooltip::after{content:attr(data-tooltip);position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%);padding:6px 14px;background:#1a1a2e;color:#fff;font-size:13px;border-radius:6px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .25s}
.tooltip::before{content:'';position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);border:6px solid transparent;border-top-color:#1a1a2e;opacity:0;pointer-events:none;transition:opacity .25s}
.tooltip:hover::after,.tooltip:hover::before,.tooltip:focus-visible::after,.tooltip:focus-visible::before{opacity:1}
</style></head><body>
<button class="btn tooltip" data-tooltip="保存文档" aria-label="保存">💾</button>
<button class="btn tooltip" data-tooltip="撤销上一步" aria-label="撤销">↩️</button>
<button class="btn tooltip" data-tooltip="分享链接" aria-label="分享">🔗</button>
<button class="btn tooltip" data-tooltip="下载文件" aria-label="下载">📥</button>
</body></html>
```

## 变体拓展

1. **富文本 Tooltip**：支持 HTML 内容，显示图片或格式化文本
2. **智能定位 Tooltip**：检测屏幕边缘自动翻转位置（上/下/左/右）
3. **长按触发 Tooltip**：移动端使用 `touchstart`/`touchend` 模拟悬停

---

👉 83 个组件一键到手：[payhip.com/b/S9pj2](https://payhip.com/b/S9pj2) | 实时预览：[wdsega.github.io/web-components](https://wdsega.github.io/web-components)

---

## Tooltip — The Web's Smallest (and Most Misunderstood) Component

A button has an icon. The user doesn't know what it means. They hover — nothing. They click — the page navigates away. That's the cost of a missing tooltip: anxiety, misclicks, churn.

### CSS-Only Wins

```css
.tooltip::after {
  content: attr(data-tooltip);
  opacity: 0;
  transition: opacity 0.25s;
  pointer-events: none; /* Critical: don't block clicks */
}
.tooltip:hover::after, .tooltip:focus-visible::after {
  opacity: 1;
}
```

For 90% of use cases, CSS `::after` + `attr()` is simpler, faster, and more reliable than any JS library. Only reach for Popper.js when you need intelligent edge-flip positioning.

### Accessibility

- Use `:focus-visible` alongside `:hover` for keyboard users
- Always add `aria-label` to the trigger element as fallback (screen readers may not announce CSS tooltips)
- Never use `title` attribute — it's invisible on mobile

👉 Full bundle ¥9.99: [payhip.com/b/S9pj2](https://payhip.com/b/S9pj2)
