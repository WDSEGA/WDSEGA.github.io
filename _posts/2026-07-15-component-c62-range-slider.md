---
title: "组件c62：范围滑块 | Component c62: Range Slider"
layout: post
date: 2026-07-15
categories: [组件, 前端]
tags: [html, css, javascript, range-slider]
---

> 拖一下滑块就能调参数——比输入框直观100倍。今天拆解范围滑块的自定义样式与双滑块实现。

## 这是什么

范围滑块（Range Slider）允许用户通过拖动滑块在指定范围内选择值。原生`<input type="range">`虽然可用，但样式丑陋且功能单一。自定义滑块可以实现双滑块区间选择、刻度标记、实时tooltip等增强功能。

## 效果预览

```
|-----O=========O-----|
10    35          78   100
```

拖动两侧滑块选择区间，中间区域高亮，上方实时显示当前值。

## 代码拆解

### HTML

```html
<div class="range-slider" id="rangeSlider">
  <div class="range-track">
    <div class="range-fill" id="rangeFill"></div>
  </div>
  <div class="range-thumb range-thumb--min" id="thumbMin" tabindex="0" role="slider" aria-label="最小值"></div>
  <div class="range-thumb range-thumb--max" id="thumbMax" tabindex="0" role="slider" aria-label="最大值"></div>
</div>
<div class="range-values">
  <span id="valueMin">0</span> — <span id="valueMax">100</span>
</div>
```

### CSS

```css
.range-slider {
  position: relative;
  width: 100%;
  height: 40px;
  padding: 0 10px;
}

.range-track {
  position: absolute;
  top: 50%;
  left: 10px;
  right: 10px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  transform: translateY(-50%);
}

.range-fill {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
}

.range-thumb {
  position: absolute;
  top: 50%;
  width: 20px;
  height: 20px;
  background: #fff;
  border: 2px solid #667eea;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  transition: box-shadow 0.2s;
}

.range-thumb:hover,
.range-thumb:focus {
  box-shadow: 0 0 0 8px rgba(102, 126, 234, 0.15);
  outline: none;
}

.range-thumb:active {
  cursor: grabbing;
  box-shadow: 0 0 0 12px rgba(102, 126, 234, 0.2);
}

.range-values {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #555;
}
```

### JavaScript

