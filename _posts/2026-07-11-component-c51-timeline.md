---
layout: post
title: "组件详解#51：时间轴Timeline，纯CSS实现交替布局与响应式 | Component Deep Dive #51: Timeline — Alternating Layout and Responsive Design with Pure CSS"
date: 2026-07-11
categories: [组件详解]
tags: [webdev, css, ui, responsive]
---

# 组件详解#51：时间轴Timeline，纯CSS实现交替布局与响应式

> 产品更新日志、公司发展历程、项目里程碑——时间轴是展示"按时间排列的事件"最直观的组件。但交替布局在移动端怎么优雅地变成单列？今天用纯CSS解决。

## Timeline是什么

时间轴（Timeline）是一种按时间顺序排列事件的信息展示组件。典型场景包括：

- 产品更新日志（changelog）
- 公司发展历程
- 项目里程碑追踪
- 用户操作记录

好的时间轴应该：
- 视觉上有一条明确的时间线
- 事件交替排列在线的左右两侧（桌面端）
- 移动端自动变为单列
- 支持不同状态的视觉区分（已完成/进行中/未开始）

## 代码拆解

### HTML结构

```html
<div class="timeline">
  <div class="timeline-item">
    <div class="timeline-dot completed"></div>
    <div class="timeline-content">
      <span class="timeline-date">2026-01</span>
      <h3>项目启动</h3>
      <p>完成需求分析和技术选型</p>
    </div>
  </div>
  <div class="timeline-item">
    <div class="timeline-dot completed"></div>
    <div class="timeline-content">
      <span class="timeline-date">2026-03</span>
      <h3>Alpha版本发布</h3>
      <p>核心功能开发完成，内部测试启动</p>
    </div>
  </div>
  <div class="timeline-item">
    <div class="timeline-dot active"></div>
    <div class="timeline-content">
      <span class="timeline-date">2026-07</span>
      <h3>Beta版本发布</h3>
      <p>公开测试中，收集用户反馈</p>
    </div>
  </div>
</div>
```

### CSS样式

```css
.timeline {
  position: relative;
  max-width: 800px;
  margin: 40px auto;
  padding: 20px 0;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #2563eb;
  transform: translateX(-50%);
}
.timeline-item {
  position: relative;
  width: 50%;
  padding: 20px 40px;
}
.timeline-item:nth-child(odd) {
  left: 0;
}
.timeline-item:nth-child(even) {
  left: 50%;
}
.timeline-dot {
  position: absolute;
  top: 28px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid #fff;
  background: #94a3b8;
  z-index: 1;
}
.timeline-item:nth-child(odd) .timeline-dot {
  right: -8px;
}
.timeline-item:nth-child(even) .timeline-dot {
  left: -8px;
}
.timeline-dot.completed { background: #22c55e; }
.timeline-dot.active {
  background: #2563eb;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4); }
  50% { box-shadow: 0 0 0 8px rgba(37,99,235,0); }
}
.timeline-content {
  background: #f8fafc;
  padding: 16px 20px;
  border-radius: 8px;
  border-left: 3px solid #2563eb;
}
.timeline-date {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

/* Mobile: single column */
@media (max-width: 600px) {
  .timeline::before { left: 20px; }
  .timeline-item {
    width: 100%;
    padding-left: 50px;
    padding-right: 10px;
  }
  .timeline-item:nth-child(even) { left: 0; }
  .timeline-dot { left: 12px !important; right: auto !important; }
}
```

## 关键技术点

1. **中线用伪元素**：`.timeline::before`画竖线，`left:50%`居中
2. **交替布局**：奇数项`left:0`靠左，偶数项`left:50%`靠右
3. **圆点定位**：奇数项圆点在右侧（`right:-8px`），偶数项在左侧（`left:-8px`）
4. **响应式断点**：600px以下改为单列，竖线移到左侧20px处
5. **状态动画**：进行中的圆点用`@keyframes pulse`呼吸效果

## 常见坑点

- **圆点偏移**：圆点中心要对齐竖线。`width:16px`时偏移量是`-8px`（半径），不是`-16px`
- **交替布局错位**：`nth-child(odd)`和`nth-child(even)`针对所有子元素，如果中间插了非timeline-item的元素会错乱
- **移动端竖线位置**：改为单列后竖线要移到左侧，圆点也要跟着移
- **内容溢出**：`timeline-content`没设`overflow:hidden`，长文本可能溢出圆角

## 变体拓展

- **卡片式时间轴**：每个事件用卡片包裹，添加图标和标签
- **双向时间轴**：竖线在中间，左右各有不同类型的事件（如左=计划，右=实际）
- **折叠式时间轴**：点击展开详情，适合事件较多时使用

---

# Component Deep Dive #51: Timeline — Alternating Layout and Responsive Design with Pure CSS

> Product changelogs, company history, project milestones — Timeline is the most intuitive way to display chronological events. But how do you gracefully switch alternating layout to single column on mobile? Pure CSS.

## What Is a Timeline

A Timeline displays events in chronological order. Common use cases:

- Product changelogs
- Company milestones
- Project tracking
- Activity logs

A good Timeline should:
- Have a clear visual timeline
- Alternate events left/right (desktop)
- Auto-switch to single column (mobile)
- Support status differentiation (completed/active/pending)

## Code Breakdown

### Key CSS

```css
.timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #2563eb;
  transform: translateX(-50%);
}
.timeline-item:nth-child(odd) { left: 0; }
.timeline-item:nth-child(even) { left: 50%; }

@media (max-width: 600px) {
  .timeline::before { left: 20px; }
  .timeline-item { width: 100%; padding-left: 50px; }
  .timeline-item:nth-child(even) { left: 0; }
  .timeline-dot { left: 12px !important; right: auto !important; }
}
```

## Key Technical Points

1. **Center line via pseudo-element**: `.timeline::before` draws the vertical line at `left:50%`
2. **Alternating layout**: Odd items `left:0`, even items `left:50%`
3. **Dot positioning**: Odd items dot at `right:-8px`, even items at `left:-8px` (radius offset)
4. **Responsive breakpoint**: Below 600px, switch to single column, move line to left
5. **Status animation**: Active dot uses `@keyframes pulse` breathing effect

## Common Pitfalls

- **Dot offset**: Dot center must align with the line. For `width:16px`, offset is `-8px` (radius), not `-16px`
- **Alternating mismatch**: `nth-child(odd/even)` targets all siblings; inserting non-item elements breaks the pattern
- **Mobile line position**: After switching to single column, move line to left and adjust dots accordingly
- **Content overflow**: Without `overflow:hidden`, long text may spill past rounded corners

## Variants

- **Card-style**: Each event wrapped in a card with icons and tags
- **Bidirectional**: Line in center, different event types on each side (planned vs. actual)
- **Collapsible**: Click to expand details, ideal for many events

*更多组件请访问 [Web Component Dictionary](https://wdsega.github.io/web-components/)*
