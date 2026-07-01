---
layout: post
title: "组件详解#20：FAB浮动操作按钮，手机最重要的那个圆圈 | Component Deep Dive #20: FAB Floating Action Button — The Most Important Mobile Button"
date: 2026-07-01 08:10:00 +0800
categories: [component, frontend]
tags: [css, javascript, ui, component]
author: 编译员
---

WhatsApp右下角的蓝色圆形，Google Maps的导航按钮，Gmail的写信按钮。

这就是FAB——Floating Action Button，浮动操作按钮。永远在那，永远在拇指够得到的地方。

## 为什么FAB是移动端最重要的按钮

Material Design规范给出了三个核心理由：

1. **单手可及**：右下角是右手拇指热区的黄金位置
2. **视觉优先**：圆形+投影让它在任何页面都能被第一眼注意到
3. **语义清晰**：一个页面只应该有一个主要操作，FAB就是那个操作

## 布局核心

```css
.ef-fab-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 12px;
}
```

注意 `flex-direction: column-reverse`——这让子菜单从下往上展开，FAB自身永远固定在底部，子项目往上堆叠。

## 展开菜单的关键

```css
.ef-fab-menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease, opacity 0.3s ease;
  opacity: 0;
}

.ef-fab-container.open .ef-fab-menu {
  max-height: 300px;
  opacity: 1;
}
```

用 `max-height` 而不是 `height` 做动画，因为子项数量不固定。不要用 `display: none/block` 切换，无法做过渡动画。

## JS只需要一行逻辑

```javascript
fab.addEventListener('click', () => {
  container.classList.toggle('open');
  icon.textContent = container.classList.contains('open') ? '×' : '+';
});
```

点击FAB，切换 `open` 类，图标从 `+` 变 `×`，就这么简单。

## 三个细节决定质感

**1. 旋转图标**

```css
.ef-fab-btn .ef-fab-icon {
  transition: transform 0.3s ease;
}
.ef-fab-container.open .ef-fab-btn .ef-fab-icon {
  transform: rotate(45deg);
}
```

`+` 旋转45度就变成 `×`，一个CSS属性解决图标切换。

**2. 子项标签延迟**

```css
.ef-fab-mini:nth-child(1) { transition-delay: 0s; }
.ef-fab-mini:nth-child(2) { transition-delay: 0.05s; }
.ef-fab-mini:nth-child(3) { transition-delay: 0.1s; }
```

错开延迟，展开时有瀑布感，不是一坨同时出现。

**3. 点击空白关闭**

```javascript
document.addEventListener('click', (e) => {
  if (!container.contains(e.target)) {
    container.classList.remove('open');
  }
});
```

用户点击FAB外部时自动关闭，减少多余操作步骤。

## 什么时候不该用FAB

FAB只适合**整个页面最重要的单一操作**。以下情况不要用：

- 页面有多个同等重要的操作 → 用工具栏
- 操作是破坏性的（删除、注销）→ 不能放FAB，太显眼会误触
- 桌面端有充足空间 → 直接用按钮，FAB是移动端方案

---

*English below*

---

WhatsApp's blue circle, Google Maps' navigate button, Gmail's compose button. That's the FAB — always there, always within thumb reach.

## The Layout Trick

```css
.ef-fab-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 12px;
}
```

`column-reverse` keeps the FAB at the bottom while child items stack upward.

## The Menu Animation

Use `max-height` transition (not `display: none/block`) so items animate smoothly regardless of count.

## The JS

One line: toggle an `open` class, rotate the `+` icon 45 degrees and it becomes `×`. Add a document click listener to close on outside click.

**When NOT to use FAB**: multiple equal-priority actions, destructive actions, or desktop layouts with plenty of space.

Full code and live demo at [wdsega.github.io](https://wdsega.github.io).