```javascript
class RangeSlider {
  constructor(container, options = {}) {
    this.container = container;
    this.min = options.min || 0;
    this.max = options.max || 100;
    this.step = options.step || 1;
    this.minValue = options.minValue || this.min;
    this.maxValue = options.maxValue || this.max;
    this.onChange = options.onChange || (() => {});

    this.thumbMin = container.querySelector('#thumbMin');
    this.thumbMax = container.querySelector('#thumbMax');
    this.fill = container.querySelector('#rangeFill');
    this.valueMinEl = container.querySelector('#valueMin');
    this.valueMaxEl = container.querySelector('#valueMax');

    this.activeThumb = null;
    this.bindEvents();
    this.update();
  }

  bindEvents() {
    const thumbs = [this.thumbMin, this.thumbMax];

    thumbs.forEach(thumb => {
      thumb.addEventListener('mousedown', e => this.startDrag(e, thumb));
      thumb.addEventListener('touchstart', e => this.startDrag(e, thumb), { passive: false });

      thumb.addEventListener('keydown', e => this.handleKey(e, thumb));
    });
  }

  startDrag(e, thumb) {
    e.preventDefault();
    this.activeThumb = thumb;
    const moveHandler = e => this.onDrag(e);
    const endHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('touchend', endHandler);
      this.activeThumb = null;
    };
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('touchend', endHandler);
  }

  onDrag(e) {
    const rect = this.container.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (clientX === undefined) return;

    const padding = 10;
    let percent = (clientX - rect.left - padding) / (rect.width - padding * 2);
    percent = Math.max(0, Math.min(1, percent));
    let value = Math.round(this.min + percent * (this.max - this.min));
    value = Math.round(value / this.step) * this.step;

    if (this.activeThumb === this.thumbMin) {
      this.minValue = Math.min(value, this.maxValue - this.step);
    } else {
      this.maxValue = Math.max(value, this.minValue + this.step);
    }

    this.update();
    this.onChange(this.minValue, this.maxValue);
  }

  handleKey(e, thumb) {
    const key = e.key;
    let changed = false;

    if (thumb === this.thumbMin) {
      if (key === 'ArrowLeft' || key === 'ArrowDown') {
        this.minValue = Math.max(this.min, this.minValue - this.step);
        changed = true;
      } else if (key === 'ArrowRight' || key === 'ArrowUp') {
        this.minValue = Math.min(this.maxValue - this.step, this.minValue + this.step);
        changed = true;
      }
    } else {
      if (key === 'ArrowLeft' || key === 'ArrowDown') {
        this.maxValue = Math.max(this.minValue + this.step, this.maxValue - this.step);
        changed = true;
      } else if (key === 'ArrowRight' || key === 'ArrowUp') {
        this.maxValue = Math.min(this.max, this.maxValue + this.step);
        changed = true;
      }
    }

    if (changed) {
      e.preventDefault();
      this.update();
      this.onChange(this.minValue, this.maxValue);
    }
  }

  update() {
    const range = this.max - this.min;
    const minPercent = ((this.minValue - this.min) / range) * 100;
    const maxPercent = ((this.maxValue - this.min) / range) * 100;

    this.thumbMin.style.left = `${minPercent}%`;
    this.thumbMax.style.left = `${maxPercent}%`;
    this.fill.style.left = `${minPercent}%`;
    this.fill.style.width = `${maxPercent - minPercent}%`;

    this.valueMinEl.textContent = this.minValue;
    this.valueMaxEl.textContent = this.maxValue;
  }
}

// 使用
const slider = new RangeSlider(document.getElementById('rangeSlider'), {
  min: 0, max: 100, step: 5,
  minValue: 20, maxValue: 80,
  onChange: (min, max) => console.log(`Range: ${min} - ${max}`)
});
```

## 关键技术点

1. **双滑块碰撞防护**：min滑块不能超过max滑块，用`Math.min(value, this.maxValue - this.step)`约束
2. **百分比定位**：滑块位置用百分比计算，fill的left和width也用百分比，自动响应容器宽度
3. **键盘可访问**：方向键加减step值，必须实现，否则`role="slider"`是摆设
4. **触摸支持**：同时绑定touch和mouse事件，移动端才能用

## 常见坑点

- **像素与百分比混用**：thumb用`left: %`定位但track用固定像素宽度，resize后错位。全用百分比
- **step对齐**：用户拖到任意位置后必须`Math.round(value / step) * step`对齐，否则值不整
- **touchmove passive**：必须`{ passive: false }`才能`preventDefault()`，否则页面跟着滚
- **z-index**：两个thumb重叠时，后拖动的那个要在上面，动态调整z-index

## 变体拓展

- **刻度标记**：在track下方添加刻度线和标签
- **实时tooltip**：拖动时在thumb上方显示当前值的气泡
- **对数刻度**：价格区间选择器常用对数滑块（1-10000映射到0-100%）
- **多段区间**：3个或更多thumb，选择多个不连续区间

---

A range slider lets users select values by dragging thumbs along a track. The native `<input type="range">` works but is ugly and single-thumb only. Custom implementations enable dual-thumb range selection, tick marks, and real-time tooltips.

**Key points**: Prevent thumb collision with `Math.min(value, this.maxValue - this.step)`. Use percentage positioning for automatic responsiveness. Implement keyboard support (arrow keys) for `role="slider"` accessibility. Bind both touch and mouse events.

**Common pitfalls**: Don't mix pixel and percentage positioning (breaks on resize). Always align values to step with `Math.round(value / step) * step`. Set `{ passive: false }` on touchmove to allow preventDefault.

*Full copy-paste code available above. Questions? Leave a comment.*
