---
title: "组件c64：进度条 | Component c64: Progress Bar"
layout: post
date: 2026-07-16
categories: [组件, 前端]
tags: [javascript, progress, animation, css]
---

> 65%的进度条让人安心，100%让人愉悦——这个不起眼的横条是用户耐心的可视化锚点。

## 这是什么

进度条（Progress Bar）用一根填充的横条展示任务完成百分比。它把抽象的"等待"变成具体的"还剩多少"，是文件上传、数据处理、安装向导中最基础的状态反馈组件。

## 效果预览

```
[初始] ████████████░░░░░░░░░░  65%
         ↓ 点击 100% 按钮
[完成] ██████████████████████  100%  (渐变色填满，0.5s过渡)
```

## 代码拆解

### HTML

```html
<div style="max-width:500px;margin:40px auto">
  <div style="margin-bottom:20px">
    <p style="font-size:13px;color:#666;margin-bottom:8px">Completion</p>
    <div style="height:12px;background:#eee;border-radius:6px;overflow:hidden">
      <div id="pbar" style="height:100%;width:65%;
        background:linear-gradient(90deg,#667eea,#764ba2);
        border-radius:6px;transition:width 0.5s"></div>
    </div>
    <p id="plabel" style="font-size:12px;color:#999;margin-top:6px">65%</p>
  </div>
  <div style="display:flex;gap:10px">
    <button onclick="setP(25)" style="padding:8px 16px;background:#333;
      color:#fff;border:none;border-radius:6px;cursor:pointer">25%</button>
    <button onclick="setP(50)" style="padding:8px 16px;background:#333;
      color:#fff;border:none;border-radius:6px;cursor:pointer">50%</button>
    <button onclick="setP(100)" style="padding:8px 16px;background:#2ed573;
      color:#fff;border:none;border-radius:6px;cursor:pointer">100%</button>
  </div>
</div>
```

### CSS

```css
/* 渐变填充提升视觉层次 */
#pbar {
  background: linear-gradient(90deg, #667eea, #764ba2);
  /* transition让宽度变化平滑 */
  transition: width 0.5s ease;
}

/* 外层容器overflow:hidden裁切圆角 */
.progress-track {
  height: 12px;
  background: #eee;
  border-radius: 6px;
  overflow: hidden;
}
```

### JavaScript

```javascript
function setP(pct) {
  document.getElementById('pbar').style.width = pct + '%';
  document.getElementById('plabel').textContent = pct + '%';
}

// 进度自动递增版本（模拟文件上传）
function animateProgress(target, duration) {
  const bar = document.getElementById('pbar');
  const label = document.getElementById('plabel');
  const start = parseInt(bar.style.width) || 0;
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.round(start + (target - start) * progress);
    bar.style.width = current + '%';
    label.textContent = current + '%';
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
```

## 关键技术点

1. **transition而非JS动画**：CSS `transition: width 0.5s` 让进度条平滑增长，浏览器自动处理插值，比JS逐帧修改性能好10倍
2. **overflow:hidden + border-radius**：外层轨道设圆角和溢出隐藏，内层填充条自动被裁切成圆角两端，无需单独处理
3. **渐变填充**：`linear-gradient(90deg, #667eea, #764ba2)` 比纯色更有层次感，90deg确保渐变方向跟随填充方向
4. **requestAnimationFrame**：自动递增版本用rAF而非setInterval，与浏览器刷新率同步，不掉帧

## 常见坑点

- **transition不生效**：如果用`width`属性而非`style.width`，或者元素`display:none`，过渡不会触发。确保元素可见且用inline style
- **百分比溢出**：pct超过100时进度条会溢出轨道。加`Math.min(pct, 100)`保护
- **标签不同步**：只改了width忘了改label文本，用户看到条满了数字还停在65%。两行代码必须一起改
- **初始宽度为0**：如果初始width设0%，首次填充时transition从0跳到目标值可能闪烁。设一个小的初始值如2%缓解

## 变体拓展

- **分段进度条**：多个色块拼接，展示多步骤完成度（如安装向导的5步进度）
- **不确定进度条**：没有具体百分比的场景，用CSS动画让色块来回滑动（`@keyframes indeterminate`）
- **圆形进度条**：用SVG的`stroke-dasharray`+`stroke-dashoffset`实现环形进度
- **渐变流动**：在渐变填充上加`background-size:200%`+`@keyframes`让颜色流动，增加动感
- **多色阈值**：低于30%红色、30-70%黄色、70%以上绿色，用JS动态切换background

---

A progress bar fills a horizontal track to show task completion percentage. It turns abstract "waiting" into concrete "how much is left" — the most basic state feedback in file uploads, data processing, and installers.

**Key implementation**: Use CSS `transition: width 0.5s` for smooth growth (10x better performance than JS animation). Set `overflow: hidden` + `border-radius` on the track to clip the fill bar. Use `linear-gradient` for visual depth. For auto-increment, use `requestAnimationFrame` synced with browser refresh rate.

**Common pitfalls**: Transition won't fire if using `width` attribute instead of `style.width`. Always clamp percentage with `Math.min(pct, 100)`. Update label text and bar width together. Initial width of 0% may flash — use 2% minimum.

**Variants**: Segmented bars for multi-step, indeterminate bars with sliding animation, circular progress with SVG `stroke-dashoffset`, flowing gradient, threshold-based color switching.

*Full copy-paste code available above. Questions? Leave a comment.*
