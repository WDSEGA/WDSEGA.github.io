---
layout: post
title: "图片对比滑块 | Component Deep Dive #36: Image Comparison Slider — Before/After Without Canvas"
date: 2026-07-06 12:00:00 +0800
categories: [组件深度解析, Component Deep Dive]
tags: [image-comparison, slider, before-after, webdev]
description: "图片对比滑块的核心是clip-path裁剪——两张图叠放，一张用CSS裁剪控制可见区域，拖拽手柄改变裁剪位置。"
author: 编译员
---

# 图片对比滑块 | Component Deep Dive #36: Image Comparison Slider

> 拖动中间的竖线，左边显示前一张图，右边显示后一张图。核心不是Canvas，而是clip-path。

图片对比滑块（Before/After Slider）在摄影、设计、装修、医疗影像中很常见：展示"处理前"和"处理后"的差异。用户拖动中间的分隔线，实时控制两张图片的可见区域。

## 核心原理

两张图片绝对定位叠放，底层是"处理后"的完整图片，顶层是"处理前"的图片，通过`clip-path`裁剪顶层图片只显示分隔线左侧的部分。拖拽手柄改变分隔线位置，同时更新`clip-path`的裁剪值。

```html
<div class="comparison-slider" id="slider">
  <img class="after" src="after.jpg" alt="After" />
  <img class="before" src="before.jpg" alt="Before" />
  <div class="handle">
    <div class="handle-line"></div>
    <div class="handle-circle">
      <svg width="24" height="24"><path d="M8 6L4 12L8 18M16 6L20 12L16 18" stroke="white" stroke-width="2" fill="none"/></svg>
    </div>
  </div>
</div>
```

```css
.comparison-slider {
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 16/9;
  cursor: ew-resize;
  user-select: none;
}

.comparison-slider img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none; /* Let drag events hit the container, not the images */
}

.before {
  clip-path: inset(0 50% 0 0); /* Show left half by default */
  z-index: 2;
}

.after {
  z-index: 1;
}

.handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  z-index: 3;
  transform: translateX(-50%);
  pointer-events: none;
}

.handle-line {
  width: 2px;
  height: 100%;
  background: white;
  margin: 0 auto;
  box-shadow: 0 0 4px rgba(0,0,0,0.3);
}

.handle-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

`clip-path: inset(0 50% 0 0)`的意思是：从右侧裁掉50%，只显示左侧50%。这是整个组件的核心——一个CSS属性替代了Canvas绘制、像素操作等复杂逻辑。

## 拖拽交互

支持鼠标、触屏和键盘三种交互方式：

```javascript
class ComparisonSlider {
  constructor(container) {
    this.container = container;
    this.beforeImg = container.querySelector('.before');
    this.handle = container.querySelector('.handle');
    this.pos = 50; // 0-100 percentage
    
    this.bindEvents();
    this.update(50);
  }
  
  bindEvents() {
    // Mouse
    this.container.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
    
    // Keyboard
    this.container.tabIndex = 0;
    this.container.addEventListener('keydown', (e) => this.onKeydown(e));
  }
  
  onPointerDown(e) {
    this.dragging = true;
    this.updateFromEvent(e);
  }
  
  onPointerMove(e) {
    if (!this.dragging) return;
    this.updateFromEvent(e);
  }
  
  onPointerUp() {
    this.dragging = false;
  }
  
  updateFromEvent(e) {
    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    this.update(Math.max(0, Math.min(100, percent)));
  }
  
  update(percent) {
    this.pos = percent;
    this.beforeImg.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
    this.handle.style.left = `${percent}%`;
  }
  
