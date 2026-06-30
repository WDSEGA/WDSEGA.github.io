---
layout: post
title: "c18-图片灯箱组件 Image Lightbox | 100行代码实现点击放大，比插件轻100倍"
date: 2026-06-30 08:20:00 +0800
categories: [组件, Web Component Dictionary]
tags: [lightbox, image, gallery, javascript]
---

> **Web Component Dictionary v2.0 · 网页组件活字典**
> 83个组件 / 8大分类 / 中英双语 / 实时预览 / 单文件无依赖
> [在线体验](https://wdsega.github.io/web-components) | [购买 ¥9.99](https://payhip.com/b/S9pj2)


你的产品页有10张截图，用户想看大图细节——不需要引入一个50KB的Lightbox插件。100行原生JS，支持缩略图点击、键盘导航、手势关闭，比任何库都干净。

## 组件是什么

Image Lightbox（图片灯箱）在用户点击缩略图时，覆盖一个全屏遮罩层展示原图。核心功能：打开/关闭动画、键盘ESC关闭、点击遮罩关闭、移动端手势支持。

## HTML结构

```html
<!-- 缩略图网格 -->
<div class="gallery">
  <img src="thumbnail-1.jpg" data-full="full-1.jpg" 
       onclick="openLightbox(this)" alt="Screenshot 1">
  <img src="thumbnail-2.jpg" data-full="full-2.jpg" 
       onclick="openLightbox(this)" alt="Screenshot 2">
  <img src="thumbnail-3.jpg" data-full="full-3.jpg" 
       onclick="openLightbox(this)" alt="Screenshot 3">
</div>

<!-- 灯箱遮罩 -->
<div id="lightbox" class="lightbox" onclick="closeLightbox()">
  <span class="lb-close">&times;</span>
  <button class="lb-prev" onclick="event.stopPropagation();navigateLightbox(-1)">‹</button>
  <img id="lb-img" class="lb-img" src="" alt="">
  <button class="lb-next" onclick="event.stopPropagation();navigateLightbox(1)">›</button>
  <p class="lb-caption" id="lb-caption"></p>
</div>
```

## CSS核心

```css
.lightbox {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 9999;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.lightbox.active {
  display: flex;
}

.lb-img {
  max-width: 90%;
  max-height: 80vh;
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.lb-prev, .lb-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: none;
  font-size: 36px;
  padding: 12px 18px;
  cursor: pointer;
  border-radius: 4px;
}

.lb-prev { left: 20px; }
.lb-next { right: 20px; }

.lb-close {
  position: absolute;
  top: 20px;
  right: 30px;
  font-size: 40px;
  color: #fff;
  cursor: pointer;
}

.lb-caption {
  color: #fff;
  margin-top: 16px;
  font-size: 14px;
}
```

## JavaScript核心

```javascript
let currentImages = [];
let currentIndex = 0;

function openLightbox(img) {
  // 收集所有可导航的图片
  currentImages = Array.from(document.querySelectorAll('.gallery img'));
  currentIndex = currentImages.indexOf(img);
  
  updateLightboxImage();
  
  const lb = document.getElementById('lightbox');
  lb.classList.add('active');
  document.body.style.overflow = 'hidden'; // 禁止背景滚动
}

function updateLightboxImage() {
  const img = currentImages[currentIndex];
  document.getElementById('lb-img').src = img.dataset.full || img.src;
  document.getElementById('lb-caption').textContent = img.alt || '';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}

function navigateLightbox(direction) {
  currentIndex = (currentIndex + direction + currentImages.length) % currentImages.length;
  updateLightboxImage();
}

// 键盘导航
document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox');
  if (!lb.classList.contains('active')) return;
  
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') navigateLightbox(-1);
  if (e.key === 'ArrowRight') navigateLightbox(1);
});
```

## 移动端手势

```javascript
let touchStartX = 0;

document.getElementById('lightbox').addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});

document.getElementById('lightbox').addEventListener('touchend', (e) => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) {
    navigateLightbox(diff > 0 ? 1 : -1); // 左滑=下一张，右滑=上一张
  }
});
```

## 渐进式加载：先用缩略图占位

```javascript
function updateLightboxImage() {
  const img = currentImages[currentIndex];
  const lbImg = document.getElementById('lb-img');
  
  // 先用缩略图快速显示，然后替换为高清图
  lbImg.src = img.src;
  const fullSrc = img.dataset.full;
  if (fullSrc && fullSrc !== img.src) {
    const hdImg = new Image();
    hdImg.onload = () => { lbImg.src = fullSrc; };
    hdImg.src = fullSrc;
  }
}
```

## 为什么不用插件

| 方案 | 体积 | 依赖 | 自定义 |
|------|------|------|--------|
| Lightbox2 | 50KB+ | jQuery | 受限 |
| Fancybox | 80KB+ | 无 | 中等 |
| **原生实现** | **<2KB** | **0** | **完全自由** |

100行原生JS覆盖90%使用场景，剩下10%的边角需求不值得引入一个第三方依赖。

---

## Image Lightbox: 100 Lines of Vanilla JS, 100x Lighter Than Any Plugin

Your product page has 10 screenshots. Users want to see details — no need for a 50KB Lightbox plugin. 100 lines of vanilla JS handles thumbnail clicks, keyboard nav, and swipe gestures.

### What It Is

A fullscreen overlay triggered by clicking thumbnails. Core features: open/close animation, ESC to close, click-to-dismiss, left/right navigation, touch swipe support.

### The Code

```javascript
function openLightbox(img) {
  currentImages = Array.from(document.querySelectorAll('.gallery img'));
  currentIndex = currentImages.indexOf(img);
  updateLightboxImage();
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
}

document.addEventListener('keydown', (e) => {
  if (!lb.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') navigateLightbox(-1);
  if (e.key === 'ArrowRight') navigateLightbox(1);
});
```

### Progressive Loading
Show thumbnail first, then swap to full-res once loaded — users never see a blank screen.

### Why Not a Plugin
- Lightbox2: 50KB + jQuery dependency
- Fancybox: 80KB, complex config
- **Vanilla JS: <2KB, zero deps, total freedom**

---

*本文是 Web Component Dictionary 组件介绍系列第18篇。查看全部83个组件：[在线体验](https://wdsega.github.io/web-components)*
