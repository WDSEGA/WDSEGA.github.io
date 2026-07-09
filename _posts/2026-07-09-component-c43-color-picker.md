---
title: "组件详解#43：颜色选择器，不用任何库实现HSV拾色面板 | Component Deep Dive #43: Color Picker — Build an HSV Picker Panel Without Any Library"
date: 2026-07-09
categories: 组件详解
tags: [Component, Color Picker, HSV, JavaScript, UI]
---

## 组件详解#43：颜色选择器，不用任何库实现HSV拾色面板

> 产品介绍：Web Component Dictionary v2.0 收录83个手写UI组件，无需任何框架。完整源码+实时预览，已在 Payhip 上架。文末有获取方式。

### 为什么原生 `<input type="color">` 不够用？

浏览器自带的颜色选择器有三个硬伤：

1. **功能受限**：只能选颜色，不能调透明度（Alpha通道），不能输入HSV/HEX值
2. **样式不可控**：弹出的拾色面板由浏览器渲染，你改不了它的外观
3. **体验不一致**：Chrome、Firefox、Safari三个面板长得完全不一样

一个专业的颜色选择器需要：色相滑块、饱和度/明度面板、透明度滑块、HEX/RGB/HSL输入框、预设色板。听起来复杂，但核心逻辑只有HSV到RGB的转换。

### 效果预览

左侧是饱和度-明度方形面板（可点击拖拽），右侧是色相滑块（0-360度），底部显示当前颜色的HEX值和RGB值。拖动面板选颜色，拖动滑块选色相，实时同步。

### 代码拆解

**HTML 结构**：

```html
<div class="color-picker">
  <div class="sv-panel" id="svPanel">
    <div class="sv-cursor" id="svCursor"></div>
  </div>
  <div class="hue-slider" id="hueSlider">
    <div class="hue-cursor" id="hueCursor"></div>
  </div>
  <div class="color-info">
    <div class="color-preview" id="colorPreview"></div>
    <input type="text" id="hexInput" value="#ff0000" maxlength="7">
  </div>
</div>
```

**CSS 核心样式**：

```css
.sv-panel {
  width: 200px;
  height: 200px;
  position: relative;
  background: linear-gradient(to top, #000, transparent),
              linear-gradient(to right, #fff, hsl(var(--hue, 0), 100%, 50%));
  cursor: crosshair;
  border-radius: 4px;
}
.sv-cursor {
  width: 12px; height: 12px;
  border: 2px solid #fff;
  border-radius: 50%;
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.3);
}
.hue-slider {
  width: 200px; height: 12px;
  margin-top: 10px;
  background: linear-gradient(to right,
    hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%),
    hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%));
  border-radius: 6px;
  position: relative;
  cursor: pointer;
}
```

**JavaScript 核心逻辑**：

```javascript
const svPanel = document.getElementById('svPanel');
const hueSlider = document.getElementById('hueSlider');
let hue = 0, sat = 100, val = 100;

// SV面板拖拽
function handleSV(e) {
  const rect = svPanel.getBoundingClientRect();
  let x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
  let y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
  sat = Math.round((x / rect.width) * 100);
  val = Math.round((1 - y / rect.height) * 100);
  updateColor();
}

// 色相滑块
function handleHue(e) {
  const rect = hueSlider.getBoundingClientRect();
  let x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
  hue = Math.round((x / rect.width) * 360);
  svPanel.style.setProperty('--hue', hue);
  updateColor();
}

// HSV转RGB
function hsvToRgb(h, s, v) {
  s /= 100; v /= 100;
  const c = v * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs(hp % 2 - 1));
  let r, g, b;
  if (hp < 1) [r,g,b] = [c,x,0];
  else if (hp < 2) [r,g,b] = [x,c,0];
  else if (hp < 3) [r,g,b] = [0,c,x];
  else if (hp < 4) [r,g,b] = [0,x,c];
  else if (hp < 5) [r,g,b] = [x,0,c];
  else [r,g,b] = [c,0,x];
  const m = v - c;
  return [Math.round((r+m)*255), Math.round((g+m)*255), Math.round((b+m)*255)];
}

function updateColor() {
  const [r, g, b] = hsvToRgb(hue, sat, val);
  const hex = '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
  document.getElementById('hexInput').value = hex;
  document.getElementById('colorPreview').style.background = hex;
}
```

### 关键技术点

1. **SV面板的背景**：用两层`linear-gradient`叠加——底层是色相颜色，上层是从白到透明的横向渐变和从黑到透明的纵向渐变。这构成了HSV的饱和度-明度空间
2. **CSS变量传色相**：`svPanel.style.setProperty('--hue', hue)` 让面板背景随色相变化，无需重新绘制
3. **HSV转RGB**：核心算法是按色相区间（6个60度段）分别计算RGB分量，再加上偏移量m

### 常见坑点

- **getBoundingClientRect vs offsetWidth**：拖拽时用`getBoundingClientRect`更准确，因为它考虑了CSS transform缩放
- **触摸事件**：移动端需要同时监听`touchmove`，用`e.touches[0].clientX`取坐标
- **HEX输入校验**：用户手动输入HEX时必须正则校验`/^#[0-9a-fA-F]{6}$/`，非法值不能更新

### 变体拓展

- **Alpha通道**：加一根透明度滑块，背景用棋盘格CSS图案
- **预设色板**：底部放一排常用色块，点击即选
- **HSL模式**：部分设计工具用HSL而非HSV，转换公式略有不同

***

Component Deep Dive #43: Color Picker — Build an HSV Picker Panel Without Any Library

The native `<input type="color">` has three fatal flaws: it can't adjust alpha, its popup panel is browser-rendered and unstyleable, and it looks different across Chrome/Firefox/Safari. A professional color picker needs a hue slider, saturation-value panel, alpha slider, HEX/RGB inputs, and preset swatches.

The core of the SV panel is two layered CSS gradients — a horizontal white-to-transparent and a vertical black-to-transparent over the hue color, forming the HSV saturation-value space. The hue is passed via a CSS custom property so the panel background updates without repainting.

The HSV-to-RGB conversion splits the hue into six 60-degree segments, calculates RGB components per segment, then adds an offset. The trickiest part is handling drag events correctly with `getBoundingClientRect` and supporting touch events for mobile.

Extensions include an alpha channel slider with a checkerboard CSS background, preset color swatches, and HSL mode for design tools that prefer HSL over HSV.
