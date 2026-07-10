---
layout: post
title: "组件详解#47：模态对话框Modal Dialog，focus trap和滚动锁缺一不可 | Component Deep Dive #47: Modal Dialog — Focus Trap and Scroll Lock Are Non-Negotiable"
date: 2026-07-10
categories: [组件详解]
tags: [Modal, Dialog, JavaScript, Web组件]
author: 编译员
description: "模态对话框Modal组件详解：原生dialog元素、focus trap、body滚动锁、ESC关闭、点击遮罩关闭，含完整可复制代码。"
---

## 组件详解#47：模态对话框Modal Dialog，focus trap和滚动锁缺一不可

弹窗谁都会写，但一个"对的"弹窗需要处理焦点陷阱、滚动锁定、键盘关闭、遮罩点击关闭。少一样都不专业。今天我们用原生`<dialog>`元素实现一个完整的Modal。

### 组件是什么

Modal Dialog（模态对话框）是一个覆盖在页面上的弹出层，用户必须先与对话框交互才能返回主页面。与Toast/Notification不同，Modal是"模态"的——它会阻断对底层页面的操作。

### 完整代码

**HTML**：

```html
<dialog id="myModal" class="modal">
  <div class="modal-box">
    <div class="modal-header">
      <h2>确认删除</h2>
      <button class="modal-close" aria-label="关闭">&times;</button>
    </div>
    <div class="modal-body">
      <p>此操作不可撤销，确定要删除吗？</p>
    </div>
    <div class="modal-footer">
      <button class="btn-cancel">取消</button>
      <button class="btn-confirm">确认删除</button>
    </div>
  </div>
</dialog>

<button onclick="document.getElementById('myModal').showModal()">打开弹窗</button>
```

**CSS**：

```css
/* 遮罩层（原生dialog::backdrop） */
.modal::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

/* 对话框本体 */
.modal {
  border: none;
  border-radius: 12px;
  padding: 0;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalIn 0.25s ease;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-box { padding: 0; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 { margin: 0; font-size: 18px; }

.modal-close {
  background: none; border: none; font-size: 24px;
  cursor: pointer; color: #94a3b8; padding: 0; line-height: 1;
}
.modal-close:hover { color: #1e293b; }

.modal-body { padding: 20px 24px; color: #475569; line-height: 1.6; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid #e2e8f0;
}

.btn-cancel, .btn-confirm {
  padding: 8px 20px; border-radius: 8px; font-size: 14px;
  cursor: pointer; border: none; transition: all 0.2s;
}
.btn-cancel { background: #f1f5f9; color: #475569; }
.btn-cancel:hover { background: #e2e8f0; }
.btn-confirm { background: #ef4444; color: #fff; }
.btn-confirm:hover { background: #dc2626; }
```

**JavaScript**（焦点陷阱 + ESC关闭 + 遮罩关闭）：

```javascript
const modal = document.getElementById('myModal');
const closeBtn = modal.querySelector('.modal-close');
const cancelBtn = modal.querySelector('.btn-cancel');

// 关闭函数
function closeModal() { modal.close(); }
closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

// 点击遮罩区域关闭（不点击对话框本身）
modal.addEventListener('click', function(e) {
  if (e.target === modal) closeModal();
});

// 焦点陷阱：Tab键不跑出对话框
modal.addEventListener('keydown', function(e) {
  if (e.key !== 'Tab') return;
  const focusable = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
});
```

### 关键技术点

1. **原生`<dialog>`元素**：`showModal()`方法打开模态对话框，浏览器自动处理遮罩层（`::backdrop`）、焦点管理、ESC键关闭。比手动实现`div`遮罩方案可靠得多。
2. **焦点陷阱（Focus Trap）**：Tab键不能跑出对话框。用`keydown`监听Tab，在第一个和最后一个可聚焦元素之间循环。
3. **body滚动锁**：原生`<dialog>`在`showModal()`时会自动锁定底层页面的滚动，无需额外代码。如果用`div`方案，需要`document.body.style.overflow = 'hidden'`。

### 常见坑点

- **`show()` vs `showModal()`**：`show()`打开的是非模态对话框（不锁底层），`showModal()`才是模态。别用错。
- **动画闪烁**：原生`<dialog>`打开时默认无动画。用CSS `animation`配合`[open]`属性选择器，或在JS中用`requestAnimationFrame`触发。
- **ESC关闭行为覆盖**：原生`<dialog>`按ESC会自动关闭。如果需要阻止（如表单未保存），监听`cancel`事件并`e.preventDefault()`。

### 变体拓展

```javascript
// 阻止ESC关闭（表单未保存时）
modal.addEventListener('cancel', function(e) {
  if (hasUnsavedChanges) {
    e.preventDefault();
    showWarning('请先保存或放弃更改');
  }
});
```

> 想要83个完整组件源码？访问 [Web Component Dictionary](https://wdsega.github.io/web-components/) 获取完整版。

---

## Component Deep Dive #47: Modal Dialog — Focus Trap and Scroll Lock Are Non-Negotiable

Anyone can write a popup, but a "correct" modal needs focus trapping, scroll locking, keyboard close, and backdrop click close. Miss any one and it's unprofessional. Today we'll use the native `<dialog>` element.

### Key Technical Points

1. **Native `<dialog>`**: `showModal()` opens a modal dialog — the browser handles backdrop (`::backdrop`), focus management, and ESC-to-close automatically. Far more reliable than manual `div` overlay.
2. **Focus Trap**: Tab key must not escape the dialog. Listen for Tab and cycle between first and last focusable elements.
3. **Body scroll lock**: Native `<dialog>` with `showModal()` automatically locks underlying page scroll — no extra code needed. With `div` approach, you need `document.body.style.overflow = 'hidden'`.

### Common Pitfalls

- **`show()` vs `showModal()`**: `show()` opens a non-modal dialog (no background lock); `showModal()` is modal. Don't mix them up.
- **Animation flicker**: Native `<dialog>` has no open animation by default. Use CSS `animation` with `[open]` selector, or trigger with `requestAnimationFrame` in JS.
- **ESC close override**: Native `<dialog>` auto-closes on ESC. To prevent (e.g., unsaved form), listen to `cancel` event and `e.preventDefault()`.

> Want all 83 complete component source codes? Visit [Web Component Dictionary](https://wdsega.github.io/web-components/) for the full version.
