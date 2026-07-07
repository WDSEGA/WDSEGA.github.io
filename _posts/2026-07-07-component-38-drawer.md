---
layout: post
title: "侧边抽屉 | Component Deep Dive #38: Drawer — Focus Trap, Inert, and Body Scroll Lock"
date: 2026-07-07 12:00:00 +0800
categories: [组件深度解析, Component Deep Dive]
tags: [drawer, focus-trap, inert, webdev]
description: "侧边抽屉的核心是焦点陷阱和滚动锁定——滑出面板容易，难的是不让用户跑到面板后面去。"
author: 编译员
---

# 侧边抽屉 | Component Deep Dive #38: Drawer — Focus Trap, Inert, and Body Scroll Lock

> 点一个按钮，面板从侧边滑出。但用户按Tab键跑了，背景还在滚动——这不算抽屉，这是灾难。

侧边抽屉（Drawer / Off-canvas Panel）在导航、筛选、详情展示中广泛使用。面板从屏幕边缘滑入，覆盖部分内容或全部内容。视觉上很简单——`transform: translateX()`加个transition就行。但真正难的是焦点管理和滚动锁定。

## 核心原理

抽屉打开时需要做三件事：

1. **锁定背景滚动** — 用户在抽屉内滚动时，背景页面不应跟着动
2. **陷阱焦点** — Tab键只能在抽屉内部循环，不能跑到背景中去
3. **恢复焦点** — 关闭抽屉后，焦点回到触发按钮

传统实现用`overflow:hidden`锁滚动，手动遍历focusable元素做焦点陷阱。现在有了`inert`属性——一行代码就能把背景内容从tab序列和辅助技术中完全移除。

## 实现

```html
<div id="app">
  <header>
    <button id="open-drawer">打开筛选</button>
  </header>
  <main>
    <p>页面主内容...</p>
  </main>
</div>

<aside class="drawer" id="filter-drawer" hidden>
  <div class="drawer-overlay" data-close></div>
  <div class="drawer-panel" role="dialog"
    aria-modal="true" aria-labelledby="drawer-title">
    <header class="drawer-header">
      <h2 id="drawer-title">筛选条件</h2>
      <button class="drawer-close" data-close aria-label="关闭">x</button>
    </header>
    <div class="drawer-body">
      <!-- 筛选内容 -->
      <label><input type="checkbox"> 仅看有货</label>
      <label><input type="checkbox"> 免运费</label>
      <button>应用筛选</button>
    </div>
  </div>
</aside>
```

```css
.drawer { position: fixed; inset: 0; z-index: 100; }

.drawer-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5);
  opacity: 0;
  transition: opacity 0.3s;
}

.drawer-panel {
  position: absolute;
  top: 0; right: 0; bottom: 0;
  width: min(400px, 90vw);
  background: #fff;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0,0,0,0.1);
}

.drawer[open] .drawer-overlay { opacity: 1; }
.drawer[open] .drawer-panel { transform: translateX(0); }
```

```javascript
const drawer = document.getElementById('filter-drawer');
const openBtn = document.getElementById('open-drawer');
const app = document.getElementById('app');
let lastFocused = null;

function getFocusable(container) {
  return Array.from(container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"])'
  )).filter(el => el.offsetParent !== null);
}

function openDrawer() {
  lastFocused = document.activeElement;
  drawer.hidden = false;
  // Force reflow for transition
  drawer.offsetHeight;
  drawer.setAttribute('open', '');

  // Lock background: inert makes it unclickable, unfocusable,
  // and invisible to screen readers
  app.inert = true;
  document.body.style.overflow = 'hidden';

  // Focus first element in drawer
  const focusable = getFocusable(drawer);
  if (focusable.length) focusable[0].focus();
}

function closeDrawer() {
  drawer.removeAttribute('open');
  app.inert = false;
  document.body.style.overflow = '';

  // Wait for transition, then hide
  setTimeout(() => {
    drawer.hidden = true;
    if (lastFocused) lastFocused.focus();
  }, 300);
}

// Focus trap inside drawer
drawer.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;

  const focusable = getFocusable(drawer);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// Close on overlay/click
drawer.addEventListener('click', e => {
  if (e.target.hasAttribute('data-close')) closeDrawer();
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && drawer.hasAttribute('open')) {
    closeDrawer();
  }
});

openBtn.addEventListener('click', openDrawer);
```

