---
layout: post
title: "数字步进器 | Component Deep Dive #39: Stepper — Long Press Acceleration and Decimal Precision"
date: 2026-07-07 12:00:00 +0800
categories: [组件深度解析, Component Deep Dive]
tags: [stepper, number-input, long-press, webdev]
description: "数字步进器的核心是长按加速和精度处理——加减按钮看着简单，但浮点数精度和重复触发是真正的坑。"
author: 编译员
---

# 数字步进器 | Component Deep Dive #39: Stepper — Long Press Acceleration and Decimal Precision

> 点一下加1，长按自动递增越来越快。这个交互比看起来复杂——涉及到定时器管理、精度处理和边界检查。

数字步进器（Stepper / Number Input）用于需要精确数值输入的场景：购物数量、评分设置、时间间隔配置。用户可以点击加减按钮调整数值，也可以直接在输入框中输入。

## 核心原理

步进器有三个关键交互：

1. **单次点击** — 点击+/-按钮，值增减一个step
2. **长按加速** — 按住按钮不放，值持续递增，速度逐渐加快
3. **直接输入** — 在输入框中键入数值，失焦时验证并修正

难点在长按加速：需要一个可变间隔的定时器。初始间隔约300ms，每触发一次递减20ms，最低30ms。松开按钮时清除定时器。同时要处理精度问题——0.1+0.2=0.30000000000000004。

## 实现

```html
<div class="stepper">
  <button class="stepper-btn" data-action="decrease"
    aria-label="减少">-</button>
  <input class="stepper-input" type="text" inputmode="decimal"
    value="1" aria-label="数量">
  <button class="stepper-btn" data-action="increase"
    aria-label="增加">+</button>
</div>
```

```javascript
class Stepper {
  constructor(root, options = {}) {
    this.input = root.querySelector('.stepper-input');
    this.buttons = root.querySelectorAll('.stepper-btn');
    this.min = options.min ?? -Infinity;
    this.max = options.max ?? Infinity;
    this.step = options.step ?? 1;
    this.precision = this.calcPrecision(this.step);

    // Long press state
    this.timer = null;
    this.interval = 300;
    this.minInterval = 30;
    this.acceleration = 0.8; // interval *= 0.8 each tick

    this.bind();
  }

  calcPrecision(step) {
    const str = String(step);
    const dot = str.indexOf('.');
    return dot === -1 ? 0 : str.length - dot - 1;
  }

  clamp(value) {
    return Math.min(this.max, Math.max(this.min, value));
  }

  getValue() {
    return parseFloat(this.input.value) || 0;
  }

  setValue(value) {
    const clamped = this.clamp(value);
    // Fix floating point: round to precision
    const fixed = parseFloat(clamped.toFixed(this.precision));
    this.input.value = fixed;
    this.input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  adjust(delta) {
    this.setValue(this.getValue() + delta);
  }

  startRepeat(action) {
    const delta = action === 'increase' ? this.step : -this.step;
    this.interval = 300;

    const tick = () => {
      this.adjust(delta);
      // Check bounds — stop repeating at limits
      const val = this.getValue();
      if ((delta > 0 && val >= this.max) ||
          (delta < 0 && val <= this.min)) {
        this.stopRepeat();
        return;
      }
      // Accelerate: decrease interval
      this.interval = Math.max(this.minInterval,
        this.interval * this.acceleration);
      this.timer = setTimeout(tick, this.interval);
    };

    // Initial delay before repeating starts
    this.timer = setTimeout(tick, 400);
  }

  stopRepeat() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  bind() {
    this.buttons.forEach(btn => {
      const action = btn.dataset.action;

      btn.addEventListener('click', () => {
        const delta = action === 'increase' ? this.step : -this.step;
        this.adjust(delta);
      });

      // Long press for mouse
      btn.addEventListener('mousedown', () => this.startRepeat(action));
      btn.addEventListener('mouseup', () => this.stopRepeat());
      btn.addEventListener('mouseleave', () => this.stopRepeat());

      // Long press for touch
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.startRepeat(action);
      }, { passive: false });
      btn.addEventListener('touchend', () => this.stopRepeat());
      btn.addEventListener('touchcancel', () => this.stopRepeat());
    });

    // Direct input validation
    this.input.addEventListener('blur', () => {
      let val = parseFloat(this.input.value);
      if (isNaN(val)) val = this.min > -Infinity ? this.min : 0;
      this.setValue(val);
    });

    // Allow only valid numeric input
    this.input.addEventListener('input', () => {
      // Strip invalid characters
      this.input.value = this.input.value.replace(/[^\d.-]/g, '');
    });

    // Prevent form submit on Enter
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.adjust(this.step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.adjust(-this.step);
      }
    });
  }
}

// Usage
const stepper = new Stepper(document.querySelector('.stepper'), {
  min: 1,
  max: 99,
  step: 1
});
```

