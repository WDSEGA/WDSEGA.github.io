---
layout: post
title: "c15-一键复制到剪贴板 | Clipboard API 三行代码的正确打开方式"
date: 2026-06-29 08:20:00 +0800
categories: [组件, Web Component Dictionary]
tags: [clipboard, copy-button, javascript, ux]
---

> **Web Component Dictionary v2.0 · 网页组件活字典**
> 83个组件 / 8大分类 / 中英双语 / 实时预览 / 单文件无依赖
> [在线体验](https://wdsega.github.io/web-components) | [购买 ¥9.99](https://payhip.com/b/S9pj2)


API文档里的代码示例，右上角总有个📋图标，点一下就复制了。这个"小小"的功能减少了用户99%的复制错误，还顺手把你的代码可信度提升了一个档次。

## 组件是什么

Copy to Clipboard（复制到剪贴板）让用户一键复制文本，无需手动全选+Ctrl+C。常见场景：代码块、API Key、分享链接、优惠码。

## 核心API：三行代码

```javascript
// 现代浏览器（Chrome 66+, Firefox 63+, Safari 13.1+）
await navigator.clipboard.writeText(text);
// 就这三个字，text是要复制的字符串
```

## HTML结构
```html
<!-- 代码块+复制按钮 -->
<div class="ef-code-block">
  <div class="ef-code-header">
    <span class="ef-code-lang">javascript</span>
    <button class="ef-copy-btn" data-copy="console.log('Hello World');" aria-label="复制代码">
      <svg class="ef-copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
      </svg>
      <svg class="ef-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
        <polyline points="20,6 9,17 4,12"/>
      </svg>
      <span class="ef-copy-text">复制</span>
    </button>
  </div>
  <pre class="ef-code-content"><code>console.log('Hello World');</code></pre>
</div>

<!-- 单独的内联复制 -->
<div class="ef-copy-inline">
  <input class="ef-copy-input" value="sk-xxxx-your-api-key" readonly>
  <button class="ef-copy-btn" data-copy-from=".ef-copy-input">复制</button>
</div>
```

## CSS核心
```css
.ef-code-block {
  background: #1e1e2e;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Fira Code', monospace;
}

.ef-code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #2a2a3e;
  border-bottom: 1px solid #3d3d56;
}

.ef-code-lang {
  font-size: 12px;
  color: #a0a0c0;
  text-transform: uppercase;
}

.ef-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid #4a4a6a;
  border-radius: 4px;
  background: transparent;
  color: #a0a0c0;
  font-size: 12px;
  cursor: pointer;
  transition: all .2s;
}

.ef-copy-btn:hover { background: #3a3a5a; color: #e0e0ff; border-color: #6a6a9a; }
.ef-copy-btn.copied { border-color: #22c55e; color: #22c55e; background: rgba(34,197,94,.1); }

.ef-code-content {
  padding: 16px;
  margin: 0;
  color: #cdd6f4;
  font-size: 14px;
  overflow-x: auto;
  line-height: 1.6;
}
```

## JS逻辑
```javascript
async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    
    // 视觉反馈：图标切换 + 文字变化
    const copyIcon = btn.querySelector('.ef-copy-icon');
    const checkIcon = btn.querySelector('.ef-check-icon');
    const copyText = btn.querySelector('.ef-copy-text');
    
    btn.classList.add('copied');
    if (copyIcon) copyIcon.style.display = 'none';
    if (checkIcon) checkIcon.style.display = 'block';
    if (copyText) copyText.textContent = '已复制！';
    
    // 2秒后恢复
    setTimeout(() => {
      btn.classList.remove('copied');
      if (copyIcon) copyIcon.style.display = 'block';
      if (checkIcon) checkIcon.style.display = 'none';
      if (copyText) copyText.textContent = '复制';
    }, 2000);
    
  } catch (err) {
    // 降级方案：document.execCommand（旧浏览器）
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// 绑定所有复制按钮
document.querySelectorAll('.ef-copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    let text = btn.dataset.copy;
    if (!text && btn.dataset.copyFrom) {
      const el = document.querySelector(btn.dataset.copyFrom);
      text = el ? (el.value || el.textContent) : '';
    }
    if (text) copyToClipboard(text, btn);
  });
});
```

## 关键技术点

1. **`navigator.clipboard.writeText()`**：返回Promise，必须 `await` 或 `.then()`
2. **HTTPS限制**：Clipboard API只在HTTPS或localhost下可用，HTTP直接报错
3. **`execCommand` 降级**：Safari 13以下、IE全系不支持Clipboard API，用旧方案兜底
4. **`data-copy` attribute**：把复制内容写在HTML属性里，零耦合，纯声明式

## 常见坑点

- ❌ 忘记 `await`：没有 `await` 的话，复制还没完成就执行了视觉反馈，可能显示"已复制"但实际失败
- ❌ HTTP页面：Clipboard API要求安全上下文，本地调试用 `localhost`，不要用 `http://xxx`
- ✅ 读取剪贴板 `navigator.clipboard.readText()` 还需要 `clipboard-read` 权限，不同于写入

## 变体拓展

- **Toast提示**：复制成功时弹出底部Toast替代按钮状态变化
- **批量复制**：选中多行代码后复制，用 `window.getSelection().toString()`
- **一键复制表格行**：`<tr>` 上加复制按钮，复制TSV格式到剪贴板

---

*Web Component Dictionary v2.0 — 下一篇：c16 数字输入步进器*
*[在线体验完整字典 →](https://wdsega.github.io/web-components)*

---

## Copy to Clipboard Button: The Clipboard API in 3 Lines

> **Web Component Dictionary v2.0** · 83 Components / 8 Categories / Bilingual / Live Preview / Zero Dependencies
> [Live Demo](https://wdsega.github.io/web-components) | [Buy ¥9.99](https://payhip.com/b/S9pj2)

Three lines of modern JavaScript:

```javascript
await navigator.clipboard.writeText(text);
```

Add a visual feedback (icon swap + color change for 2 seconds), handle the fallback with `execCommand` for old browsers, and you're done.

**The HTTPS pitfall**: Clipboard API only works on HTTPS or localhost. HTTP pages will silently fail. Always store content to copy in `data-copy` attribute for zero-coupling declarative markup.

[Full code + live demo →](https://wdsega.github.io/web-components)
