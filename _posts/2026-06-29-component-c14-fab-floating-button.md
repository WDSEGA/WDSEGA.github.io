---
layout: post
title: "c14-FAB浮动操作按钮 | 移动端最重要的那个按钮"
date: 2026-06-29 08:10:00 +0800
categories: [组件, Web Component Dictionary]
tags: [fab, floating-button, css, mobile-ux]
---

> **Web Component Dictionary v2.0 · 网页组件活字典**
> 83个组件 / 8大分类 / 中英双语 / 实时预览 / 单文件无依赖
> [在线体验](https://wdsega.github.io/web-components) | [购买 ¥9.99](https://payhip.com/b/S9pj2)


FAB（Floating Action Button）是屏幕右下角那个圆形大按钮。WhatsApp发消息、Google Maps导航、Gmail写邮件——它永远在那里，触手可及。

## 组件是什么

FAB是固定在视窗角落的圆形操作按钮，代表页面最主要的一个动作。Material Design把它定义为"一级操作"：每个页面只有一个FAB，它就是这个页面的主角。

## 效果预览

```
屏幕右下角浮动：
┌─────────────────────┐
│                     │
│     页面内容        │
│                     │
│                  ╭──╮│
│                  │ + ││  ← FAB
│                  ╰──╯│
└─────────────────────┘
点击展开：
  ✏️ 编辑
  📤 分享
  🗑️ 删除
  ╭──╮
  │ × │  ← FAB变关闭
  ╰──╯
```

## HTML结构
```html
<div class="ef-fab-container">
  <!-- 子菜单（可选） -->
  <div class="ef-fab-menu">
    <button class="ef-fab-item" data-label="编辑">✏️</button>
    <button class="ef-fab-item" data-label="分享">📤</button>
    <button class="ef-fab-item" data-label="删除">🗑️</button>
  </div>
  <!-- 主FAB -->
  <button class="ef-fab" aria-label="主要操作" aria-expanded="false">
    <span class="ef-fab-icon">+</span>
  </button>
</div>
```

## CSS核心
```css
.ef-fab-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 12px;
}

.ef-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #6366f1;
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(99,102,241,.4);
  transition: transform .2s, background .2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ef-fab:hover { background: #4f46e5; transform: scale(1.08); }
.ef-fab.open { background: #ef4444; }
.ef-fab.open .ef-fab-icon { transform: rotate(45deg); }
.ef-fab-icon { transition: transform .3s; display: block; line-height: 1; }

/* 子菜单项 */
.ef-fab-item {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e5e7eb;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,.12);
  position: relative;
  opacity: 0;
  transform: scale(0.6) translateY(10px);
  transition: opacity .2s, transform .2s;
  pointer-events: none;
}

/* 子菜单 tooltip */
.ef-fab-item::after {
  content: attr(data-label);
  position: absolute;
  right: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  background: #1f2937;
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity .15s;
}

.ef-fab-container.open .ef-fab-item {
  opacity: 1;
  transform: scale(1) translateY(0);
  pointer-events: auto;
}

.ef-fab-container.open .ef-fab-item:hover::after { opacity: 1; }

/* 展开动画依次延迟 */
.ef-fab-item:nth-child(1) { transition-delay: 0.05s; }
.ef-fab-item:nth-child(2) { transition-delay: 0.10s; }
.ef-fab-item:nth-child(3) { transition-delay: 0.15s; }
```

## JS交互
```javascript
const fabContainer = document.querySelector('.ef-fab-container');
const fab = document.querySelector('.ef-fab');

fab.addEventListener('click', () => {
  const isOpen = fabContainer.classList.toggle('open');
  fab.classList.toggle('open', isOpen);
  fab.setAttribute('aria-expanded', isOpen);
});

// 点击外部关闭
document.addEventListener('click', e => {
  if (!fabContainer.contains(e.target)) {
    fabContainer.classList.remove('open');
    fab.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
  }
});
```

## 关键技术点

1. **`position: fixed` + `z-index`**：始终悬浮在内容上层
2. **`column-reverse` 布局**：子菜单从下往上展开，FAB始终在最底部
3. **`pointer-events: none` → `auto`**：隐藏时禁止点击，避免误触
4. **`transition-delay` 阶梯**：子项依次出现，视觉更有节奏感

## 常见坑点

- ❌ 底部导航遮挡：bottom要考虑底部导航栏高度（移动端通常56-80px）
- ❌ 弹窗/Modal里的FAB：fixed定位会被overflow:hidden的容器裁剪
- ✅ 监听滚动隐藏：向下滚动时隐藏FAB（`translateY(100px)`），向上时出现

## 变体拓展

- **简单FAB**：不需要子菜单，直接单个按钮触发弹窗
- **小FAB（mini）**：40px，用于次要操作
- **延展FAB**：滚动到顶时变为 `[+ 写文章]` 按钮，展示文字标签

---

*Web Component Dictionary v2.0 — 下一篇：c15 复制到剪贴板*
*[在线体验完整字典 →](https://wdsega.github.io/web-components)*

---

## FAB Floating Action Button: The Most Important Button on Mobile

> **Web Component Dictionary v2.0** · 83 Components / 8 Categories / Bilingual / Live Preview / Zero Dependencies
> [Live Demo](https://wdsega.github.io/web-components) | [Buy ¥9.99](https://payhip.com/b/S9pj2)

The FAB (Floating Action Button) is that circular button in the bottom-right corner. WhatsApp's compose, Google Maps' navigate, Gmail's compose — it's always there, thumb-distance away.

### Core Layout Trick

`flex-direction: column-reverse` keeps the FAB at the bottom while sub-items stack upward. `transition-delay` staggers the reveal animation.

### Key Pitfall

`position: fixed` gets clipped by any ancestor with `overflow: hidden` — watch out inside modals.

[Full code + live demo →](https://wdsega.github.io/web-components)
