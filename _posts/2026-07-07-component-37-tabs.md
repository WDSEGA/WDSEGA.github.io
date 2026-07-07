---
layout: post
title: "标签页 | Component Deep Dive #37: Tabs — Scroll-Snap, ARIA, and Keyboard Arrows"
date: 2026-07-07 12:00:00 +0800
categories: [组件深度解析, Component Deep Dive]
tags: [tabs, aria, keyboard-navigation, webdev]
description: "标签页的核心是ARIA tablist角色和键盘箭头导航——不是简单的display:none切换，而是完整的焦点管理模式。"
author: 编译员
---

# 标签页 | Component Deep Dive #37: Tabs — Scroll-Snap, ARIA, and Keyboard Arrows

> 用户点击一个标签，内容区切换。看似简单，但90%的实现都忘了键盘用户和屏幕阅读器。

标签页（Tabs）是信息密度管理的基础组件。当页面内容太多无法一次展示时，标签页将内容分组，用户按需切换。但"能切换"只是起点——真正的标签页需要满足WAI-ARIA Tab Pattern的完整交互规范。

## 核心原理

标签页由两部分组成：标签列表（tablist）和内容面板（tabpanel）。每个标签（tab）通过`aria-controls`指向对应的面板，面板通过`aria-labelledby`指回标签。选中状态用`aria-selected="true"`标记，未选中面板用`hidden`属性隐藏。

关键在于焦点管理：标签列表是roving tabindex模式——只有当前选中的标签`tabindex="0"`，其余`tabindex="-1"`。用户用左右箭头键在标签间移动焦点，移动时自动切换面板。

## 实现

```html
<div class="tabs">
  <div class="tablist" role="tablist" aria-label="项目设置">
    <button class="tab" role="tab" id="tab-general"
      aria-controls="panel-general" aria-selected="true" tabindex="0">
      通用
    </button>
    <button class="tab" role="tab" id="tab-advanced"
      aria-controls="panel-advanced" aria-selected="false" tabindex="-1">
      高级
    </button>
    <button class="tab" role="tab" id="tab-permissions"
      aria-controls="panel-permissions" aria-selected="false" tabindex="-1">
      权限
    </button>
  </div>
  <div class="tabpanel" role="tabpanel" id="panel-general"
    aria-labelledby="tab-general">
    <p>通用设置内容</p>
  </div>
  <div class="tabpanel" role="tabpanel" id="panel-advanced"
    aria-labelledby="tab-advanced" hidden>
    <p>高级设置内容</p>
  </div>
  <div class="tabpanel" role="tabpanel" id="panel-permissions"
    aria-labelledby="tab-permissions" hidden>
    <p>权限设置内容</p>
  </div>
</div>
```

```javascript
const tablist = document.querySelector('[role="tablist"]');
const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

function activateTab(tab) {
  // Deactivate all
  tabs.forEach(t => {
    t.setAttribute('aria-selected', 'false');
    t.setAttribute('tabindex', '-1');
  });
  panels.forEach(p => p.setAttribute('hidden', ''));

  // Activate selected
  tab.setAttribute('aria-selected', 'true');
  tab.setAttribute('tabindex', '0');
  tab.focus();
  document.getElementById(tab.getAttribute('aria-controls'))
    .removeAttribute('hidden');
}

function getOrientation() {
  // Horizontal by default; vertical if tablist has aria-orientation="vertical"
  return tablist.getAttribute('aria-orientation') === 'vertical'
    ? 'vertical' : 'horizontal';
}

tablist.addEventListener('click', e => {
  const tab = e.target.closest('[role="tab"]');
  if (tab) activateTab(tab);
});

tablist.addEventListener('keydown', e => {
  const idx = tabs.indexOf(document.activeElement);
  if (idx === -1) return;

  const horiz = getOrientation() === 'horizontal';
  let newIdx = idx;

  if ((horiz && e.key === 'ArrowRight') ||
      (!horiz && e.key === 'ArrowDown')) {
    e.preventDefault();
    newIdx = (idx + 1) % tabs.length;
  } else if ((horiz && e.key === 'ArrowLeft') ||
             (!horiz && e.key === 'ArrowUp')) {
    e.preventDefault();
    newIdx = (idx - 1 + tabs.length) % tabs.length;
  } else if (e.key === 'Home') {
    e.preventDefault();
    newIdx = 0;
  } else if (e.key === 'End') {
    e.preventDefault();
    newIdx = tabs.length - 1;
  } else if (e.key === 'Tab' && !e.shiftKey) {
    // Let focus move to panel content naturally
    return;
  }

  if (newIdx !== idx) {
    activateTab(tabs[newIdx]);
  }
});
```

