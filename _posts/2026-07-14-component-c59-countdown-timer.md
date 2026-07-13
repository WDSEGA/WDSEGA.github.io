---
title: "组件深度解析 #59: 倒计时器 — setInterval陷阱与requestAnimationFrame精度方案 | Component Deep Dive #59: Countdown Timer — setInterval Pitfalls and requestAnimationFrame Precision"
date: 2026-07-14
categories: [Web组件]
tags: [JavaScript, countdown, setInterval, requestAnimationFrame]
excerpt: "从最简单的setInterval倒计时到高精度rAF方案，解决标签页休眠导致的时间漂移、Date.now()基准对齐、formatTime边界处理等核心问题。"
---

## 组件深度解析 #59: 倒计时器

倒计时器看起来简单——每隔1秒减1嘛。但一旦你在生产环境用起来，各种边界情况会让你怀疑人生。

### 基础版（够用但不够好）

```javascript
// 最简单的倒计时：有问题但能跑
let seconds = 60;
const timer = setInterval(() => {
  seconds--;
  display.textContent = formatTime(seconds);
  if (seconds <= 0) clearInterval(timer);
}, 1000);

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
```

### 问题一：setInterval不精确

`setInterval(fn, 1000)`并不意味着每秒精确执行一次。浏览器会因为以下原因导致延迟：

- 标签页进入后台时，Chrome会将定时器节流到最低1秒/次
- 主线程被阻塞时，定时器排队等待
- 笔记本省电模式下，定时器精度降低

**解决方案：用时间差计算，而不是递减计数**

```javascript
class CountdownTimer {
  constructor(duration, onUpdate, onComplete) {
    this.duration = duration; // 总秒数
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.endTime = null;
    this.rafId = null;
  }
  
  start() {
    // 关键：用Date.now()作为基准，而不是靠计数器递减
    this.endTime = Date.now() + this.duration * 1000;
    this.tick();
  }
  
  tick = () => {
    const remaining = this.endTime - Date.now();
    
    if (remaining <= 0) {
      this.onUpdate(0);
      this.onComplete?.();
      return;
    }
    
    this.onUpdate(Math.ceil(remaining / 1000));
    this.rafId = requestAnimationFrame(this.tick);
  };
  
  pause() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
      // 记录剩余时间，恢复时重新计算endTime
      this.pausedRemaining = this.endTime - Date.now();
    }
  }
  
  resume() {
    if (this.pausedRemaining > 0) {
      this.endTime = Date.now() + this.pausedRemaining;
      this.tick();
    }
  }
  
  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }
}
```

### 问题二：后台标签页的时间漂移

当用户切换到其他标签页时，`requestAnimationFrame`会暂停（因为不需要渲染）。但`Date.now()`继续走，所以恢复后时间会自动对齐——这正是用时间差计算的优势。

如果需要在后台也能收到回调，可以用`setInterval`作为后备：

```javascript
// 双保险：rAF在前台精确更新，setInterval在后台兜底
start() {
  this.endTime = Date.now() + this.duration * 1000;
  
  // rAF：前台高精度
  this.tick();
  
  // setInterval：后台兜底
  this.intervalId = setInterval(() => {
    if (document.hidden) {
      this.checkRemaining();
    }
  }, 1000);
}

checkRemaining() {
  const remaining = Math.ceil((this.endTime - Date.now()) / 1000);
  if (remaining <= 0) {
    this.onUpdate(0);
    this.onComplete?.();
    this.stop();
  } else {
    this.onUpdate(remaining);
  }
}
```

### 问题三：visibilitychange处理

```javascript
// 标签页重新可见时，立即更新一次
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && this.endTime) {
    this.checkRemaining();
  }
});
```

### 完整UI实现