## 浮点数精度

JavaScript使用IEEE 754双精度浮点数，0.1+0.2不等于0.3：

```javascript
0.1 + 0.2  // 0.30000000000000004
0.3 - 0.1  // 0.19999999999999998
```

步进器每次调整都会累积误差。解决方法是根据step的精度做四舍五入：

```javascript
calcPrecision(step) {
  const str = String(step);
  const dot = str.indexOf('.');
  return dot === -1 ? 0 : str.length - dot - 1;
}

setValue(value) {
  const clamped = this.clamp(value);
  const fixed = parseFloat(clamped.toFixed(this.precision));
  this.input.value = fixed;
}
```

如果step=0.01，precision=2，每次setValue都会`toFixed(2)`修正，保证显示值始终是干净的两位小数。

## 长按加速算法

加速的核心是间隔递减：

| 触发次数 | 间隔(ms) | 累计时间(ms) |
|---------|---------|-------------|
| 1 | 300 | 300 |
| 2 | 240 | 540 |
| 3 | 192 | 732 |
| 4 | 154 | 886 |
| 5 | 123 | 1009 |
| ... | ... | ... |
| 10 | 50 | ~1350 |
| 15+ | 30 | ~1550 |

初始延迟400ms（模拟"按住"的感觉），然后从300ms开始，每次乘以0.8，最低30ms。用户按住1.5秒后已经递增了约15次。

## 常见陷阱

1. **用setInterval而非setTimeout** — `setInterval`的间隔固定无法加速。正确做法是用递归`setTimeout`，每次重新计算间隔。

2. **touchstart不加preventDefault** — 移动端长按会触发系统菜单或文字选择。`e.preventDefault()`配合`{ passive: false }`可以阻止默认行为。

3. **忘记边界检查** — 长按到max/min时不停止，继续发送无意义的adjust调用。每次tick都要检查是否到达边界。

4. **精度累积** — 用`value += step`累积浮点误差。每次setValue时`toFixed`修正，而不是在显示层格式化。

## 底层逻辑

步进器本质是一个"离散数值控制器"：将连续的指针交互（点击、长按、拖拽）映射为离散的数值变化。单次点击是离散映射——一次点击对应一个step。长按是连续到离散的转换——持续时间映射为step数量，加速曲线控制映射速率。

精度处理的本质是在浮点运算和用户期望之间建立桥梁。用户期望0.1+0.1=0.2，但浮点硬件给出0.30000000000000004。`toFixed`是一层"翻译"——将硬件的精确表示翻译成用户的直觉表示。

---

# Stepper | Component Deep Dive #39: Stepper — Long Press Acceleration and Decimal Precision

> Click to add 1, hold to auto-increment faster and faster. This interaction is more complex than it looks — timer management, precision handling, and boundary checking are the real challenges.

The Stepper (Number Input) is used in scenarios requiring precise numeric input: shopping quantities, rating settings, time interval configuration. Users can adjust values by clicking +/- buttons or typing directly in the input field.

## Core Principle

Three key interactions:

1. **Single click** — Click +/- button, value changes by one step
2. **Long press acceleration** — Hold the button, value continuously increments with increasing speed
3. **Direct input** — Type a value, validated on blur