  onKeydown(e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.update(Math.max(0, this.pos - 2));
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.update(Math.min(100, this.pos + 2));
    }
  }
}
```

使用Pointer Events而非分别监听mouse和touch事件——`pointerdown/move/up`自动覆盖鼠标、触屏和触控笔。

## 关键细节

**1. `getBoundingClientRect()`而非`offsetWidth`**：拖拽时计算百分比要用`getBoundingClientRect().width`，因为`offsetWidth`是整数像素，而`getBoundingClientRect()`返回浮点数——在高DPI屏幕上，整数像素的误差会导致拖拽到边缘时百分比停在99.7%而非100%。

**2. `pointer-events: none`在图片上**：两张`<img>`必须设置`pointer-events: none`，否则鼠标事件会被图片拦截而非到达容器。如果图片上有可点击的标注或热点，这个设置需要调整。

**3. `user-select: none`**：拖拽时防止文本选中。容器和所有子元素都需要设置。

**4. 图片尺寸必须一致**：两张图片的宽高比必须相同。如果来源图片尺寸不同，用`object-fit: cover`统一裁剪到容器尺寸。

## 触屏优化

移动端有一个额外问题：滑块拖拽与页面滚动冲突。用户在滑块上上下滑动应该滚动页面，左右滑动应该拖拽滑块。

解决方案是判断滑动方向：

```javascript
onPointerDown(e) {
  this.startX = e.clientX;
  this.startY = e.clientY;
  this.dragging = false; // Don't start dragging yet
  this.mightDrag = true;
}

onPointerMove(e) {
  if (!this.mightDrag) return;
  
  const dx = Math.abs(e.clientX - this.startX);
  const dy = Math.abs(e.clientY - this.startY);
  
  if (!this.dragging && dx > 10 && dx > dy) {
    // Horizontal movement dominant: start dragging
    this.dragging = true;
    this.container.setPointerCapture(e.pointerId);
  }
  
  if (this.dragging) {
    e.preventDefault();
    this.updateFromEvent(e);
  }
}

onPointerUp(e) {
  this.mightDrag = false;
  this.dragging = false;
}
```

`setPointerCapture`确保后续的`pointermove`和`pointerup`事件都发送到这个元素，即使手指移出了滑块范围。

## 标签与无障碍

在两张图片上分别添加"Before"和"After"标签：

```html
<div class="label label-before">Before</div>
<div class="label label-after">After</div>
```

```css
.label {
  position: absolute;
  top: 12px;
  padding: 4px 12px;
  background: rgba(0,0,0,0.6);
  color: white;
  font-size: 14px;
  border-radius: 4px;
  z-index: 4;
  pointer-events: none;
}
.label-before { left: 12px; }
.label-after { right: 12px; }
```

无障碍方面，容器需要`role="slider"`、`aria-valuenow`、`aria-valuemin="0"`、`aria-valuemax="100"`，并随拖拽更新`aria-valuenow`值。

## 性能

`clip-path`的更新非常快——浏览器只需要重新计算裁剪区域，不需要重绘图片像素。在大多数设备上，拖拽时的帧率能稳定在60fps。不需要`requestAnimationFrame`节流，因为`pointermove`事件的频率已经被浏览器限制在了屏幕刷新率。

唯一需要注意的性能问题是大图加载：两张高分辨率图片可能各几MB。建议使用`loading="lazy"`和适当尺寸的缩略图，或使用`<picture>`元素提供响应式图片。

---

# Image Comparison Slider | Component Deep Dive #36: Image Comparison Slider — Before/After Without Canvas

> Drag the center line, left shows before, right shows after. The core isn't Canvas — it's clip-path.

The image comparison slider (Before/After Slider) is common in photography, design, renovation, and medical imaging: showing the difference between "before" and "after" states. Users drag a divider line to control the visible area of each image in real time.

## Core Principle

Two images are absolutely positioned and stacked. The bottom layer is the complete "after" image. The top layer is the "before" image, clipped with `clip-path` to show only the left side of the divider. Dragging the handle changes the divider position and updates the clip value.

```html
<div class="comparison-slider" id="slider">
  <img class="after" src="after.jpg" alt="After" />
  <img class="before" src="before.jpg" alt="Before" />
  <div class="handle">
    <div class="handle-line"></div>
    <div class="handle-circle">
      <svg width="24" height="24"><path d="M8 6L4 12L8 18M16 6L20 12L16 18" stroke="white" stroke-width="2" fill="none"/></svg>
    </div>
  </div>
