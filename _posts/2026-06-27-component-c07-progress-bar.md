---
layout: post
title: "c07-进度条组件 Progress Bar | 数据可视化的基础利器"
date: 2026-06-27 08:00:00 +0800
categories: [组件, Web Component Dictionary]
tags: [progress-bar, css, web-components, frontend]
---


> **Web Component Dictionary v2.0 · 网页组件活字典**  
> 83个组件/8大分类/中英双语/实时预览/单文件无依赖  
> [在线体验](https://wdsega.github.io/web-components) | [购买 ¥9.99](https://payhip.com/b/S9pj2)



进度条是用户界面中最古老、最直观的反馈组件之一。加载进度、任务完成百分比、技能展示——这个小条条无处不在。

## 组件是什么

Progress Bar（进度条）是一种线性指示器，用数值（0-100%）直观呈现某个过程的完成程度。从文件上传到课程进度，从投票结果到健康数据，它是信息密度最高的展示方式之一。

## 效果预览

```
[████████████░░░░░] 72%   普通进度条
[▓▓▓▓▓▓▓▓░░░░░░░░] 52%   分段进度条  
[==============>>] 88%   动画进度条
```

## 代码拆解

### HTML 结构

```html
<!-- 基础进度条 -->
<div class="progress">
  <div class="progress-bar" role="progressbar" 
       style="--progress: 72%" 
       aria-valuenow="72" aria-valuemin="0" aria-valuemax="100">
    72%
  </div>
</div>

<!-- 分段进度条 -->
<div class="progress progress-striped">
  <div class="progress-bar progress-bar-success" style="--progress: 40%"></div>
  <div class="progress-bar progress-bar-warning" style="--progress: 30%"></div>
  <div class="progress-bar progress-bar-danger" style="--progress: 20%"></div>
</div>
```

### CSS 核心

```css
.progress {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: var(--progress, 0%);
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 9999px;
  transition: width 0.6s ease;
}

/* 条纹动画 */
.progress-striped .progress-bar {
  background-image: linear-gradient(
    45deg,
    rgba(255,255,255,.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255,255,255,.15) 50%,
    rgba(255,255,255,.15) 75%,
    transparent 75%
  );
  background-size: 1rem 1rem;
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  0% { background-position: 1rem 0; }
  100% { background-position: 0 0; }
}
```

## 关键技术点深挖

**CSS自定义属性驱动宽度**：用`--progress`变量控制宽度，比直接在style里写`width`更灵活，可以通过JS动态更新：

```javascript
bar.style.setProperty('--progress', newValue + '%')
```

**可访问性（a11y）必须实现**：
- `role="progressbar"` 告诉屏幕阅读器这是进度条
- `aria-valuenow/min/max` 提供数值范围
- `aria-label` 描述进度的内容

## 常见坑点

1. **`overflow: hidden` 不能缺**：父容器必须有`overflow:hidden`，不然圆角失效
2. **transition要加在bar上不是parent**：动画加在`.progress-bar`上，不是`.progress`
3. **分段进度条宽度相加不一定等于100%**：设计上允许不满100%（表示剩余/未分配）

## 完整可复制代码

```html
<!DOCTYPE html>
<html>
<head>
<style>
.progress-wrap { margin: 16px 0; }
.progress-label { display:flex; justify-content:space-between; font-size:13px; color:#6b7280; margin-bottom:4px; }
.progress { width:100%; height:8px; background:#e5e7eb; border-radius:9999px; overflow:hidden; }
.progress-bar { height:100%; width:var(--progress,0%); background:linear-gradient(90deg,#3b82f6,#2563eb); border-radius:9999px; transition:width .6s ease; }
.progress-bar.success { background:linear-gradient(90deg,#10b981,#059669); }
.progress-bar.warning { background:linear-gradient(90deg,#f59e0b,#d97706); }
.progress-bar.danger { background:linear-gradient(90deg,#ef4444,#dc2626); }
.progress-lg { height:16px; }
</style>
</head>
<body>
<div class="progress-wrap">
  <div class="progress-label"><span>项目进度</span><span>72%</span></div>
  <div class="progress"><div class="progress-bar" style="--progress:72%" role="progressbar" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100"></div></div>
</div>
<div class="progress-wrap">
  <div class="progress-label"><span>上传完成</span><span>45%</span></div>
  <div class="progress progress-lg"><div class="progress-bar success" style="--progress:45%"></div></div>
</div>
</body>
</html>
```

## 变体拓展

- **环形进度条**：用SVG `stroke-dashoffset` 实现圆形进度
- **步骤进度条**：分节点，适合多步骤表单
- **渐变多色**：根据数值动态改变颜色（低→红，高→绿）

---

*本文组件收录于 [Web Component Dictionary v2.0](https://payhip.com/b/S9pj2)，83个实用组件，¥9.99即可获取全套。*

---

## Progress Bar Component - The Backbone of Data Visualization


> **Web Component Dictionary v2.0**  
> 83 components / 8 categories / bilingual / live preview / zero dependencies  
> [Live Demo](https://wdsega.github.io/web-components) | [Buy $1.38](https://payhip.com/b/S9pj2)



The progress bar is one of the most universal feedback components in UI design. File uploads, task completion, skill ratings — this simple bar appears everywhere.

### What It Does

A Progress Bar linearly represents completion from 0–100%. It's the highest information-density display method for process visualization.

### CSS Magic: Custom Property Width Control

```css
.progress-bar {
  width: var(--progress, 0%);
  transition: width 0.6s ease;
}
```

Update via JS: `bar.style.setProperty('--progress', value + '%')`

### Key Pitfalls

1. Parent must have `overflow: hidden` or border-radius won't apply
2. Add `transition` on `.progress-bar`, not the parent
3. Always include `role="progressbar"` + `aria-valuenow/min/max` for accessibility

*Part of [Web Component Dictionary v2.0](https://payhip.com/b/S9pj2) — 83 components, zero dependencies.*