## 横向滚动标签

标签太多时，不要折行——用横向滚动加scroll-snap：

```css
.tablist {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.tablist::-webkit-scrollbar { display: none; }

.tab {
  scroll-snap-align: start;
  flex-shrink: 0;
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  font: inherit;
  color: #666;
  transition: color 0.2s, border-color 0.2s;
}

.tab[aria-selected="true"] {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.tab:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}
```

## 常见陷阱

1. **用display:none切换面板** — `display:none`会导致面板内的iframe/视频重新加载。用`hidden`属性更好，它等同于`display:none`但语义更明确。如果需要保留状态，可以用`visibility:hidden`加`position:absolute`移出视口。

2. **忘记箭头键导航** — 很多实现只支持点击切换，键盘用户必须按Tab逐个跳过每个标签再到达内容区。正确做法是roving tabindex + 箭头键。

3. **Tab键行为错误** — 用户按Tab键应该从当前标签直接跳到对应面板的内容，而不是跳到下一个标签。roving tabindex保证只有当前标签在tab序列中。

4. **无障碍状态缺失** — 屏幕阅读器用户需要`aria-selected`知道哪个标签被选中，需要`aria-controls`知道标签控制哪个面板。没有这些属性，标签页对辅助技术完全不可用。

## 底层逻辑

标签页本质是一个状态机：`activeIndex`决定哪个标签被选中、哪个面板可见。所有交互——点击、箭头键、Home/End——都是在更新`activeIndex`，然后由一个统一的`activateTab`函数同步更新DOM。

Roving tabindex的核心思想：在容器内用方向键管理焦点，Tab键只在容器之间跳转。这样键盘用户在标签列表内的导航效率等同于鼠标用户——一次按键切换一个标签，而不是反复按Tab。

---

# Tabs | Component Deep Dive #37: Tabs — Scroll-Snap, ARIA, and Keyboard Arrows

> User clicks a tab, content switches. Looks simple, but 90% of implementations forget keyboard users and screen readers.

Tabs are the foundation of information density management. When a page has too much content to display at once, tabs group it into sections users switch between. But "switchable" is only the starting point — a real tab component must satisfy the complete interaction spec of the WAI-ARIA Tab Pattern.

## Core Principle

Tabs consist of two parts: the tab list (tablist) and content panels (tabpanel). Each tab points to its panel via `aria-controls`, and each panel points back to its tab via `aria-labelledby`. The selected state is marked with `aria-selected="true"`, and unselected panels are hidden with the `hidden` attribute.

The key is focus management: the tab list uses roving tabindex — only the currently selected tab has `tabindex="0"`, all others have `tabindex="-1"`. Users move focus between tabs with left/right arrow keys, and the panel switches automatically as focus moves.

## Implementation

```html
<div class="tabs">
  <div class="tablist" role="tablist" aria-label="Project Settings">
    <button class="tab" role="tab" id="tab-general"
      aria-controls="panel-general" aria-selected="true" tabindex="0">
      General
    </button>
    <button class="tab" role="tab" id="tab-advanced"
      aria-controls="panel-advanced" aria-selected="false" tabindex="-1">
      Advanced
    </button>
    <button class="tab" role="tab" id="tab-permissions"
      aria-controls="panel-permissions" aria-selected="false" tabindex="-1">
      Permissions
    </button>
  </div>
  <div class="tabpanel" role="tabpanel" id="panel-general"
    aria-labelledby="tab-general">
    <p>General settings content</p>
  </div>
  <div class="tabpanel" role="tabpanel" id="panel-advanced"
    aria-labelledby="tab-advanced" hidden>
    <p>Advanced settings content</p>
  </div>
  <div class="tabpanel" role="tabpanel" id="panel-permissions"
    aria-labelledby="tab-permissions" hidden>
    <p>Permissions settings content</p>
  </div>
</div>
```

