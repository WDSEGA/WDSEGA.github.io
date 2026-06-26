---
layout: post
title: "组件详解#17：Toast通知，4秒定生死的微交互 | Component Deep Dive #17: Toast Notification — 4 Seconds That Make or Break UX"
date: 2026-06-26 10:00:00 +0800
categories: blog
tags: [代码产品, web components, toast, notification, ux, javascript]
canonical_url: https://wdsega.github.io/2026/06/26/component-c05-toast/
---

## 产品介绍

本文组件来自 **Web Component Dictionary v2.0 · 网页组件活字典**，83 组件 / 8 分类 / 中英双语 / 实时预览 / 单文件无依赖。  
在线体验：[wdsega.github.io/web-components](https://wdsega.github.io/web-components) | 购买：[payhip.com/b/S9pj2](https://payhip.com/b/S9pj2) 仅 ¥9.99

---

## 钩子

用户点了一个按钮，什么都没发生。他以为自己没点到，又点了三次——然后页面崩了。原因？你忘记给操作加反馈了。Toast 通知是 Web 上最轻量的反馈机制：它出现、传递信息、然后消失，全程不需要用户做任何事。但做得好和做得烂之间，差的是动画节奏、堆叠逻辑和可访问性。

## 组件是什么

Toast 通知是一个短暂出现的非模态提示，通常出现在屏幕顶部或底部。它自动消失（默认 3-5 秒），不打断用户操作。典型应用场景：操作成功/失败反馈、网络状态变化、新消息提醒。

## 代码拆解

### HTML（动态生成）

```html
<div class="toast-container" aria-live="polite">
  <div class="toast toast-success">
    <span class="toast-icon">✓</span>
    <span class="toast-message">保存成功</span>
    <button class="toast-close" aria-label="关闭">&times;</button>
  </div>
</div>
```

### CSS 核心

```css
.toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
.toast { display: flex; align-items: center; gap: 10px; padding: 14px 20px; background: #fff; border-radius: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); min-width: 280px; max-width: 400px; animation: toastIn 0.4s ease; }
.toast.removing { animation: toastOut 0.3s ease forwards; }
@keyframes toastIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
@keyframes toastOut { to { opacity: 0; transform: translateX(100%); } }
```

### JavaScript

```javascript
class ToastManager {
  constructor() { this.container = this.createContainer(); }
  createContainer() {
    const el = document.createElement('div');
    el.className = 'toast-container';
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
    return el;
  }
  show(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span><button class="toast-close">&times;</button>`;
    this.container.appendChild(toast);
    toast.querySelector('.toast-close').onclick = () => this.dismiss(toast);
    setTimeout(() => this.dismiss(toast), duration);
  }
  dismiss(toast) {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }
}
```

## 关键技术点

### aria-live 区域

`aria-live="polite"` 让屏幕阅读器在用户空闲时读出 Toast 内容。如果用 `aria-live="assertive"`，会立即打断当前朗读——只在严重错误时使用。

### 动画函数的 CSS animation 而非 transition

因为 Toast 是动态插入的 DOM 元素，用 `animation` 可以在插入瞬间自动触发入场动画，而 `transition` 需要先设置初始状态再切换到最终状态，需要 `requestAnimationFrame` 技巧才能工作。

## 完整可复制代码

```html
<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Toast</title>
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;gap:12px;background:#f5f5f5;flex-direction:column}
.btn{padding:12px 28px;border:none;border-radius:8px;cursor:pointer;font-size:15px;color:#fff}
.btn-success{background:#10b981}.btn-error{background:#ef4444}.btn-info{background:#3b82f6}
.toast-container{position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px}
.toast{display:flex;align-items:center;gap:10px;padding:14px 20px;background:#fff;border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,0.12);min-width:280px;max-width:400px;animation:toastIn .4s ease;border-left:4px solid #3b82f6}
.toast.toast-success{border-left-color:#10b981}.toast.toast-error{border-left-color:#ef4444}
.toast.removing{animation:toastOut .3s ease forwards}
.toast-icon{font-size:18px;flex-shrink:0}.toast-message{flex:1;font-size:14px;color:#333}
.toast-close{background:none;border:none;font-size:18px;cursor:pointer;color:#999;padding:0;flex-shrink:0}
@keyframes toastIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}
@keyframes toastOut{to{opacity:0;transform:translateX(100%)}}
</style></head><body>
<button class="btn btn-success" onclick="toast.show('保存成功！','success')">成功通知</button>
<button class="btn btn-error" onclick="toast.show('网络错误，请重试','error')">错误通知</button>
<button class="btn btn-info" onclick="toast.show('新版本已发布','info')">信息通知</button>
<script>
class ToastManager{
  constructor(){this.c=document.createElement('div');this.c.className='toast-container';this.c.setAttribute('aria-live','polite');document.body.appendChild(this.c)}
  show(msg,type='info',dur=4000){const icons={success:'✓',error:'✗',info:'ℹ'};const t=document.createElement('div');t.className=`toast toast-${type}`;t.innerHTML=`<span class="toast-icon">${icons[type]}</span><span class="toast-message">${msg}</span><button class="toast-close" aria-label="关闭">&times;</button>`;this.c.appendChild(t);const close=()=>{t.classList.add('removing');setTimeout(()=>t.remove(),300)};t.querySelector('.toast-close').onclick=close;setTimeout(close,dur)}
}
const toast=new ToastManager();
</script></body></html>
```

---

👉 83 个组件一键到手：[payhip.com/b/S9pj2](https://payhip.com/b/S9pj2) | 实时预览：[wdsega.github.io/web-components](https://wdsega.github.io/web-components)

---

## Toast Notification — 4 Seconds That Make or Break UX

A user clicks a button, sees nothing happen, clicks three more times — and crashes the page. The missing ingredient? Feedback. Toast notifications are the web's lightest feedback mechanism: appear, inform, disappear.

### Key Implementation

Use CSS `animation` (not `transition`) for entry/exit — dynamically inserted DOM elements need animation to trigger automatically. Set `aria-live="polite"` so screen readers announce the toast without interrupting.

### Variants

- **Stacking toasts**: newest on top with auto-dismiss for old ones
- **Swipe-to-dismiss** on mobile
- **Action toasts**: include "Undo" button within the 4-second window

👉 Full bundle: [payhip.com/b/S9pj2](https://payhip.com/b/S9pj2)
