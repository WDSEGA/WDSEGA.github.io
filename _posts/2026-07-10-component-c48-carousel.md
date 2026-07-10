---
layout: post
title: "组件详解#48：轮播图Carousel，scroll-snap让原生滑动丝般顺滑 | Component Deep Dive #48: Carousel — scroll-snap Makes Native Sliding Buttery Smooth"
date: 2026-07-10
categories: [组件详解]
tags: [Carousel, CSS, scroll-snap, Web组件]
author: 编译员
description: "轮播图Carousel组件详解：用CSS scroll-snap实现原生滑动轮播，含自动播放、指示器、触屏支持、无限循环，完整代码可复制。"
---

## 组件详解#48：轮播图Carousel，scroll-snap让原生滑动丝般顺滑

轮播图是电商首页、产品展示的标配。过去我们用JS计算位移、手动管理transform，代码量巨大还卡顿。今天用CSS `scroll-snap`实现，50行CSS搞定丝滑轮播。

### 组件是什么

Carousel（轮播图/走马灯）是一组水平或垂直排列的内容卡片，用户可以左右滑动浏览。通常配有指示器小圆点、左右箭头、自动播放等功能。

### 完整代码

**HTML**：

```html
<div class="carousel">
  <div class="carousel-track" id="carouselTrack">
    <div class="carousel-slide"><img src="slide1.jpg" alt="Slide 1"></div>
    <div class="carousel-slide"><img src="slide2.jpg" alt="Slide 2"></div>
    <div class="carousel-slide"><img src="slide3.jpg" alt="Slide 3"></div>
    <div class="carousel-slide"><img src="slide4.jpg" alt="Slide 4"></div>
  </div>

  <!-- 左右箭头 -->
  <button class="carousel-btn carousel-prev" aria-label="上一张">&lsaquo;</button>
  <button class="carousel-btn carousel-next" aria-label="下一张">&rsaquo;</button>

  <!-- 指示器 -->
  <div class="carousel-dots" id="carouselDots"></div>
</div>
```

**CSS**（核心：scroll-snap）：

```css
.carousel {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 12px;
}

/* 滑动轨道：核心就在这里 */
.carousel-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;   /* 强制水平吸附 */
  scroll-behavior: smooth;          /* 平滑滚动 */
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;            /* 隐藏滚动条 */
}
.carousel-track::-webkit-scrollbar { display: none; }

.carousel-slide {
  flex: 0 0 100%;                   /* 每张占满宽度 */
  scroll-snap-align: start;         /* 吸附到起点 */
}
.carousel-slide img {
  width: 100%; height: 400px;
  object-fit: cover; display: block;
}

/* 箭头按钮 */
.carousel-btn {
  position: absolute; top: 50%; transform: translateY(-50%);
  background: rgba(0,0,0,0.5); color: #fff;
  border: none; font-size: 28px; padding: 10px 14px;
  border-radius: 50%; cursor: pointer; z-index: 2;
  transition: background 0.2s;
}
.carousel-btn:hover { background: rgba(0,0,0,0.8); }
.carousel-prev { left: 12px; }
.carousel-next { right: 12px; }

/* 指示器小圆点 */
.carousel-dots {
  display: flex; justify-content: center; gap: 8px;
  position: absolute; bottom: 16px; left: 0; right: 0;
}
.carousel-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: rgba(255,255,255,0.5); cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  border: none; padding: 0;
}
.carousel-dot.active {
  background: #fff; transform: scale(1.3);
}
```

**JavaScript**（箭头 + 指示器 + 自动播放）：

