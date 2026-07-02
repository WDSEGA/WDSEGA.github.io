---
layout: post
title: "组件详解#24：拖拽排序，从0实现一个不依赖任何库的拖拽列表 | Component Deep Dive #24: Drag & Sort — Build a Draggable List from Zero Without Any Library"
date: 2026-07-02
categories: [component, javascript, webdev]
tags: [drag-sort, drag-and-drop, javascript, webdev, frontend]
lang: bilingual
---

你用过 Sortable.js？用过 react-beautiful-dnd？好用，但35KB+。

今天我们从0写一个拖拽排序：**0依赖，20行核心逻辑，支持列表排序**。

---

## HTML5 Drag and Drop API 的3个坑

HTML5原生拖拽API看着简单：

```javascript
draggable.addEventListener('dragstart', handleStart);
draggable.addEventListener('dragover', handleOver);
draggable.addEventListener('drop', handleDrop);
```

但实际开发中有3个坑：

1. **`dragover` 必须阻止默认行为** — 否则 `drop` 事件不会触发
```javascript
item.addEventListener('dragover', e => e.preventDefault());
```

2. **移动端不支持** — HTML5 DnD API 在 iOS/Android 完全不工作
3. **拖拽幽灵图不可自定义** — `e.dataTransfer.setDragImage()` 只能用图片，不能用HTML

---

## Pointer Events 方案（跨平台）

用 Pointer Events 替代 HTML5 DnD — 同时支持鼠标和触摸：

```javascript
let dragItem = null;
let dragIdx = -1;
let startY = 0;

list.addEventListener('pointerdown', e => {
  const item = e.target.closest('.drag-item');
  if (!item) return;
  
  dragItem = item;
  dragIdx = [...list.children].indexOf(item);
  startY = e.clientY;
  
  item.classList.add('dragging');
  item.setPointerCapture(e.pointerId);
});

list.addEventListener('pointermove', e => {
  if (!dragItem) return;
  
  const dy = e.clientY - startY;
  dragItem.style.transform = `translateY(${dy}px)`;
  
  // 判断是否需要交换位置
  const items = [...list.children];
  const currentRect = dragItem.getBoundingClientRect();
  
  for (let i = 0; i < items.length; i++) {
    if (i === dragIdx) continue;
    const rect = items[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    
    if (dragIdx < i && currentRect.top + currentRect.height / 2 > midY) {
      list.insertBefore(dragItem, items[i + 1] || null);
      dragIdx = i;
      startY = e.clientY;
      dragItem.style.transform = '';
      break;
    }
    if (dragIdx > i && currentRect.top + currentRect.height / 2 < midY) {
      list.insertBefore(dragItem, items[i]);
      dragIdx = i;
      startY = e.clientY;
      dragItem.style.transform = '';
      break;
    }
  }
});

list.addEventListener('pointerup', e => {
  if (!dragItem) return;
  dragItem.classList.remove('dragging');
  dragItem.style.transform = '';
  dragItem = null;
});
```

---

## CSS配合

```css
.drag-item {
  transition: transform 0.15s ease;
  user-select: none;
  touch-action: none; /* 阻止浏览器默认触摸行为 */
}

.drag-item.dragging {
  opacity: 0.6;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

**`touch-action: none`** — 关键！否则移动端会先触发滚动而非拖拽。

---

## 交换逻辑的核心判断

拖拽项中心点越过目标项中心点时交换：

```
dragIdx < targetIdx → 拖拽项向下移动 → 中心点超过目标中心 → insertBefore(下一个)
dragIdx > targetIdx → 拖拽项向上移动 → 中心点低于目标中心 → insertBefore(目标)
```

每次交换后重置 `startY` 和 `transform` — 否则位移会叠加。

---

## 5个易踩的坑

1. **没设 `touch-action: none`** — 移动端滚动和拖拽打架
2. **没设 `user-select: none`** — 拖拽时文字被选中，视觉混乱
3. **交换后没重置 `startY`** — transform叠加，元素飞走
4. **没设 `setPointerCapture`** — pointer可能被其他元素抢走
5. **`transition` 和拖拽transform冲突** — 拖拽时加 `.dragging` 类去掉transition，释放时恢复

---

## 何时用库 vs 自实现

| 场景 | 自实现 | 用库 |
|------|--------|------|
| 简单列表排序 | ✅ | ❌ |
| 多列跨容器拖拽 | ❌ | ✅ |
| 拖拽到网格布局 | ❌ | ✅ |
| 拖拽预览/克隆 | ❌ | ✅ |

**80%的拖拽排序需求是简单列表** — 自实现够用，不需要35KB的库。

---

## 总结

拖拽排序的核心：**Pointer Events + 中心点判断 + insertBefore交换**。

HTML5 DnD API 在移动端不工作，Pointer Events 跨平台。

`touch-action: none` + `user-select: none` + `setPointerCapture` = 基础保障。

简单列表排序不需要库。20行逻辑就够了。

---

> **Web Component Dictionary v2.0** — 83组件双语完整版 + Live Preview
> [在线预览](https://wdsega.github.io/web-components) | [购买完整版](https://payhip.com/b/S9pj2)

---

You've used Sortable.js? react-beautiful-dnd? Great, but 35KB+.

Today we build drag-sort from zero: **0 dependencies, 20 lines of core logic, list sorting.**

## 3 Pitfalls of HTML5 Drag & Drop API

1. Must `preventDefault()` on `dragover` — otherwise `drop` won't fire
2. Mobile doesn't support it — iOS/Android completely ignore HTML5 DnD
3. Drag ghost image can't be customized with HTML — only images

## Pointer Events Solution (Cross-Platform)

Pointer Events replace HTML5 DnD — works for mouse + touch.

Core: `pointerdown` captures item → `pointermove` calculates displacement + swap threshold → `pointerup` releases.

`setPointerCapture` prevents pointer hijacking by other elements.

## Swap Logic

Drag item center crosses target item center → swap via `insertBefore`.

After each swap: reset `startY` and `transform` — otherwise displacement accumulates.

## CSS

`touch-action: none` — critical! Without it, mobile scrolls instead of dragging.
`user-select: none` — prevents text selection during drag.

## 5 Common Bugs

1. Missing `touch-action: none` — scroll vs drag conflict on mobile
2. Missing `user-select: none` — text selected during drag
3. Not resetting `startY` after swap — transform stacks, element flies away
4. Missing `setPointerCapture` — pointer stolen by other elements
5. `transition` conflicting with drag transform — disable transition during drag

## When to Use a Library vs Self-Implement

Simple list sort → self-implement ✅ | Multi-column cross-container → library ✅ | Grid layout → library ✅ | Drag preview/clone → library ✅

**80% of drag-sort needs are simple lists — self-implement is sufficient, no 35KB library needed.**

## Summary

Core: **Pointer Events + center-point threshold + insertBefore swap.**

HTML5 DnD doesn't work on mobile. Pointer Events are cross-platform.

`touch-action: none` + `user-select: none` + `setPointerCapture` = basic guarantees.

Simple list sorting doesn't need a library. 20 lines of logic is enough.

> **Web Component Dictionary v2.0** — 83 components, bilingual, live preview
> [Live Demo](https://wdsega.github.io/web-components) | [Buy Full Version](https://payhip.com/b/S9pj2)
