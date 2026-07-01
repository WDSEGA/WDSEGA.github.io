---
layout: post
title: "组件详解#19：星级评分，5颗星背后的CSS颜色魔法 | Component Deep Dive #19: Star Rating — The CSS Color Magic Behind 5 Stars"
date: 2026-07-01 08:00:00 +0800
categories: [component, frontend]
tags: [css, javascript, ui, component]
author: 编译员
---

每一个电商产品页都有它——5颗星，简单到显眼，复杂到你真的动手写的那一刻。

星级评分不只是"显示几个金色星星"，它还需要悬停预览、点击锁定、半星支持、键盘可访问……每一项都有坑。

## 核心CSS技巧

关键就两行：

```css
.ef-star.hovered,
.ef-star.selected {
  color: #f59e0b; /* 金色 */
}
.ef-star:hover {
  transform: scale(1.2);
}
```

不用图片，不用SVG雪碧图，用Unicode字符 `★` 配合CSS颜色切换即可。浏览器支持完美，IE9+都没问题。

## JS核心逻辑

状态分两层：**悬停预览态**和**选中锁定态**。

```javascript
let currentRating = 0;

function updateDisplay(hoverIndex, selectedIndex) {
  stars.forEach((star, i) => {
    const filled = hoverIndex > 0 ? i < hoverIndex : i < selectedIndex;
    star.classList.toggle('selected', i < selectedIndex);
    star.classList.toggle('hovered', hoverIndex > 0 && i < hoverIndex);
  });
}

stars.forEach((star, i) => {
  star.addEventListener('mouseenter', () => updateDisplay(i + 1, currentRating));
  star.addEventListener('mouseleave', () => updateDisplay(0, currentRating));
  star.addEventListener('click', () => {
    currentRating = i + 1;
    updateDisplay(0, currentRating);
  });
});
```

注意：`mouseleave` 时 `hoverIndex=0`，回退到 `selectedIndex` 渲染。

## 四个必踩的坑

**坑1：忘了 `user-select: none`**

拖拽鼠标时会选中文字，UI很丑。加一行：

```css
.star-container {
  user-select: none;
}
```

**坑2：用 `input[type=radio]` 做可访问性**

理论上正确，实践中CSS样式控制极其痛苦，跨浏览器一致性差。更好方案：用 `role="radiogroup"` + `role="radio"` + `aria-label` 手工实现。

**坑3：值没有存入 `data-*`**

提交表单时找不到评分值。养成习惯：

```html
<div class="star-container" data-rating="0">
```

每次点击后更新 `data-rating`，表单提交直接读取。

**坑4：半星方案走弯路**

伪元素 `:before` + `clip-path` 是常见方案，但复杂且维护成本高。如果产品不要求半星，直接整星最可靠。

## 可访问性三件套

```html
<div role="radiogroup" aria-label="Rating">
  <span role="radio" aria-label="1 star" tabindex="0">★</span>
  <span role="radio" aria-label="2 stars" tabindex="0">★</span>
  <!-- ... -->
</div>
```

加 `keydown` 事件支持 `Enter` 和 `Space` 按键，屏幕阅读器用户才能正常操作。

---

*English below*

---

Every product page has it. Five stars. Simple to look at, tricky to implement correctly.

## The CSS Trick

Just two critical rules — toggle a CSS class on stars to switch between gold and gray:

```css
.ef-star.hovered, .ef-star.selected { color: #f59e0b; }
.ef-star:hover { transform: scale(1.2); }
```

Use the Unicode character `★` with color switching. No images, no SVG sprites needed.

## The JS Logic

Two layers of state: **hover preview** and **click lock**:

```javascript
stars.forEach((star, i) => {
  star.addEventListener('mouseenter', () => updateDisplay(i+1, currentRating));
  star.addEventListener('mouseleave', () => updateDisplay(0, currentRating));
  star.addEventListener('click', () => {
    currentRating = i+1;
    updateDisplay(0, currentRating);
  });
});
```

## Key Pitfalls

- Always add `user-select: none` to prevent text selection on drag
- Don't use native `input[type=radio]` — CSS styling is a nightmare
- Store current value in `data-rating` attribute for form submission
- Add `role="radiogroup"` and keyboard support for accessibility

The full bilingual article and live demo are at [wdsega.github.io](https://wdsega.github.io).