## inert属性

`inert`是HTML原生的"冻结"属性。设置`inert`的元素及其子树：
- 不可聚焦（已有的焦点被移除）
- 不可点击（鼠标和触摸事件被忽略）
- 对屏幕阅读器隐藏（aria-hidden效果）
- 不参与页面序列查找

这意味着不需要手动管理背景区域的`aria-hidden`和`tabindex="-1"`——一个属性全搞定。2024年起所有主流浏览器均已支持。

## 常见陷阱

1. **transition与hidden冲突** — `hidden`属性会立即移除元素，CSS transition来不及播放。解决方法：先移除`hidden`，强制reflow（`el.offsetHeight`），再添加`open`状态类。关闭时反向操作：先移除`open`，等transition结束后再设`hidden`。

2. **iOS Safari的body滚动锁定** — `overflow:hidden`在iOS Safari上不可靠，需要额外加`position:fixed`+记录滚动位置。或者用`overscroll-behavior:contain`限制抽屉内滚动不传播到body。

3. **焦点跑到面板外面** — 没有`inert`或焦点陷阱时，用户按Tab键会跑到背景页面的链接上。视觉上面板在前，但焦点在后面，屏幕阅读器用户完全困惑。

4. **Esc键关闭后焦点丢失** — 关闭抽屉后焦点回到body开头，用户需要重新定位。正确做法是记录打开时的`document.activeElement`，关闭后恢复。

## 底层逻辑

抽屉本质是一个"模态"组件——它创建了一个临时的交互层，用户必须先处理这个层才能回到主页面。模态的核心约束是：背景内容应该被"冻结"，而不是仅仅被"遮挡"。

`inert`属性完美实现了这个语义：它不是视觉遮挡，而是交互隔离。背景内容仍然可见（通过半透明遮罩），但不可操作。这比`pointer-events:none`更彻底——它还阻止了键盘导航和辅助技术访问。

焦点陷阱的实现逻辑：在抽屉内监听Tab键，当焦点到达第一个或最后一个focusable元素时"折返"。配合`inert`，即使折返逻辑有bug，用户也跑不到背景中去——双保险。

---

# Drawer | Component Deep Dive #38: Drawer — Focus Trap, Inert, and Body Scroll Lock

> Click a button, a panel slides in from the side. But the user presses Tab and escapes, the background keeps scrolling — that's not a drawer, that's a disaster.

The Drawer (Off-canvas Panel) is widely used in navigation, filtering, and detail views. A panel slides in from the screen edge, covering part or all of the content. Visually it's simple — `transform: translateX()` with a transition. But the real challenge is focus management and scroll locking.

## Core Principle

Three things must happen when a drawer opens:

1. **Lock background scroll** — When the user scrolls inside the drawer, the background page shouldn't move
2. **Trap focus** — Tab key should cycle only within the drawer, not escape to the background
3. **Restore focus** — After closing, focus returns to the trigger button

Traditional implementations use `overflow:hidden` for scroll locking and manually iterate focusable elements for focus trapping. Now we have the `inert` attribute — one line removes background content entirely from the tab sequence and assistive technology.

## Implementation

```html
<div id="app">
  <header>
    <button id="open-drawer">Open Filters</button>
  </header>
  <main>
    <p>Main page content...</p>
  </main>
</div>

<aside class="drawer" id="filter-drawer" hidden>
  <div class="drawer-overlay" data-close></div>
  <div class="drawer-panel" role="dialog"
    aria-modal="true" aria-labelledby="drawer-title">
    <header class="drawer-header">
      <h2 id="drawer-title">Filter Options</h2>
      <button class="drawer-close" data-close aria-label="Close">x</button>
    </header>
    <div class="drawer-body">
      <label><input type="checkbox"> In stock only</label>
      <label><input type="checkbox"> Free shipping</label>
      <button>Apply Filters</button>
    </div>
  </div>
</aside>
```

