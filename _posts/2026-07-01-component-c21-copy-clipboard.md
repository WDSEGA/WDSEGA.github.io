---
layout: post
title: "组件详解#21：复制到剪贴板，3行现代JS，没有借口 | Component Deep Dive #21: Copy to Clipboard — 3 Lines of Modern JS, Zero Excuses"
date: 2026-07-01 08:20:00 +0800
categories: [component, frontend]
tags: [css, javascript, ui, component]
author: 编译员
---

文档网站的代码块右上角那个复制按钮，能把用户出错率降低99%。

2024年之前，这个功能需要临时创建textarea + `document.execCommand('copy')` 这套黑魔法。现在有了 Clipboard API，3行搞定。

## 现代实现（2行JS）

```javascript
async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}
```

就这两行。`navigator.clipboard.writeText()` 返回 Promise，`await` 等待完成。

## 完整实现（加视觉反馈）

```javascript
async function handleCopy(btn, text) {
  try {
    await navigator.clipboard.writeText(text);
    
    // 视觉反馈
    btn.classList.add('copied');
    btn.querySelector('.copy-text').textContent = 'Copied!';
    
    // 2秒后重置
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.querySelector('.copy-text').textContent = 'Copy';
    }, 2000);
    
  } catch (err) {
    // 降级方案
    fallbackCopy(text);
  }
}
```

## CSS状态切换

```css
.copy-btn {
  transition: background-color 0.2s, transform 0.1s;
}
.copy-btn.copied {
  background-color: #22c55e; /* 变绿色 */
  transform: scale(0.95);   /* 轻微按压感 */
}
```

颜色从灰/蓝变绿，配合文字从"Copy"变"Copied!"，双重反馈。

## 为什么必须要视觉反馈

复制操作是**不可见**的——用户看不到文字去了哪里。没有反馈的复制按钮，用户会：

1. 以为没点中，再点一次
2. 以为功能坏了，去手动选中文字
3. 实际复制成功了但不确定，使用时出错

2秒绿色 + "Copied!" 文字，彻底消除这种不确定性。

## 兼容性和降级

Clipboard API 需要 HTTPS（或 localhost），以及用户授权。旧浏览器降级方案：

```javascript
function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
```

把这段放在 `catch` 里，优雅降级。

## 三个实际使用场景

**场景1：代码块**

```html
<div class="code-block">
  <button class="copy-btn" data-target="code-1">
    <span class="copy-text">Copy</span>
  </button>
  <pre id="code-1"><code>npm install your-package</code></pre>
</div>
```

**场景2：邀请码/优惠码**

```html
<input value="SAVE20" readonly class="coupon-input">
<button class="copy-btn" data-value="SAVE20">复制</button>
```

**场景3：分享链接**

```javascript
copyBtn.addEventListener('click', () => {
  handleCopy(copyBtn, window.location.href);
});
```

当前页面URL一键复制，替代复杂的分享弹窗。

## 最常见的错误

**错误：没有处理 Promise rejection**

```javascript
// 错误写法
navigator.clipboard.writeText(text); // 没有 await，没有 catch

// 正确写法  
try {
  await navigator.clipboard.writeText(text);
} catch (err) {
  fallbackCopy(text);
}
```

HTTP页面、旧浏览器、用户拒绝权限——任何一种情况都会让 `writeText()` 失败。不处理 rejection，会静默失败，用户一脸懵。

---

*English below*

---

The copy button on docs pages reduces user errors by 99%. Here's the complete, correct implementation.

## The Core API

```javascript
async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}
```

That's it. `navigator.clipboard.writeText()` returns a Promise.

## Visual Feedback

Change the button to green + "Copied!" text for 2 seconds. Without feedback, clipboard operations are invisible to the user — they'll click again thinking it didn't work.

## Fallback for HTTP / Old Browsers

Wrap in `try/catch` and use the `document.execCommand('copy')` method as fallback — create a hidden textarea, select its content, execute the command, then remove the textarea.

## Key Mistake to Avoid

Never call `writeText()` without `await` and `catch`. It will silently fail on HTTP pages, old browsers, or when users deny clipboard permission.

Full code and live demo at [wdsega.github.io](https://wdsega.github.io).
