---
layout: post
title: "组件详解#16：模态弹窗，网页上最被滥用的组件没有之一 | Component Deep Dive #16: Modal Dialog — The Web's Most Abused Component"
date: 2026-06-26 09:30:00 +0800
categories: blog
tags: [代码产品, web components, modal, dialog, ux, accessibility]
canonical_url: https://wdsega.github.io/2026/06/26/component-c04-modal/
---

## 产品介绍

本文组件来自 **Web Component Dictionary v2.0 · 网页组件活字典**，83 组件 / 8 分类 / 中英双语 / 实时预览 / 单文件无依赖。  
在线体验：[wdsega.github.io/web-components](https://wdsega.github.io/web-components) | 购买：[payhip.com/b/S9pj2](https://payhip.com/b/S9pj2) 仅 ¥9.99

---

## 钩子

你打开一个网站，3 秒后弹出一个"订阅我们的 Newsletter"的窗口。你关了它，往下滚了两屏，又弹出一个"限时优惠"的窗口。你愤怒地关闭了浏览器标签。模态弹窗是转化率最高的 UI 模式，也是用户最痛恨的模式——区别只在于你怎么用它。

## 组件是什么

模态弹窗（Modal Dialog）是一个覆盖在主内容上的浮层，要求用户在继续操作前必须先与之交互。它由三部分组成：半透明遮罩层（backdrop）、弹窗容器（dialog）、以及关闭按钮或取消区域。正确实现的模态弹窗会锁定背景滚动、捕获键盘焦点、支持 ESC 关闭。

## 代码拆解

### HTML 结构

```html
<button id="openModal">打开弹窗</button>
<div class="modal-overlay" id="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
  <div class="modal-dialog">
    <div class="modal-header">
      <h2 id="modalTitle">弹窗标题</h2>
      <button class="modal-close" aria-label="关闭">&times;</button>
    </div>
    <div class="modal-body"><p>弹窗内容</p></div>
    <div class="modal-footer">
      <button class="btn-cancel">取消</button>
      <button class="btn-confirm">确认</button>
    </div>
  </div>
</div>
```

### CSS

```css
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.3s; z-index: 1000; }
.modal-overlay.open { opacity: 1; pointer-events: auto; }
.modal-dialog { background: #fff; border-radius: 12px; max-width: 500px; width: 90%; transform: translateY(20px); transition: transform 0.3s; }
.modal-overlay.open .modal-dialog { transform: translateY(0); }
```

### JavaScript

```javascript
class Modal {
  constructor(overlay) {
    this.overlay = overlay;
    this.previouslyFocused = null;
    this.init();
  }
  open() {
    this.previouslyFocused = document.activeElement;
    this.overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.overlay.querySelector('.modal-close')?.focus();
    document.addEventListener('keydown', this.handleKeydown);
  }
  close() {
    this.overlay.classList.remove('open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this.handleKeydown);
    this.previouslyFocused?.focus();
  }
  handleKeydown = (e) => {
    if (e.key === 'Escape') this.close();
    if (e.key === 'Tab') this.trapFocus(e);
  };
  trapFocus(e) { /* 焦点在弹窗内循环 */ }
}
```

## 关键技术点深挖

### 焦点陷阱（Focus Trap）的实现

模态弹窗打开时，Tab 键必须在弹窗内循环，不能跑到背景页面。标准做法：

```javascript
trapFocus(e) {
  const focusable = this.overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
```

### 背景滚动锁定

`document.body.style.overflow = 'hidden'` 是最简方案，但在 iOS Safari 上有橡皮筋效果穿透的问题。增强方案是给 body 加 `position: fixed` 并记录滚动位置。

## 常见坑点

- 忘记 `aria-modal="true"` 导致屏幕阅读器可以跳到背景内容
- 关闭时忘记恢复 `body` 的 `overflow` 属性，导致页面永久无法滚动
- 弹窗内嵌套弹窗时，焦点管理和 ESC 关闭逻辑需要栈来处理

## 完整可复制代码

```html
<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Modal</title>
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f0f2f5}
.btn{padding:12px 28px;font-size:16px;border:none;border-radius:8px;cursor:pointer;background:#1a73e8;color:#fff}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity 0.3s;z-index:1000}
.modal-overlay.open{opacity:1;pointer-events:auto}
.modal-dialog{background:#fff;border-radius:12px;max-width:460px;width:90%;transform:translateY(20px);transition:transform 0.3s;overflow:hidden}
.modal-overlay.open .modal-dialog{transform:translateY(0)}
.modal-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px 0}
.modal-header h2{font-size:18px;color:#1a1a2e}
.modal-close{background:none;border:none;font-size:28px;cursor:pointer;color:#999;line-height:1;padding:0 0 4px 8px}
.modal-body{padding:20px 24px;color:#555;line-height:1.7}
.modal-footer{padding:0 24px 20px;display:flex;gap:12px;justify-content:flex-end}
.btn-cancel,.btn-confirm{padding:10px 24px;border-radius:8px;border:none;cursor:pointer;font-size:14px}
.btn-cancel{background:#f0f0f0;color:#666}.btn-confirm{background:#1a73e8;color:#fff}
</style></head><body>
<button class="btn" id="openBtn">打开弹窗</button>
<div class="modal-overlay" id="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
  <div class="modal-dialog">
    <div class="modal-header"><h2 id="modalTitle">确认操作</h2><button class="modal-close" aria-label="关闭">&times;</button></div>
    <div class="modal-body"><p>你确定要执行此操作吗？此操作不可撤销。</p></div>
    <div class="modal-footer"><button class="btn-cancel">取消</button><button class="btn-confirm">确认</button></div>
  </div>
</div>
<script>
class Modal {
  constructor(o){this.o=o;this.prev=null;this.hk=null;o.querySelector('.modal-close, .btn-cancel')?.addEventListener('click',()=>this.close())}
  open(){this.prev=document.activeElement;this.o.classList.add('open');document.body.style.overflow='hidden';const fc=this.o.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');this.focusable=[...fc];this.focusable[1]?.focus();this.hk=e=>{if(e.key==='Escape')this.close();if(e.key==='Tab'){const f=this.focusable,l=f.length;if(!l)return;if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f[l-1].focus()}else if(!e.shiftKey&&document.activeElement===f[l-1]){e.preventDefault();f[0].focus()}}};document.addEventListener('keydown',this.hk);this.o.addEventListener('click',e=>{if(e.target===this.o)this.close()})}
  close(){this.o.classList.remove('open');document.body.style.overflow='';if(this.hk)document.removeEventListener('keydown',this.hk);this.prev?.focus()}
}
const m=new Modal(document.getElementById('modal'));
document.getElementById('openBtn').addEventListener('click',()=>m.open());
</script></body></html>
```

## 变体拓展

1. **抽屉式侧边栏（Sheet）**：从屏幕边缘滑入，适合移动端操作面板
2. **确认对话框（Confirm Dialog）**：精简为标题+描述+两个按钮，用于危险操作确认
3. **图片预览弹窗（Lightbox）**：全屏展示图片，支持缩放和左右切换

---

👉 83 个组件一键到手：[payhip.com/b/S9pj2](https://payhip.com/b/S9pj2) | 实时预览：[wdsega.github.io/web-components](https://wdsega.github.io/web-components)

---

## Modal Dialog — The Web's Most Abused Component

### The Hook

Three seconds after landing on a page, a newsletter popup appears. You close it. Two scrolls later, a "limited offer" popup. You close the tab. The modal is the highest-converting and most-hated UI pattern — the difference is entirely in how you use it.

### Core Implementation

A proper modal: locks background scroll, traps keyboard focus, closes on ESC, and restores focus to the triggering element on close. The focus trap is critical — without it, keyboard users tab right into the background page.

```javascript
if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
```

### Common Mistakes

- Forgetting `aria-modal="true"` lets screen readers escape to background content
- Not restoring `body overflow` on close permanently breaks scrolling
- Nested modals require a stack-based focus management approach

👉 Live demo: [wdsega.github.io/web-components](https://wdsega.github.io/web-components) | ¥9.99: [payhip.com/b/S9pj2](https://payhip.com/b/S9pj2)