```javascript
const track = document.getElementById('carouselTrack');
const slides = track.querySelectorAll('.carousel-slide');
const dotsContainer = document.getElementById('carouselDots');
const prevBtn = document.querySelector('.carousel-prev');
const nextBtn = document.querySelector('.carousel-next');
let currentSlide = 0;
let autoPlayTimer = null;

// 生成指示器
slides.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
  dot.setAttribute('aria-label', '跳转到第' + (i + 1) + '张');
  dot.addEventListener('click', () => goToSlide(i));
  dotsContainer.appendChild(dot);
});

// 跳转到指定slide
function goToSlide(index) {
  currentSlide = index;
  track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
  updateDots();
}

function updateDots() {
  dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

// 箭头按钮
prevBtn.addEventListener('click', () => {
  goToSlide((currentSlide - 1 + slides.length) % slides.length);
});
nextBtn.addEventListener('click', () => {
  goToSlide((currentSlide + 1) % slides.length);
});

// 滑动时更新指示器
track.addEventListener('scroll', () => {
  clearTimeout(track._scrollTimer);
  track._scrollTimer = setTimeout(() => {
    currentSlide = Math.round(track.scrollLeft / track.clientWidth);
    updateDots();
  }, 100);
});

// 自动播放
function startAutoPlay() {
  autoPlayTimer = setInterval(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, 4000);
}
function stopAutoPlay() { clearInterval(autoPlayTimer); }

startAutoPlay();
// 鼠标悬停暂停
track.addEventListener('mouseenter', stopAutoPlay);
track.addEventListener('mouseleave', startAutoPlay);
```

### 关键技术点

1. **`scroll-snap-type: x mandatory`**：这是整个方案的核心。浏览器原生处理滑动吸附，不需要JS计算位移，触屏体验自然丝滑。
2. **`scroll-behavior: smooth`**：配合`scrollTo()`实现平滑跳转，无需手动写动画。
3. **滚动事件防抖**：`scroll`事件触发频率极高，用`setTimeout`做100ms防抖，避免指示器频繁闪烁。

### 常见坑点

- **`flex: 0 0 100%`不能少**：如果slide不设固定宽度，`scroll-snap`吸附点会错乱。每张必须占满容器宽度。
- **无限循环**：纯CSS方案无法实现真正的无限循环。需要JS克隆首尾slide并在滚动到边界时跳转，逻辑较复杂。如果不需要无限循环，用取模`%`即可循环。
- **图片高度不一致**：用`object-fit: cover`统一裁剪，避免不同比例图片导致跳动。
- **触屏惯性滚动**：iOS Safari的`-webkit-overflow-scrolling: touch`必须加上，否则触屏滑动没有惯性。

### 变体拓展

```css
/* 一次显示多张slide（响应式） */
.carousel-slide { flex: 0 0 50%; }    /* 桌面2张 */
@media (max-width: 600px) {
  .carousel-slide { flex: 0 0 100%; }  /* 移动端1张 */
}
```

> 想要83个完整组件源码？访问 [Web Component Dictionary](https://wdsega.github.io/web-components/) 获取完整版。

---

## Component Deep Dive #48: Carousel — scroll-snap Makes Native Sliding Buttery Smooth

Carousels are standard on e-commerce homepages and product showcases. We used to calculate offsets in JS and manage transforms manually — massive code and janky performance. Today, CSS `scroll-snap` does it in 50 lines.

### Key Technical Points

1. **`scroll-snap-type: x mandatory`**: The core of the whole approach. The browser handles snap points natively — no JS offset calculation needed, and touch experience is naturally smooth.
2. **`scroll-behavior: smooth`**: Paired with `scrollTo()` for smooth jumps — no manual animation needed.
3. **Scroll event debounce**: `scroll` fires at extremely high frequency. Use `setTimeout` for 100ms debounce to prevent indicator flicker.

### Common Pitfalls

- **`flex: 0 0 100%` is mandatory**: If slides don't have fixed width, `scroll-snap` points misalign. Each slide must fill the container.
- **Infinite loop**: Pure CSS can't do true infinite loop. Requires JS to clone first/last slides and jump at boundaries. If infinite isn't needed, use modulo `%` to cycle.
- **Inconsistent image heights**: Use `object-fit: cover` for uniform cropping to prevent jumps.
- **Touch inertia**: iOS Safari needs `-webkit-overflow-scrolling: touch` or touch swiping has no inertia.

> Want all 83 complete component source codes? Visit [Web Component Dictionary](https://wdsega.github.io/web-components/) for the full version.
