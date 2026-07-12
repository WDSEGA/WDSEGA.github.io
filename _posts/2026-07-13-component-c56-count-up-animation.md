---
layout: post
title: "数字递增动画 Count-up Animation | requestAnimationFrame实现丝滑计数"
date: 2026-07-13
categories: [component]
tags: [web-component, javascript, animation, count-up]
---

> 从0到1,000,000只用2秒，还能精确到小数点后两位。数字递增动画是数据展示页的灵魂——但大多数实现要么用setInterval卡顿，要么用CSS动画无法控制终值。今天我们用requestAnimationFrame写一个完美的版本。

## 组件是什么

数字递增动画（Count-up Animation）让数字从初始值平滑过渡到目标值。常见场景包括：
- 数据大屏的统计数字
- 落地页的"10万+用户"展示
- 滚动到可视区域时触发

## 效果预览

```html
<div class="counter" data-target="1250000" data-duration="2000" data-decimals="0">
  0
</div>
```

页面加载或滚动到可见时，数字从0平滑递增到1,250,000。

## 代码拆解

### HTML结构

```html
<div class="counter-wrapper">
  <div class="counter" data-target="1250000" data-duration="2000">0</div>
  <span class="counter-suffix">+</span>
</div>
```

所有配置通过data-*属性传递，无侵入。

### CSS样式

```css
.counter-wrapper {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}
.counter {
  font-size: 3rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums; /* 等宽数字，防止跳动 */
  color: #6c5ce7;
}
.counter-suffix {
  font-size: 1.5rem;
  color: #a29bfe;
}
```

关键：`font-variant-numeric: tabular-nums`确保数字等宽，递增时不会左右抖动。

### JavaScript核心：缓动函数

```javascript
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}
```

easeOutQuart是最佳选择——开始快、结束慢，符合用户对"到位了"的心理预期。线性递增看起来机械生硬。

### JavaScript核心：动画引擎

```javascript
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const duration = parseInt(el.dataset.duration) || 2000;
  const decimals = parseInt(el.dataset.decimals) || 0;
  const start = 0;
  let startTime = null;

  function update(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuart(progress);
    const current = start + (target - start) * eased;

    el.textContent = formatNumber(current, decimals);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = formatNumber(target, decimals);
    }
  }

  requestAnimationFrame(update);
}

function formatNumber(num, decimals) {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
```

### IntersectionObserver触发

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      observer.unobserve(entry.target); // 只触发一次
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.counter').forEach(el => {
  observer.observe(el);
});
```

滚动到30%可见时触发，避免用户还没看到就播完了。

## 关键技术点

1. **requestAnimationFrame**：与屏幕刷新率同步（通常60fps），比setInterval更流畅，且标签页隐藏时自动暂停
2. **缓动函数**：easeOutQuart > easeOutCubic > linear，递减式缓动最自然
3. **tabular-nums**：CSS等宽数字，防止递增过程中数字宽度变化导致抖动
4. **toLocaleString**：自动添加千位分隔符，比手写正则更可靠
5. **IntersectionObserver**：只在可见时触发，节省性能

## 常见坑点

- **setInterval卡顿**：60fps需要16.67ms间隔，setInterval精度不够，标签页隐藏后还在跑。必须用requestAnimationFrame
- **浮点数精度**：`0.1 + 0.2 = 0.30000000000000004`，用toFixed或Math.round修正
- **重复触发**：用户上下滚动会多次触发。用unobserve或flag标记已执行
- **大数格式化**：1,250,000比1250000易读，用toLocaleString而非手写正则
- **prefers-reduced-motion**：部分用户设置了减少动画，应检测并直接跳到终值

```javascript
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  el.textContent = formatNumber(target, decimals);
  return;
}
```

## 完整可复制代码

```html
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Count-up Animation</title>
<style>
body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:40px;background:#f5f5f7;margin:0}
.counter-wrapper{display:inline-flex;align-items:baseline;gap:4px}
.counter{font-size:3rem;font-weight:800;font-variant-numeric:tabular-nums;color:#6c5ce7}
.counter-suffix{font-size:1.5rem;color:#a29bfe}
</style>
</head>
<body>
<div class="counter-wrapper"><div class="counter" data-target="1250000" data-duration="2000">0</div><span class="counter-suffix">+</span></div>
<div class="counter-wrapper"><div class="counter" data-target="99.9" data-duration="1500" data-decimals="1">0</div><span class="counter-suffix">%</span></div>
<div class="counter-wrapper"><div class="counter" data-target="365" data-duration="1000">0</div><span class="counter-suffix">days</span></div>
<script>
function easeOutQuart(t){return 1-Math.pow(1-t,4)}
function formatNumber(n,d){return n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})}
function animateCounter(el){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){el.textContent=formatNumber(parseFloat(el.dataset.target),parseInt(el.dataset.decimals)||0);return}
  var target=parseFloat(el.dataset.target),duration=parseInt(el.dataset.duration)||2000,decimals=parseInt(el.dataset.decimals)||0,start=0,startTime=null;
  function update(ct){
    if(!startTime)startTime=ct;
    var p=Math.min((ct-startTime)/duration,1);
    el.textContent=formatNumber(start+(target-start)*easeOutQuart(p),decimals);
    if(p<1)requestAnimationFrame(update);else el.textContent=formatNumber(target,decimals);
  }
  requestAnimationFrame(update);
}
var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){animateCounter(e.target);obs.unobserve(e.target)}})},{threshold:0.3});
document.querySelectorAll('.counter').forEach(function(el){obs.observe(el)});
</script>
</body>
</html>
```

## 变体拓展

- **倒计时**：反过来从target递减到0，适合促销倒计时
- **步进递增**：每次+1而非连续递增，模拟"翻牌"效果
- **多段递增**：先到50%停顿，再加速到100%，制造节奏感
- **SVG圆环**：递增的同时画圆环进度，数字+图形双反馈

---

> From 0 to 1,000,000 in 2 seconds, with two decimal places of precision. Count-up animation is the soul of data display pages — but most implementations either stutter with setInterval or can't control the end value with CSS animations. Today we build a perfect version with requestAnimationFrame.

## What Is It

Count-up Animation smoothly transitions a number from an initial value to a target value. Common use cases:
- Dashboard statistics
- Landing page "100K+ users" display
- Triggered when scrolled into view

## Key Technical Points

1. **requestAnimationFrame**: Syncs with screen refresh rate (~60fps), smoother than setInterval, auto-pauses when tab is hidden
2. **Easing function**: easeOutQuart > easeOutCubic > linear
3. **tabular-nums**: CSS equal-width digits prevent jitter
4. **toLocaleString**: Auto thousand separators
5. **IntersectionObserver**: Trigger only when visible

## Common Pitfalls

- **setInterval stutter**: Must use requestAnimationFrame
- **Float precision**: Use toFixed or Math.round
- **Repeat trigger**: Use unobserve or flag
- **Large number format**: Use toLocaleString
- **prefers-reduced-motion**: Detect and skip to final value

---

*更多Web组件，请访问 [Web组件字典](https://wdsega.github.io/web-components/widget.html)。*