```javascript
const tablist = document.querySelector('[role="tablist"]');
const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

function activateTab(tab) {
  // Deactivate all
  tabs.forEach(t => {
    t.setAttribute('aria-selected', 'false');
    t.setAttribute('tabindex', '-1');
  });
  panels.forEach(p => p.setAttribute('hidden', ''));

  // Activate selected
  tab.setAttribute('aria-selected', 'true');
  tab.setAttribute('tabindex', '0');
  tab.focus();
  document.getElementById(tab.getAttribute('aria-controls'))
    .removeAttribute('hidden');
}

tablist.addEventListener('click', e => {
  const tab = e.target.closest('[role="tab"]');
  if (tab) activateTab(tab);
});

tablist.addEventListener('keydown', e => {
  const idx = tabs.indexOf(document.activeElement);
  if (idx === -1) return;

  const horiz = tablist.getAttribute('aria-orientation') !== 'vertical';
  let newIdx = idx;

  if ((horiz && e.key === 'ArrowRight') ||
      (!horiz && e.key === 'ArrowDown')) {
    e.preventDefault();
    newIdx = (idx + 1) % tabs.length;
  } else if ((horiz && e.key === 'ArrowLeft') ||
             (!horiz && e.key === 'ArrowUp')) {
    e.preventDefault();
    newIdx = (idx - 1 + tabs.length) % tabs.length;
  } else if (e.key === 'Home') {
    e.preventDefault();
    newIdx = 0;
  } else if (e.key === 'End') {
    e.preventDefault();
    newIdx = tabs.length - 1;
  }

  if (newIdx !== idx) activateTab(tabs[newIdx]);
});
```

## Horizontal Scroll Tabs

When there are too many tabs, don't wrap — use horizontal scrolling with scroll-snap:

```css
.tablist {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.tablist::-webkit-scrollbar { display: none; }

.tab {
  scroll-snap-align: start;
  flex-shrink: 0;
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  font: inherit;
  color: #666;
  transition: color 0.2s, border-color 0.2s;
}

.tab[aria-selected="true"] {
  color: #2563eb;
  border-bottom-color: #2563eb;
}
```

## Common Pitfalls

1. **Using display:none to switch panels** — `display:none` causes iframes/videos inside panels to reload. The `hidden` attribute is better — it's semantically equivalent but clearer. To preserve state, use `visibility:hidden` with `position:absolute`.

2. **Forgetting arrow key navigation** — Many implementations only support click switching. Keyboard users must press Tab through every tab before reaching content. Correct approach: roving tabindex + arrow keys.

3. **Wrong Tab key behavior** — Pressing Tab should move focus from the current tab directly to its panel content, not to the next tab. Roving tabindex ensures only the active tab is in the tab sequence.

4. **Missing ARIA states** — Screen reader users need `aria-selected` to know which tab is active, and `aria-controls` to know which panel a tab governs. Without these attributes, tabs are completely invisible to assistive technology.

## Underlying Logic

Tabs are essentially a state machine: `activeIndex` determines which tab is selected and which panel is visible. All interactions — clicks, arrow keys, Home/End — simply update `activeIndex`, then a single `activateTab` function synchronizes the DOM.

The core idea of roving tabindex: manage focus within a container using directional keys, and let Tab key only jump between containers. This gives keyboard users the same navigation efficiency as mouse users — one keypress per tab switch.

---

*本文是「组件深度解析」系列第37篇。每篇拆解一个前端组件的核心原理与实现细节。*