```css
.drawer { position: fixed; inset: 0; z-index: 100; }

.drawer-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5);
  opacity: 0;
  transition: opacity 0.3s;
}

.drawer-panel {
  position: absolute;
  top: 0; right: 0; bottom: 0;
  width: min(400px, 90vw);
  background: #fff;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0,0,0,0.1);
}

.drawer[open] .drawer-overlay { opacity: 1; }
.drawer[open] .drawer-panel { transform: translateX(0); }
```

```javascript
const drawer = document.getElementById('filter-drawer');
const openBtn = document.getElementById('open-drawer');
const app = document.getElementById('app');
let lastFocused = null;

function getFocusable(container) {
  return Array.from(container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"])'
  )).filter(el => el.offsetParent !== null);
}

function openDrawer() {
  lastFocused = document.activeElement;
  drawer.hidden = false;
  drawer.offsetHeight; // Force reflow
  drawer.setAttribute('open', '');

  app.inert = true;
  document.body.style.overflow = 'hidden';

  const focusable = getFocusable(drawer);
  if (focusable.length) focusable[0].focus();
}

function closeDrawer() {
  drawer.removeAttribute('open');
  app.inert = false;
  document.body.style.overflow = '';

  setTimeout(() => {
    drawer.hidden = true;
    if (lastFocused) lastFocused.focus();
  }, 300);
}

// Focus trap
drawer.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const focusable = getFocusable(drawer);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

drawer.addEventListener('click', e => {
  if (e.target.hasAttribute('data-close')) closeDrawer();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && drawer.hasAttribute('open')) closeDrawer();
});

openBtn.addEventListener('click', openDrawer);
```

## The inert Attribute

`inert` is a native HTML "freeze" attribute. Elements with `inert` and their subtree:
- Cannot be focused (existing focus is removed)
- Cannot be clicked (mouse and touch events are ignored)
- Hidden from screen readers (aria-hidden effect)
- Excluded from page sequence finding

This means no manual `aria-hidden` or `tabindex="-1"` management for the background — one attribute handles everything. All major browsers have supported it since 2024.

## Common Pitfalls

1. **Transition vs hidden conflict** — The `hidden` attribute removes the element immediately, before CSS transition can play. Solution: remove `hidden` first, force reflow (`el.offsetHeight`), then add the `open` state class. Reverse on close: remove `open`, wait for transition to end, then set `hidden`.

2. **iOS Safari body scroll lock** — `overflow:hidden` is unreliable on iOS Safari. You need `position:fixed` + scroll position restoration, or `overscroll-behavior:contain` to prevent scroll propagation.

3. **Focus escaping the panel** — Without `inert` or focus trap, Tab key sends focus to background page links. Visually the panel is in front, but focus is behind — screen reader users are completely lost.

4. **Focus lost after Esc close** — After closing, focus lands at the body start. Correct approach: record `document.activeElement` when opening, restore it when closing.

## Underlying Logic

A drawer is essentially a "modal" component — it creates a temporary interaction layer that the user must deal with before returning to the main page. The core constraint: background content should be "frozen," not merely "covered."

The `inert` attribute perfectly implements this semantic: it's not visual occlusion, it's interaction isolation. Background content remains visible (through the semi-transparent overlay) but is not operable. This is more thorough than `pointer-events:none` — it also blocks keyboard navigation and assistive technology access.

Focus trap logic: listen for Tab key inside the drawer, and "fold back" when focus reaches the first or last focusable element. Combined with `inert`, even if the fold-back logic has a bug, the user can't escape to the background — double insurance.

---

*本文是「组件深度解析」系列第38篇。每篇拆解一个前端组件的核心原理与实现细节。*
