---
title: "组件详解#8：步骤指示器，让用户看到终点才能走完流程 | Component Deep Dive #8: Step Indicator — Users Need to See the Finish Line to Complete the Journey"
date: 2026-06-23 00:50:00 +0800
categories: [组件详解]
tags: [代码产品, 步骤指示器, Step Indicator, Web组件, 前端开发]
canonical_url: https://wdsega.github.io/2026/06/23/component-n08-step-indicator/
---

> 本文组件来自Web Component Dictionary v2.0·网页组件活字典，83组件/8分类/中英双语/实时预览/单文件无依赖。在线体验 wdsega.github.io/web-components | 购买 payhip.com/b/S9pj2 ¥9.99

注册一个新账号，填了一页表单，点"下一步"，又是一页，再点"下一步"，还有——你不知道总共要填几页，不知道终点在哪。这种不确定性会让30%的用户中途放弃。步骤指示器就是解决这个问题的：告诉用户"你在第2步，总共3步，马上就完了"。

## 步骤指示器是什么

步骤指示器（Step Indicator）是多步骤流程中的进度可视化组件。常见于注册向导、结账流程、表单分步填写、安装向导等场景。它通过圆形节点和连接线展示当前进度，已完成步骤打勾，当前步骤高亮，未完成步骤灰色。

## 效果预览

三个圆形节点横向排列，用横线连接。第一个节点绿色背景打勾（已完成），第二个节点主色高亮（当前步骤），第三个节点灰色（未完成）。连接线前半段绿色，后半段灰色。

## 代码拆解

### HTML结构

```html
<div class="steps">
  <div class="step completed">
    <div class="step-circle">✓</div>
    <div class="step-label">Account</div>
  </div>
  <div class="step-line active"></div>
  <div class="step current">
    <div class="step-circle">2</div>
    <div class="step-label">Profile</div>
  </div>
  <div class="step-line"></div>
  <div class="step">
    <div class="step-circle">3</div>
    <div class="step-label">Confirm</div>
  </div>
</div>
```

### CSS样式

```css
.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}
.step.completed .step-circle {
  background: #2ed573;
  color: #fff;
}
.step.current .step-circle {
  background: #e94560;
  color: #fff;
  box-shadow: 0 0 0 4px rgba(233, 69, 96, 0.2);
}
.step .step-circle {
  background: #ddd;
  color: #999;
}
.step-line {
  width: 80px;
  height: 3px;
  background: #ddd;
  margin: 0 -4px;
  margin-bottom: 28px;
}
.step-line.active {
  background: #2ed573;
}
.step-label {
  font-size: 12px;
  color: #666;
}
.step.current .step-label {
  color: #e94560;
  font-weight: bold;
}
```

### JavaScript逻辑

```javascript
function updateSteps(currentStep, totalSteps) {
  var steps = document.querySelectorAll('.step');
  var lines = document.querySelectorAll('.step-line');
  steps.forEach(function(step, index) {
    step.classList.remove('completed', 'current');
    if (index < currentStep - 1) {
      step.classList.add('completed');
      step.querySelector('.step-circle').textContent = '✓';
    } else if (index === currentStep - 1) {
      step.classList.add('current');
      step.querySelector('.step-circle').textContent = index + 1;
    } else {
      step.querySelector('.step-circle').textContent = index + 1;
    }
  });
  lines.forEach(function(line, index) {
    line.classList.toggle('active', index < currentStep - 1);
  });
}
```

## 关键技术点深挖

### 状态三态设计

每个步骤有三种状态：completed（绿色+打勾）、current（主色高亮+数字）、inactive（灰色+数字）。关键是连接线也要同步：已完成步骤之间的线变绿，当前步骤之后的线保持灰色。

### 响应式布局

在窄屏幕上，横向排列的步骤会挤压。两种解决方案：一是改为纵向排列（步骤从左到右变成从上到下，连接线从水平变垂直）；二是隐藏标签文字只保留圆形节点。

### 动画过渡

当前步骤变化时，加入过渡动画能显著提升体验：圆形背景色用`transition: background 0.3s`，连接线用`transition: width 0.3s`实现"填充"效果。

## 常见坑点

1. **步骤过多**：超过5个步骤时，指示器会占太多空间。解决方案：折叠已完成步骤，只显示"✓ 步骤1 → ✓ 步骤2 → 当前步骤3 → 步骤4 → 步骤5"
2. **不可回退**：有些设计不允许点击已完成步骤回退。这需要明确视觉提示——已完成步骤的圆圈可点击（加cursor:pointer），未完成步骤不可点击
3. **表单验证不同步**：用户点击"下一步"但当前步骤表单未通过验证，步骤指示器不应该前进。务必在`updateSteps`调用前先验证

## 完整可复制代码

```html
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: sans-serif; padding: 40px; }
.steps { display: flex; align-items: center; justify-content: center; }
.step { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.step-circle {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold; font-size: 14px; transition: all 0.3s;
}
.step.completed .step-circle { background: #2ed573; color: #fff; }
.step.current .step-circle {
  background: #e94560; color: #fff;
  box-shadow: 0 0 0 4px rgba(233,69,96,0.2);
}
.step:not(.completed):not(.current) .step-circle { background: #ddd; color: #999; }
.step-line {
  width: 80px; height: 3px; background: #ddd;
  margin-bottom: 28px; transition: background 0.3s;
}
.step-line.active { background: #2ed573; }
.step-label { font-size: 12px; color: #666; }
.step.current .step-label { color: #e94560; font-weight: bold; }
</style>
</head>
<body>
<div class="steps" id="steps"></div>
<script>
var current = 2, total = 3;
var labels = ['Account', 'Profile', 'Confirm'];

function render() {
  var container = document.getElementById('steps');
  container.innerHTML = '';
  for (var i = 0; i < total; i++) {
    if (i > 0) {
      var line = document.createElement('div');
      line.className = 'step-line' + (i < current ? ' active' : '');
      container.appendChild(line);
    }
    var step = document.createElement('div');
    step.className = 'step';
    if (i < current - 1) step.classList.add('completed');
    else if (i === current - 1) step.classList.add('current');
    var circle = document.createElement('div');
    circle.className = 'step-circle';
    circle.textContent = i < current - 1 ? '\u2713' : (i + 1);
    var label = document.createElement('div');
    label.className = 'step-label';
    label.textContent = labels[i];
    step.appendChild(circle);
    step.appendChild(label);
    container.appendChild(step);
  }
}
render();
</script>
</body>
</html>
```

## 变体拓展

- **可点击导航**：已完成步骤可点击回退
- **百分比进度**：底部加一个进度条，显示"66% Complete"
- **错误状态**：当前步骤验证失败时，圆圈变红色+感叹号
- **竖向布局**：适用于移动端，步骤从上到下排列，连接线垂直

---

> This component is from Web Component Dictionary v2.0 — 83 components / 8 categories / bilingual / live preview / single-file zero-dependency. Try it at wdsega.github.io/web-components | Buy at payhip.com/b/S9pj2

When users fill out a multi-page form without knowing how many steps remain, 30% abandon halfway. A step indicator solves this by showing "You're on step 2 of 3 — almost done."

Each step has three states: completed (green + checkmark), current (highlighted + number), inactive (gray + number). The connecting lines must sync: lines between completed steps turn green, lines after the current step stay gray.

Key pitfalls: too many steps (collapse completed ones), click-to-go-back needs clear visual affordance, and form validation must pass before advancing the indicator.

Common variants: clickable navigation for completed steps, percentage progress bar, error states (red circle with exclamation mark), and vertical layout for mobile.
