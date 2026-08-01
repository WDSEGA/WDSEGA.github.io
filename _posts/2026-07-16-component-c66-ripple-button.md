---
title: "组件c66：波纹按钮 | Component c66: Ripple Button"
layout: post
date: 2026-07-16
categories: [组件, 前端]
tags: [javascript, ripple, animation, material]
---

> 点击按钮，一圈半透明波纹从指尖位置扩散消散——这个0.6秒的微交互让每次点击都有了物理质感。

## 这是什么

波纹按钮（Ripple Button）源自Material Design，点击时从鼠标位置产生一个半透明圆形波纹向外扩散，0.6秒后消散。它给静态按钮赋予了触觉反馈感，让用户确认"点击被接收了"。

## 效果预览

```
用户点击按钮中心 →
  [Click for Ripple]
         ∗  ← 波纹从点击位置生成
        ╱ ╲
       ╱   ╲
      ╱     ╲  ← 0.6s内扩散至按钮最大尺寸
     ╱  透明  ╲    同时opacity从0.4渐变到0
      ╲     ╱
       ╲   ╱
        ╲ ╱  ← 波纹消失，按钮恢复原状
```

## 代码拆解

### HTML

```html
<div style="padding:60px;text-align:center">
  <button onclick="ripple(event,this)"
    style="position:relative;overflow:hidden;
      padding:14px 32px;background:#e94560;color:#fff;
      border:none;border-radius:8px;font-size:16px;cursor:pointer">
    <span style="position:relative;z-index:1">Click for Ripple</span>
  </button>
</div>
```

### CSS

```css
/* 波纹动画 */
@keyframes ripple-anim {
  0%   { transform: scale(0); opacity: 0.4; }
  100% { transform: scale(1); opacity: 0; }
}

/* 关键：按钮必须relative + overflow:hidden */
.ripple-btn {
  position: relative;
  overflow: hidden;
}

/* 文字层级高于波纹 */
.ripple-btn span {
  position: relative;
  z-index: 1;
}
```

### JavaScript

```javascript
function ripple(e, btn) {
  // 创建波纹元素
  var circle = document.createElement('span');
  circle.style.cssText =
    'position:absolute;border-radius:50%;' +
    'background:rgba(255,255,255,0.4);' +
    'pointer-events:none;' +
    'animation:ripple-anim 0.6s ease';

  // 波纹直径 = 按钮最大边长
  var d = Math.max(btn.offsetWidth, btn.offsetHeight);
  circle.style.width = circle.style.height = d + 'px';

  // 计算点击位置（相对于按钮左上角）
  var r = btn.getBoundingClientRect();
  circle.style.left = (e.clientX - r.left - d / 2) + 'px';
  circle.style.top  = (e.clientY - r.top  - d / 2) + 'px';

  btn.appendChild(circle);

  // 动画结束后移除
  setTimeout(function() { circle.remove(); }, 600);
}

// 事件委托版本（一个监听器处理所有按钮）
document.addEventListener('click', function(e) {
  var btn = e.target.closest('.ripple-btn');
  if (btn) ripple(e, btn);
});
```

## 关键技术点

1. **position:relative + overflow:hidden**：按钮设relative让波纹span绝对定位以按钮为参考系，overflow:hidden裁切波纹不溢出按钮边界
2. **直径取最大边长**：`Math.max(offsetWidth, offsetHeight)`确保波纹能覆盖整个按钮，无论点击位置在哪
3. **clientX/Y - getBoundingClientRect()**：将视口坐标转换为按钮内坐标，波纹从鼠标实际点击位置开始
4. **z-index层级**：文字`z-index:1`，波纹默认`z-index:0`，保证波纹在文字下方
5. **pointer-events:none**：波纹元素不拦截后续鼠标事件，防止连续点击被波纹span挡住

## 常见坑点

- **忘记overflow:hidden**：波纹圆形会溢出按钮，变成页面上的白色圆块扩散，完全破坏效果
- **直径太小**：用点击位置的偏移作为直径，波纹只覆盖按钮一小部分。必须用`Math.max(w,h)`
- **波纹盖住文字**：没给文字设`z-index:1`，波纹在文字上层，点击时文字被白色半透明遮盖
- **内存泄漏**：`createElement`后不remove，频繁点击按钮内堆满隐藏的span。必须setTimeout移除
- **用transform:scale而非width/height动画**：scale走GPU合成层，width/height触发布局重排，性能差很多

## 变体拓展

- **多色波纹**：根据按钮颜色自动反相，深色按钮用白色波纹，浅色按钮用黑色波纹
- **涟漪叠加**：快速连点时多个波纹同时存在，不互相干扰（每次创建独立span）
- **方形波纹**：`border-radius:0`让波纹是方形扩散，适合棱角分明的工业风UI
- **延迟消散**：波纹扩散后保持0.3秒再淡出，适合重要操作按钮（提交、确认）
- **触摸设备适配**：用`touchstart`事件获取`touches[0].clientX/Y`，移动端也能精确定位

---

A ripple button creates a semi-transparent circle that expands from the click position and fades out in 0.6s. Originating from Material Design, it gives static buttons tactile feedback — confirming "your click was received."

**Key implementation**: Button needs `position: relative` + `overflow: hidden`. Ripple diameter = `Math.max(offsetWidth, offsetHeight)` to cover the entire button. Convert viewport coords to button-local coords via `getBoundingClientRect()`. Text gets `z-index: 1` to stay above ripple. Set `pointer-events: none` on ripple span.

**Common pitfalls**: Missing `overflow: hidden` lets ripple leak outside. Diameter too small only covers part of button. Missing `z-index` on text makes it invisible during ripple. Forgetting to `remove()` the span causes memory leaks. Use `transform: scale` (GPU) not `width/height` (layout reflow).

**Variants**: Auto-contrast ripple color, stacked ripples for rapid clicks, square ripple for industrial UI, delayed fade for important actions, touch event support for mobile.

*Full copy-paste code available above. Questions? Leave a comment.*