</div>
```

```css
.comparison-slider {
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 16/9;
  cursor: ew-resize;
  user-select: none;
}

.comparison-slider img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.before {
  clip-path: inset(0 50% 0 0);
  z-index: 2;
}

.after {
  z-index: 1;
}

.handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  z-index: 3;
  transform: translateX(-50%);
  pointer-events: none;
}
```

`clip-path: inset(0 50% 0 0)` means: clip 50% from the right, showing only the left 50%. This single CSS property replaces Canvas drawing, pixel manipulation, and other complex logic.

## Drag Interaction

Supports mouse, touch, and keyboard:

```javascript
class ComparisonSlider {
  constructor(container) {
    this.container = container;
    this.beforeImg = container.querySelector('.before');
    this.handle = container.querySelector('.handle');
    this.pos = 50;
    
    this.bindEvents();
    this.update(50);
  }
  
  bindEvents() {
    this.container.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
    
    this.container.tabIndex = 0;
    this.container.addEventListener('keydown', (e) => this.onKeydown(e));
  }
  
  updateFromEvent(e) {
    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    this.update(Math.max(0, Math.min(100, percent)));
  }
  
  update(percent) {
    this.pos = percent;
    this.beforeImg.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
    this.handle.style.left = `${percent}%`;
  }
  
  onKeydown(e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.update(Math.max(0, this.pos - 2));
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.update(Math.min(100, this.pos + 2));
    }
  }
}
```

Using Pointer Events instead of separate mouse and touch listeners — `pointerdown/move/up` automatically covers mouse, touch, and stylus.

## Critical Details

**1. `getBoundingClientRect()` not `offsetWidth`**: When calculating the drag percentage, use `getBoundingClientRect().width` because `offsetWidth` returns integer pixels while `getBoundingClientRect()` returns floats — on high-DPI screens, integer pixel rounding causes the percentage to stop at 99.7% instead of 100% at the edge.

**2. `pointer-events: none` on images**: Both `<img>` elements must set `pointer-events: none`, otherwise mouse events hit the images instead of the container. If images have clickable annotations or hotspots, this needs adjustment.

**3. `user-select: none`**: Prevent text selection during drag. The container and all children need this.

**4. Identical image dimensions**: Both images must have the same aspect ratio. If source images differ in size, use `object-fit: cover` to crop uniformly.

## Touch Optimization

On mobile, there's an additional problem: slider dragging conflicts with page scrolling. Vertical swipes should scroll the page; horizontal swipes should drag the slider.

The solution is directional locking:

```javascript
onPointerDown(e) {
  this.startX = e.clientX;
  this.startY = e.clientY;
  this.dragging = false;
  this.mightDrag = true;
}

onPointerMove(e) {
  if (!this.mightDrag) return;
  
  const dx = Math.abs(e.clientX - this.startX);
  const dy = Math.abs(e.clientY - this.startY);
  
  if (!this.dragging && dx > 10 && dx > dy) {
    this.dragging = true;
    this.container.setPointerCapture(e.pointerId);
  }
  
  if (this.dragging) {
    e.preventDefault();
    this.updateFromEvent(e);
  }
}
```

`setPointerCapture` ensures subsequent `pointermove` and `pointerup` events are sent to this element even if the finger moves outside the slider.

## Labels and Accessibility

Add "Before" and "After" labels on each image:

```html
<div class="label label-before">Before</div>
<div class="label label-after">After</div>
```

For accessibility, the container needs `role="slider"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, with `aria-valuenow` updated as the user drags.

## Performance

`clip-path` updates are extremely fast — the browser only recalculates the clipping region without redrawing image pixels. On most devices, drag frame rate stays at 60fps. No `requestAnimationFrame` throttling is needed because `pointermove` events are already rate-limited to the screen refresh rate.

The only performance concern is large image loading: two high-resolution images may be several MB each. Use `loading="lazy"` and appropriately sized thumbnails, or `<picture>` elements for responsive images.
