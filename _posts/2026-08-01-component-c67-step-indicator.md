---
title: "组件c67：步骤指示器 | Component c67: Step Indicator"
layout: post
date: 2026-08-01
categories: [组件, 前端]
tags: [css, steps, wizard, progress]
---

> 用户走到第三步放弃的概率是第一步的5倍——步骤指示器不是装饰，是给用户"还差多远"的心理锚点。

## 这是什么

步骤指示器（Step Indicator）用编号圆圈和连接线展示多步流程的进度。每步有三种状态：已完成（绿色对勾）、当前（高亮色）、未到达（灰色）。它让用户在填表、注册、结账等流程中始终知道自己在哪一步、还剩几步。

## 效果预览

```
  ✓ ────── ② ────── ③
[完成]   [当前]   [未到达]
 绿色     红色      灰色
```

## 代码拆解

### HTML

```html
<div style="display:flex;justify-content:center;align-items:center;gap:0;padding:40px 20px">
  <!-- Step 1: Completed -->
  <div style="display:flex;align-items:center">
    <div style="width:36px;height:36px;border-radius:50%;
      background:#2ed573;color:#fff;display:flex;
      align-items:center;justify-content:center;font-weight:bold">✓</div>
    <div style="width:80px;height:3px;background:#2ed573"></div>
  </div>
  <!-- Step 2: Active -->
  <div style="display:flex;align-items:center">
    <div style="width:36px;height:36px;border-radius:50%;
      background:#e94560;color:#fff;display:flex;
      align-items:center;justify-content:center;font-weight:bold">2</div>
    <div style="width:80px;height:3px;background:#ddd"></div>
  </div>
  <!-- Step 3: Inactive -->
  <div style="display:flex;align-items:center">
    <div style="width:36px;height:36px;border-radius:50%;
      background:#ddd;color:#999;display:flex;
      align-items:center;justify-content:center;font-weight:bold">3</div>
  </div>
</div>
```

### CSS

```css
/* 三态配色 */
.step-done    { background: #2ed573; color: #fff; }
.step-active  { background: #e94560; color: #fff; }
.step-inactive { background: #ddd; color: #999; }

/* 连接线 */
.step-line { height: 3px; width: 80px; transition: background 0.3s; }
.step-line.done    { background: #2ed573; }
.step-line.pending { background: #ddd; }

/* 圆圈基础 */
.step-circle {
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold;
  transition: background 0.3s, color 0.3s;
}

/* 响应式：移动端隐藏连接线宽度 */
@media (max-width: 600px) {
  .step-line { width: 40px; }
  .step-circle { width: 32px; height: 32px; font-size: 14px; }
}
```

### JavaScript

```javascript
class StepIndicator {
  constructor(container, total, current = 0) {
    this.container = container;
    this.total = total;
    this.current = current;
    this.render();
  }

  render() {
    let html = '<div style="display:flex;align-items:center;justify-content:center">';
    for (let i = 1; i <= this.total; i++) {
      const state = i < this.current ? 'done' :
                    i === this.current ? 'active' : 'inactive';
      const label = state === 'done' ? '✓' : i;
      const bg = state === 'done' ? '#2ed573' :
                 state === 'active' ? '#e94560' : '#ddd';
      const color = state === 'inactive' ? '#999' : '#fff';
      html += `<div style="display:flex;align-items:center">`;
      html += `<div style="width:36px;height:36px;border-radius:50%;
        background:${bg};color:${color};display:flex;
        align-items:center;justify-content:center;
        font-weight:bold">${label}</div>`;
      if (i < this.total) {
        const lineColor = i < this.current ? '#2ed573' : '#ddd';
        html += `<div style="width:80px;height:3px;
          background:${lineColor};transition:background 0.3s"></div>`;
      }
      html += `</div>`;
    }
    html += '</div>';
    this.container.innerHTML = html;
  }

  next() {
    if (this.current < this.total) {
      this.current++;
      this.render();
    }
  }

  prev() {
    if (this.current > 1) {
      this.current--;
      this.render();
    }
  }

  goTo(step) {
    if (step >= 1 && step <= this.total) {
      this.current = step;
      this.render();
    }
  }
}

// 使用
const indicator = new StepIndicator(document.getElementById('steps'), 4, 1);
```

## 关键技术点

1. **三态视觉编码**：绿色=完成、红色=当前、灰色=未到达，用颜色而非文字传递进度信息，0.1秒即可识别
2. **连接线同步**：连接线颜色跟随前一步的状态——只有前一步完成，到当前步的线才变绿
3. **对勾替代数字**：已完成步骤用✓替代数字，进一步减少认知负荷
4. **transition过渡**：圆圈背景色和连接线都用`transition: 0.3s`，步骤切换时颜色渐变而非跳变

## 常见坑点

- **步骤太多挤在一起**：6步以上在移动端水平排不下。解决方案：移动端只显示当前步±1，其余用省略号
- **连接线不等长**：用flex布局但没给连接线`flex:1`，步骤间距不一致。应设固定宽度或flex等分
- **不更新已完成状态的颜色**：用户回退到前一步，已完成步变成了当前步，但颜色没变。必须重渲染
- **点击步骤直接跳转**：未完成步骤允许跳转会导致流程混乱。建议只允许向前，回退用单独的"上一步"按钮

## 变体拓展

- **垂直步骤条**：流程步骤多时竖向排列，适合移动端长流程（注册、KYC认证）
- **进度条混合**：顶部放一条总进度条，下方放步骤指示器，双重视觉反馈
- **步骤内嵌表单**：当前步骤的圆圈下方直接展示该步表单，减少页面跳转
- **动态步骤**：根据用户选择增减后续步骤（如选择"企业用户"则多一步公司信息）
- **步骤缩略预览**：鼠标悬停已完成步骤时显示该步填写的内容摘要

---

A step indicator uses numbered circles and connecting lines to show progress in multi-step flows (checkout, registration, wizard). Each step has three states: completed (green checkmark), active (highlighted), and inactive (gray). It provides the psychological anchor of "how much further."

**Key implementation**: Three-color encoding (green/red/gray) for instant recognition. Connecting line color follows the preceding step's state. Use checkmarks for completed steps. Add `transition: 0.3s` on all color changes.

**Common pitfalls**: Too many steps overflow on mobile (show current ±1 with ellipsis). Uneven connecting lines without `flex:1`. Forgetting to re-render when navigating back. Allowing jump-ahead to incomplete steps.

**Variants**: Vertical layout for long flows, progress bar hybrid, inline forms, dynamic step count, hover preview.

*Full copy-paste code available above. Questions? Leave a comment.*
