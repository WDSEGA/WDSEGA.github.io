---
layout: post
title: "c11-分割线组件 Divider | 布局的无声边界"
date: 2026-06-28 08:00:00 +0800
categories: [组件, Web Component Dictionary]
tags: [divider, css, web-components, frontend]
---


> **Web Component Dictionary v2.0 · 网页组件活字典**  
> 83个组件/8大分类/中英双语/实时预览/单文件无依赖  
> [在线体验](https://wdsega.github.io/web-components) | [购买 ¥9.99](https://payhip.com/b/S9pj2)



一条线，隔开两个世界。分割线是最低调的组件，但少了它，页面就会变成一锅粥。

## 组件是什么

Divider（分割线）是用于在内容块之间创建视觉分隔的水平或垂直线条。它既是功能性组件（明确分组边界），也是美学组件（增加空间节奏感）。

## 四种形态

```html
<!-- 1. 基础水平线 -->
<hr class="divider">

<!-- 2. 带文字的分割线 -->
<div class="divider-text">或者</div>

<!-- 3. 垂直分割线 -->
<div style="display:flex;align-items:center;gap:16px">
  <span>首页</span>
  <div class="divider-v"></div>
  <span>关于</span>
</div>

<!-- 4. 装饰性分割线 -->
<div class="divider-fancy"></div>
```

## CSS 实现

```css
/* 基础水平线 */
.divider {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 24px 0;
}

/* 带文字 */
.divider-text {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0;
  color: #9ca3af;
  font-size: 14px;
}
.divider-text::before,
.divider-text::after {
  content: '';
  flex: 1;
  border-top: 1px solid #e5e7eb;
}

/* 垂直 */
.divider-v {
  width: 1px;
  height: 1em;
  background: #e5e7eb;
  display: inline-block;
}

/* 装饰性（渐变淡出） */
.divider-fancy {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent);
  margin: 24px 0;
}

/* 虚线 */
.divider-dashed {
  border-top: 1px dashed #d1d5db;
}

/* 加粗强调 */
.divider-bold {
  border-top: 2px solid #1f2937;
}
```

## 关键技术点

**带文字分割线的Flex技巧**：用`flex:1`的伪元素自动填满两侧空间，不需要计算宽度，响应式友好。

**`<hr>` vs `<div>`**：
- `<hr>` 有语义（主题切换），屏幕阅读器会朗读"分隔符"
- `<div>` 纯装饰时用，加`role="separator"` + `aria-hidden="true"`

## 常见坑点

1. `<hr>` 的默认样式各浏览器不同，必须`border:none; border-top:1px solid`覆盖
2. 垂直分割线`height`用`1em`比`px`更好，随父元素字号自适应
3. 带文字的分割线不要把文字放在`<hr>`里——没有这种用法，用flex方案

---

*本文组件收录于 [Web Component Dictionary v2.0](https://payhip.com/b/S9pj2)，83个实用组件，¥9.99即可获取全套。*

---

## Divider Component - The Silent Boundary of Layout


> **Web Component Dictionary v2.0**  
> 83 components / 8 categories / bilingual / live preview / zero dependencies  
> [Live Demo](https://wdsega.github.io/web-components) | [Buy $1.38](https://payhip.com/b/S9pj2)



The most overlooked component that makes or breaks layout rhythm.

### Text Divider Trick

```css
.divider-text {
  display: flex;
  align-items: center;
  gap: 16px;
}
.divider-text::before,
.divider-text::after {
  content: '';
  flex: 1;
  border-top: 1px solid #e5e7eb;
}
```

The `flex: 1` pseudo-elements auto-fill both sides. No width calculation needed.

### `<hr>` vs `<div>`

- `<hr>`: semantic, signals topic change, screen readers announce it
- `<div role="separator" aria-hidden="true">`: purely decorative

*Part of [Web Component Dictionary v2.0](https://payhip.com/b/S9pj2)*
