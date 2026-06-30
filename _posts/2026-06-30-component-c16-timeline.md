---
layout: post
title: "c16-时间线布局组件 Timeline | 一根线和几个圆点的叙事魔法"
date: 2026-06-30 08:00:00 +0800
categories: [组件, Web Component Dictionary]
tags: [timeline, layout, history, css]
---

> **Web Component Dictionary v2.0 · 网页组件活字典**
> 83个组件 / 8大分类 / 中英双语 / 实时预览 / 单文件无依赖
> [在线体验](https://wdsega.github.io/web-components) | [购买 ¥9.99](https://payhip.com/b/S9pj2)


用户看一眼你的产品更新日志就想关掉？试试时间线。一条竖线、几个彩色圆点，就能把"这个月修了17个bug"变成"这段旅程值得一看"。

## 组件是什么

Timeline（时间线布局）是一种按时间顺序纵向排列事件的展示模式。核心要素：一条垂直轴线 + 若干节点（圆点/图标）+ 事件卡片。常见场景：产品更新日志、订单物流追踪、项目里程碑、个人经历页面。

## HTML结构

```html
<div class="tl">
  <div class="tl-line"></div>
  <div class="tl-item">
    <div class="tl-dot"></div>
    <div class="tl-card">
      <div class="tl-date">2026 Q3</div>
      <h3>v2.0 正式发布</h3>
      <p>重构核心架构，性能提升40%</p>
    </div>
  </div>
  <div class="tl-item">
    <div class="tl-dot success"></div>
    <div class="tl-card">
      <div class="tl-date">2026 Q2</div>
      <h3>完成A轮融资</h3>
      <p>获得500万美元投资</p>
    </div>
  </div>
</div>
```

## CSS核心

```css
.timeline { position: relative; padding: 20px 0; max-width: 600px; margin: 0 auto; }
.tl-line { position: absolute; left: 20px; top: 0; bottom: 0; width: 3px; background: linear-gradient(180deg, #667eea, #e94560); }
.tl-item { position: relative; padding-left: 50px; margin-bottom: 30px; }
.tl-dot { position: absolute; left: 11px; top: 8px; width: 20px; height: 20px; border-radius: 50%; background: #667eea; border: 3px solid #fff; box-shadow: 0 0 0 3px #667eea; }
.tl-card { background: #fff; padding: 16px 20px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); transition: transform 0.2s; }
.tl-card:hover { transform: translateX(4px); }
```

## JavaScript：滚动渐显

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('tl-visible');
  });
}, { threshold: 0.2 });
document.querySelectorAll('.tl-item').forEach(item => observer.observe(item));
```

## 三行CSS极简版

```css
.timeline { border-left: 3px solid #667eea; padding-left: 30px; }
.tl-item { position: relative; margin-bottom: 24px; }
.tl-item::before { content: ""; position: absolute; left: -39px; top: 4px; width: 14px; height: 14px; border-radius: 50%; background: #667eea; border: 3px solid #fff; box-shadow: 0 0 0 3px #667eea; }
```

## 实战建议

- **间距**：节点间距30-40px，太密读起来累
- **颜色**：用不同颜色标识节点类型（成功=绿、警告=黄、错误=红）
- **响应式**：移动端左对齐单列，桌面端交替双列
- **动画**：IntersectionObserver做滚动渐显，不要一次性全弹出来

---

## Timeline Layout: A Line, a Few Dots, and a Story Worth Telling

When users scan your changelog and close it in 3 seconds, the problem might not be your content — it's your layout. A timeline transforms a flat list into a visual journey.

### What It Is

A vertical chronologically-ordered layout with a center axis line, connected nodes, and content cards. Use cases: product changelogs, shipment tracking, project milestones, personal portfolios.

### Core CSS

```css
.timeline { position: relative; padding: 20px 0; max-width: 600px; }
.tl-line { position: absolute; left: 20px; top: 0; bottom: 0; width: 3px; background: linear-gradient(180deg, #667eea, #e94560); }
.tl-item { position: relative; padding-left: 50px; margin-bottom: 30px; }
.tl-dot { position: absolute; left: 11px; top: 8px; width: 20px; height: 20px; border-radius: 50%; background: #667eea; border: 3px solid #fff; box-shadow: 0 0 0 3px #667eea; }
```

### Scroll Animation

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('tl-visible'); });
}, { threshold: 0.2 });
```

### Pro Tips
- **Spacing**: 30-40px between nodes
- **Color coding**: Green for complete, yellow for in-progress, red for blocked
- **Responsive**: Single column on mobile, alternating two-column on desktop
- **Animation**: Scroll-triggered fade-in, not a one-shot entrance

---

*本文是 Web Component Dictionary 组件介绍系列第16篇。查看全部83个组件：[在线体验](https://wdsega.github.io/web-components)*
