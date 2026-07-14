---
title: "组件c63：滚动渐入 | Component c63: Scroll Reveal"
layout: post
date: 2026-07-15
categories: [组件, 前端]
tags: [javascript, intersection-observer, animation, scroll]
---

> 用户往下滑页面，内容像被施了魔法一样缓缓浮现——滚动渐入是提升页面质感成本最低的动画。

## 这是什么

滚动渐入（Scroll Reveal）是指当元素进入视口时触发动画效果（淡入、上滑、缩放等），离开视口时可选重置。它能引导用户注意力，让长页面不再是一堵文字墙。

## 效果预览

```
[滚动前] 元素不可见（opacity: 0, translateY: 40px）
     ↓ 用户滚动到元素位置
[滚动后] 元素淡入上滑（opacity: 1, translateY: 0, transition: 0.6s）
```

## 代码拆解

### HTML

```html
<div class="reveal" data-reveal="fade-up" data-delay="0">第一块内容</div>
<div class="reveal" data-reveal="fade-up" data-delay="100">第二块内容</div>
<div class="reveal" data-reveal="scale-in" data-delay="200">第三块内容</div>
<div class="reveal" data-reveal="slide-left" data-delay="0">第四块内容</div>
```

### CSS

```css
/* 基础隐藏状态 */
.reveal {
  opacity: 0;
  transition: opacity 0.6s ease, transform 0.6s ease;
  will-change: opacity, transform;
}

/* 动画类型 */
.reveal[data-reveal="fade-up"] {
  transform: translateY(40px);
}

.reveal[data-reveal="fade-down"] {
  transform: translateY(-40px);
}

.reveal[data-reveal="slide-left"] {
  transform: translateX(60px);
}

.reveal[data-reveal="slide-right"] {
  transform: translateX(-60px);
}

.reveal[data-reveal="scale-in"] {
  transform: scale(0.85);
}

.reveal[data-reveal="blur-in"] {
  filter: blur(12px);
  transition: opacity 0.6s ease, transform 0.6s ease, filter 0.6s ease;
}

/* 激活状态 */
.reveal.is-visible {
  opacity: 1;
  transform: translate(0, 0) scale(1);
  filter: blur(0);
}
```

### JavaScript

```javascript
class ScrollReveal {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.15;
    this.once = options.once !== false;
    this.selector = options.selector || '.reveal';

    this.elements = document.querySelectorAll(this.selector);
    this.observer = new IntersectionObserver(
      entries => this.onIntersect(entries),
      {
        threshold: this.threshold,
        rootMargin: options.rootMargin || '0px 0px -50px 0px'
      }
    );

    this.elements.forEach(el => {
      const delay = parseInt(el.dataset.delay) || 0;
      if (delay) {
        el.style.transitionDelay = `${delay}ms`;
      }
      this.observer.observe(el);
    });
  }

  onIntersect(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        if (this.once) {
          this.observer.unobserve(entry.target);
        }
      } else if (!this.once) {
        entry.target.classList.remove('is-visible');
      }
    });
  }

  destroy() {
    this.observer.disconnect();
  }
}

// 使用
const sr = new ScrollReveal({
  threshold: 0.15,
  once: true,
  rootMargin: '0px 0px -50px 0px'
});
```

## 关键技术点

1. **IntersectionObserver而非scroll事件**：IO是浏览器原生API，不需要手动监听scroll+计算getBoundingClientRect，性能好10倍
2. **rootMargin负值**：`rootMargin: '0px 0px -50px 0px'`让元素进入视口50px后才触发，避免刚露出边缘就动画
3. **transition-delay实现错开**：通过`data-delay`属性设置`transition-delay`，多个元素依次入场
4. **will-change优化**：提前告诉浏览器opacity和transform会变，GPU合成层提前创建

## 常见坑点

- **不要用scroll事件+getBoundingClientRect**：长页面上每次滚动都触发几十次回调，严重卡顿。IntersectionObserver是正确方案
- **once模式忘记unobserve**：动画完成后不取消观察，元素每次进出视口都触发回调，浪费性能
- **threshold设太高**：threshold=1.0要求元素完全可见才触发，元素比视口高时永远不触发
- **首屏元素闪烁**：首屏元素在JS执行前已可见，IO回调可能延迟。解决方案：首屏元素不加`.reveal`类，或用`requestAnimationFrame`在第一帧前添加

## 变体拓展

- **视差效果**：根据元素在视口中的位置百分比，设置不同translateY值
- **3D翻转**：用`rotateX`/`rotateY`+`perspective`实现3D翻转入场
- **打字机联动**：元素入场后触发打字机效果
- **SVG路径动画**：用`stroke-dashoffset`让SVG线条逐步绘制
- **数字递增联动**：元素入场后触发数字从0递增到目标值

---

Scroll reveal triggers animations (fade, slide, scale) when elements enter the viewport. It guides user attention and makes long pages feel alive.

**Key implementation**: Use `IntersectionObserver` — not scroll events — for 10x better performance. Set `rootMargin` with a negative bottom value so elements trigger 50px after entering the viewport. Use `transition-delay` for staggered entry. Add `will-change: opacity, transform` for GPU optimization.

**Common pitfalls**: Don't use scroll + getBoundingClientRect (janky). Always unobserve after animation in `once` mode. Don't set threshold too high (elements taller than viewport never fully visible). First-screen elements may flash — skip `.reveal` class for above-the-fold content.

*Full copy-paste code available above. Questions? Leave a comment.*
