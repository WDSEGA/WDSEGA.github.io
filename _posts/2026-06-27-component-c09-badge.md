---
layout: post
title: "c09-徽章组件 Badge | 信息标注的最小单元"
date: 2026-06-27 09:00:00 +0800
categories: [组件, Web Component Dictionary]
tags: [badge, css, web-components, frontend]
---


> **Web Component Dictionary v2.0 · 网页组件活字典**  
> 83个组件/8大分类/中英双语/实时预览/单文件无依赖  
> [在线体验](https://wdsega.github.io/web-components) | [购买 ¥9.99](https://payhip.com/b/S9pj2)



红点、数字气泡、状态标签——Badge（徽章组件）是信息密度最高的UI元素之一。

## 组件是什么

Badge 是一个小型标签或计数器，附加在其他元素上，传达额外状态信息：未读消息数、新功能标注、状态分类。

## 分类

1. **数字徽章**：显示计数（消息数、购物车数量）
2. **状态徽章**：表示状态（Active/Inactive/Pending）
3. **标签徽章**：信息分类（New/Hot/Sale）
4. **点状徽章**：只有圆点，表示有新内容

## HTML + CSS 实现

```html
<!-- 数字徽章（悬浮在图标上） -->
<div class="badge-wrap">
  <button class="icon-btn">
    <svg><!-- 铃铛图标 --></svg>
  </button>
  <span class="badge badge-dot">5</span>
</div>

<!-- 内联状态徽章 -->
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-danger">Blocked</span>
<span class="badge badge-info">New</span>

<!-- 大数字溢出 -->
<span class="badge badge-primary">{99+}</span>
```

```css
/* 基础徽章 */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
}

/* 颜色变体 */
.badge-primary { background: #dbeafe; color: #1e40af; }
.badge-success { background: #dcfce7; color: #166534; }
.badge-warning { background: #fef9c3; color: #854d0e; }
.badge-danger  { background: #fee2e2; color: #991b1b; }
.badge-info    { background: #e0f2fe; color: #0c4a6e; }

/* 悬浮数字徽章 */
.badge-wrap { position: relative; display: inline-block; }
.badge-dot {
  position: absolute;
  top: -6px; right: -6px;
  min-width: 18px; height: 18px;
  background: #ef4444; color: white;
  border: 2px solid white;
  padding: 0 4px;
  border-radius: 9999px;
  font-size: 10px;
}

/* 超出99显示99+ */
.badge-overflow::after { content: "+"; }
```

## 关键技术点

**数字溢出处理**：超过99时显示"99+"，防止大数字撑大徽章：

```javascript
function formatBadge(count) {
  if (count > 99) return '99+';
  if (count === 0) return null; // 0时不显示
  return String(count);
}
```

**`min-width`而非`width`**：徽章宽度不固定，用`min-width`确保单个数字不会变成椭圆。

## 常见坑点

1. 悬浮徽章的父元素必须有`position: relative`
2. 徽章颜色建议用浅底深字（#dbeafe + #1e40af），比纯色背景+白字更柔和
3. 0值要不显示（用JS判断），不要显示"0"——0条消息的通知徽章是噪音

---

*本文组件收录于 [Web Component Dictionary v2.0](https://payhip.com/b/S9pj2)，83个实用组件，¥9.99即可获取全套。*

---

## Badge Component - The Minimal Unit of Information Labeling


> **Web Component Dictionary v2.0**  
> 83 components / 8 categories / bilingual / live preview / zero dependencies  
> [Live Demo](https://wdsega.github.io/web-components) | [Buy $1.38](https://payhip.com/b/S9pj2)



Badges are the smallest but highest information-density UI elements: notification counts, status labels, content tags.

### Four Badge Types

1. **Numeric badges**: counts (cart items, unread messages)
2. **Status badges**: Active/Pending/Blocked
3. **Label badges**: New/Hot/Sale  
4. **Dot badges**: just a dot, means "something new"

### Key Rule: Hide Zero Values

```javascript
function formatBadge(count) {
  if (count <= 0) return null;
  return count > 99 ? '99+' : String(count);
}
```

Showing "0" in a notification badge is UI noise. Hide it.

*Part of [Web Component Dictionary v2.0](https://payhip.com/b/S9pj2)*
