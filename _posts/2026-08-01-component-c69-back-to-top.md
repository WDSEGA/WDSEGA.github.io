---
title: "组件c69：返回顶部 | Component c69: Back to Top"
layout: post
date: 2026-08-01
categories: [组件, 前端]
tags: [javascript, scroll, navigation, button]
---

> 用户往下滑了三屏，想回顶部怎么办？Ctrl+Home太隐蔽——返回顶部按钮浮在右下角，一键平滑滚回。

## 这是什么

返回顶部按钮（Back to Top）是一个固定在页面右下角的浮动按钮，用户滚动超过一定距离（通常300px）后出现，点击后平滑滚动回页面顶部。它是长页面的必备导航元素，降低用户的滚动疲劳。

## 效果预览

```
[页面顶部]
    |
    | 用户向下滚动
    ↓
[内容区域]
    |
    | scrollY > 300px
    ↓
                      [↑ Top]  ← 按钮淡入出现在右下角
    |
    | 用户点击 [↑ Top]
    ↓
[页面顶部] ← 平滑滚动回顶部，按钮淡出消失
```

## 代码拆解

### HTML

```html
<div style="height:2000px;padding:20px">
  <h1>Scroll down to see the button</h1>
</div>
<button id="btop"
  onclick="window.scrollTo({top:0,behavior:'smooth'})"
  style="position:fixed;bottom:30px;right:30px;
    background:#e94560;color:#fff;border:none;
    padding:12px 18px;border-radius:50px;
    cursor:pointer;display:none;z-index:999">
  ↑ Top
</button>
```

### CSS

```css
/* 按钮基础样式 */
#btop {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: #e94560;
  color: #fff;
  border: none;
  padding: 12px 18px;
  border-radius: 50px;
  cursor: pointer;
  z-index: 999;
  display: none;
  opacity: 0;
  transition: opacity 0.3s, transform 0.3s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

#btop.visible {
  display: block;
  opacity: 1;
}

#btop:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}
```

### JavaScript

```javascript
// 方案1：scroll事件 + display控制（基础版）
window.addEventListener('scroll', function() {
  var b = document.getElementById('btop');
  b.style.display = window.scrollY > 300 ? 'block' : 'none';
});

// 方案2：scroll事件 + opacity淡入淡出（推荐）
var btop = document.getElementById('btop');
var ticking = false;

window.addEventListener('scroll', function() {
  if (!ticking) {
    requestAnimationFrame(function() {
      if (window.scrollY > 300) {
        btop.classList.add('visible');
      } else {
        btop.classList.remove('visible');
      }
      ticking = false;
    });
    ticking = true;
  }
});

// 方案3：IntersectionObserver（性能最优）
var sentinel = document.createElement('div');
sentinel.style.cssText = 'position:absolute;top:300px;width:1px;height:1px';
document.body.appendChild(sentinel);

var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (!entry.isIntersecting && window.scrollY > 300) {
      btop.classList.add('visible');
    } else {
      btop.classList.remove('visible');
    }
  });
});
observer.observe(sentinel);

// 点击平滑滚动
btop.addEventListener('click', function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
```

## 关键技术点

1. **position:fixed + z-index:999**：固定定位让按钮始终在视口右下角，高z-index确保不被其他元素遮挡
2. **scrollY阈值300px**：首屏高度通常800-900px，300px意味着用户滚动了约一屏的三分之一后按钮出现
3. **behavior:'smooth'**：`window.scrollTo({top:0, behavior:'smooth'})`是原生API，一行实现平滑滚动，无需任何库
4. **requestAnimationFrame节流**：scroll事件触发频率极高（每帧多次），用rAF节流到每帧最多一次，避免性能问题
5. **opacity淡入而非display切换**：`display:none→block`没有过渡动画，`opacity:0→1`配合transition有淡入效果

## 常见坑点

- **scroll事件不节流**：直接在scroll回调里操作DOM，页面滚动时每秒触发几十次，严重卡顿。必须用rAF或throttle
- **z-index不够高**：设了999但页面有sticky header设了z-index:1000+，按钮被遮挡。建议9999
- **移动端被底部导航栏挡住**：`bottom:30px`在有底部tab bar的移动端被遮挡。应改为`bottom:80px`或用CSS env()适配
- **scrollTo不兼容旧浏览器**：`behavior:'smooth'`在IE和旧版Safari中无效。需要polyfill或fallback到`document.documentElement.scrollTop = 0`

## 变体拓展

- **进度环**：按钮外圈是SVG圆形进度条，显示当前滚动位置占总长度的百分比
- **长按快速滚动**：长按按钮不仅回顶部，还能以加速度滚动，类似视频快进
- **弹跳效果**：滚动到顶部后按钮做一个scale弹跳动画，增加触觉反馈感
- **侧边浮现**：按钮从右侧滑入而非淡入，用`transform: translateX(100px→0)`实现
- **图标变体**：用箭头SVG替代文字"Top"，支持旋转动画（箭头从向下变为向上）

---

A back-to-top button floats in the bottom-right corner, appearing after the user scrolls past a threshold (usually 300px). Clicking it smooth-scrolls back to the top. Essential for long pages.

**Key implementation**: `position: fixed` + `z-index: 999` for constant visibility. `window.scrollTo({top:0, behavior:'smooth'})` for one-line smooth scroll. Throttle scroll events with `requestAnimationFrame`. Use `opacity` transitions for fade-in/out.

**Common pitfalls**: Unthrottled scroll events cause jank. z-index too low gets covered. Mobile bottom tab bar overlaps button. `behavior:'smooth'` needs polyfill for old browsers.

**Variants**: SVG progress ring showing scroll percentage, long-press fast-scroll, bounce animation, slide-in entrance, icon with rotation.

*Full copy-paste code available above. Questions? Leave a comment.*