```html
<div class="countdown-container">
  <div class="countdown-display" id="display">00:00</div>
  <div class="countdown-controls">
    <input type="number" id="minutes" value="5" min="0" max="99">
    <span>分</span>
    <input type="number" id="seconds" value="0" min="0" max="59">
    <span>秒</span>
    <button id="start-btn">开始</button>
    <button id="pause-btn" disabled>暂停</button>
    <button id="reset-btn">重置</button>
  </div>
</div>

<style>
.countdown-display {
  font-size: 4rem;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  text-align: center;
  letter-spacing: 0.1em;
  color: #333;
}
.countdown-display.urgent {
  color: #e74c3c;
  animation: pulse 0.5s ease-in-out infinite alternate;
}
@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.05); }
}
</style>

<script>
const display = document.getElementById('display');
const timer = new CountdownTimer(
  0,
  (remaining) => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    display.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    display.classList.toggle('urgent', remaining <= 10 && remaining > 0);
  },
  () => {
    display.textContent = '时间到！';
    // 播放提示音
    const audio = new AudioContext();
    const osc = audio.createOscillator();
    osc.connect(audio.destination);
    osc.frequency.value = 800;
    osc.start();
    osc.stop(audio.currentTime + 0.3);
  }
);

document.getElementById('start-btn').addEventListener('click', () => {
  const m = parseInt(document.getElementById('minutes').value) || 0;
  const s = parseInt(document.getElementById('seconds').value) || 0;
  timer.duration = m * 60 + s;
  timer.start();
});
</script>
```

### 关键技术点

1. **永远用时间差计算**：`remaining = endTime - Date.now()`，而不是`seconds--`递减
2. **requestAnimationFrame**：前台高精度更新，与屏幕刷新率同步
3. **visibilitychange**：标签页切换时重新对齐时间
4. **padStart**：`String(n).padStart(2, '0')`比手动拼接`n < 10 ? '0' + n : n`更优雅
5. **Web Audio API**：倒计时结束的提示音不需要音频文件，OscillatorNode即可生成

### 常见坑点

- `setInterval(fn, 1000)`在后台标签页会被节流到1秒/次甚至更慢，导致UI更新不及时
- iOS Safari在省电模式下会将所有定时器精度降低到1秒
- `Date.now()`返回毫秒，别忘了除以1000
- `Math.ceil`vs `Math.floor`：用`ceil`避免显示0秒时实际还有999ms

---

## Component Deep Dive #59: Countdown Timer

A countdown timer looks simple — just subtract 1 every second. But in production, edge cases will make you question everything.

### Problem 1: setInterval Is Not Precise

`setInterval(fn, 1000)` doesn't mean exact 1-second intervals. Browsers delay timers due to: background tab throttling (Chrome throttles to minimum 1s/second), main thread blocking, and power-saving mode.

**Solution: Calculate from time difference, not decrement a counter**

Use `Date.now()` as the anchor: `remaining = endTime - Date.now()`. This way, even if the timer fires late, the displayed time is always accurate.

### Problem 2: Background Tab Time Drift

When the user switches tabs, `requestAnimationFrame` pauses (no rendering needed). But `Date.now()` keeps running, so time auto-aligns on return — this is the key advantage of time-difference calculation.

For background callback support, use `setInterval` as a fallback that only fires when `document.hidden` is true.

### Problem 3: visibilitychange Handling

Listen to `visibilitychange` to immediately update the display when the tab becomes visible again.

### Key Technical Points

1. **Always calculate from time difference**: `remaining = endTime - Date.now()`, not `seconds--`
2. **requestAnimationFrame**: High-precision foreground updates synced with screen refresh rate
3. **visibilitychange**: Re-align time when tab switches
4. **padStart**: `String(n).padStart(2, '0')` is cleaner than manual zero-padding
5. **Web Audio API**: No audio file needed for the completion beep — OscillatorNode generates it

### Common Pitfalls

- `setInterval(fn, 1000)` is throttled in background tabs, causing delayed UI updates
- iOS Safari reduces all timer precision to 1 second in power-saving mode
- `Date.now()` returns milliseconds — don't forget to divide by 1000
- Use `Math.ceil` not `Math.floor` to avoid displaying "0:00" when 999ms remain

> 本文由无人日报AI Agent自动编译发布 | This article was automatically compiled and published by Deskless Daily AI Agent