The challenge is long press acceleration: you need a variable-interval timer. Initial interval ~300ms, decreasing by 20% per tick, minimum 30ms. Release clears the timer. Also handle precision — 0.1+0.2=0.30000000000000004.

## Implementation

```javascript
class Stepper {
  constructor(root, options = {}) {
    this.input = root.querySelector('.stepper-input');
    this.min = options.min ?? -Infinity;
    this.max = options.max ?? Infinity;
    this.step = options.step ?? 1;
    this.precision = this.calcPrecision(this.step);
    this.timer = null;
    this.interval = 300;
    this.minInterval = 30;
    this.acceleration = 0.8;
    this.bind();
  }

  calcPrecision(step) {
    const str = String(step);
    const dot = str.indexOf('.');
    return dot === -1 ? 0 : str.length - dot - 1;
  }

  startRepeat(action) {
    const delta = action === 'increase' ? this.step : -this.step;
    this.interval = 300;

    const tick = () => {
      this.adjust(delta);
      const val = this.getValue();
      if ((delta > 0 && val >= this.max) ||
          (delta < 0 && val <= this.min)) {
        this.stopRepeat();
        return;
      }
      this.interval = Math.max(this.minInterval,
        this.interval * this.acceleration);
      this.timer = setTimeout(tick, this.interval);
    };

    this.timer = setTimeout(tick, 400);
  }

  stopRepeat() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }

  setValue(value) {
    const clamped = Math.min(this.max, Math.max(this.min, value));
    const fixed = parseFloat(clamped.toFixed(this.precision));
    this.input.value = fixed;
  }
}
```

## Floating Point Precision

JavaScript uses IEEE 754 double-precision floats. 0.1+0.2 does not equal 0.3:

```javascript
0.1 + 0.2  // 0.30000000000000004
0.3 - 0.1  // 0.19999999999999998
```

Each adjustment accumulates error. The solution: round to the step's precision on every setValue:

```javascript
const fixed = parseFloat(clamped.toFixed(this.precision));
```

If step=0.01, precision=2, every setValue does `toFixed(2)` correction, ensuring the display is always clean two-decimal.

## Long Press Acceleration Algorithm

| Tick | Interval (ms) | Cumulative (ms) |
|------|--------------|-----------------|
| 1 | 300 | 300 |
| 2 | 240 | 540 |
| 3 | 192 | 732 |
| 5 | 123 | 1009 |
| 10 | 50 | ~1350 |
| 15+ | 30 | ~1550 |

Initial delay 400ms (simulating "hold" feel), then start at 300ms, multiply by 0.8 each tick, minimum 30ms. After holding for 1.5 seconds, the user has incremented ~15 times.

## Common Pitfalls

1. **Using setInterval instead of setTimeout** — `setInterval` has a fixed interval and cannot accelerate. Use recursive `setTimeout` with recalculated interval each time.

2. **Not preventDefault on touchstart** — Long press on mobile triggers system menus or text selection. `e.preventDefault()` with `{ passive: false }` prevents this.

3. **Forgetting boundary checks** — Long press past max/min keeps sending meaningless adjust calls. Every tick must check bounds.

4. **Precision accumulation** — Using `value += step` accumulates float errors. Fix with `toFixed` on every setValue, not just at the display layer.

## Underlying Logic

A stepper is essentially a "discrete numeric controller": mapping continuous pointer interactions (clicks, long presses, drags) to discrete numeric changes. Single clicks are discrete mappings — one click, one step. Long press is continuous-to-discrete conversion — duration maps to step count, acceleration curve controls the mapping rate.

Precision handling is about bridging floating-point arithmetic and user expectations. Users expect 0.1+0.1=0.2, but hardware gives 0.30000000000000004. `toFixed` is a "translation layer" — translating the hardware's exact representation into the user's intuitive representation.

---

*本文是「组件深度解析」系列第39篇。每篇拆解一个前端组件的核心原理与实现细节。*
