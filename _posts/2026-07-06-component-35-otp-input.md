---
layout: post
title: "OTP输入框 | Component Deep Dive #35: OTP Input — Auto-Advance, Paste, and Backspace Chaining"
date: 2026-07-06 11:00:00 +0800
categories: [组件深度解析, Component Deep Dive]
tags: [otp, input, authentication, webdev]
description: "OTP输入框看似简单，但自动跳格、粘贴分发、退格链和移动端兼容各有陷阱。"
author: 编译员
---

# OTP输入框 | Component Deep Dive #35: OTP Input

> 6个方框，每个一位数字。看起来简单到不需要写组件——直到你处理粘贴、退格链和移动端输入法。

OTP（一次性密码）输入框是认证流程的常客：短信验证码、邮箱验证码、2FA应用代码。它的交互模式与普通输入框完全不同：6个独立的小方框，输入一位自动跳到下一个，退格清除当前位并回退到前一位，粘贴时自动分发到所有方框。

## 基础结构

最常见的实现是6个独立的`<input>`元素：

```html
<div class="otp-container" role="group" aria-label="One-time code">
  <input type="text" inputmode="numeric" maxlength="1" data-index="0" aria-label="Digit 1" />
  <input type="text" inputmode="numeric" maxlength="1" data-index="1" aria-label="Digit 2" />
  <input type="text" inputmode="numeric" maxlength="1" data-index="2" aria-label="Digit 3" />
  <input type="text" inputmode="numeric" maxlength="1" data-index="3" aria-label="Digit 4" />
  <input type="text" inputmode="numeric" maxlength="1" data-index="4" aria-label="Digit 5" />
  <input type="text" inputmode="numeric" maxlength="1" data-index="5" aria-label="Digit 6" />
</div>
```

关键属性：`inputmode="numeric"`让移动端弹出数字键盘，`maxlength="1"`限制每位只输入一个字符，`aria-label`为每个框提供无障碍标签。

## 自动跳格

输入一位后自动聚焦下一个框：

```javascript
function handleInput(e) {
  const input = e.target;
  const index = parseInt(input.dataset.index);
  
  // Only accept digits
  const value = input.value.replace(/\D/g, '');
  input.value = value;
  
  if (value && index < 5) {
    const next = inputs[index + 1];
    next.focus();
    next.select(); // Select existing content for easy overwrite
  }
  
  // Check if all filled
  if (value && index === 5) {
    checkComplete();
  }
}
```

`next.select()`很重要——如果用户回退到已填的框重新输入，选中文本让新输入直接覆盖，而不是追加。

## 退格链

退格的行为是最容易出bug的地方。期望行为：如果当前框有值，清除当前框；如果当前框为空，清除前一个框并聚焦它。

```javascript
function handleKeydown(e) {
  const input = e.target;
  const index = parseInt(input.dataset.index);
  
  if (e.key === 'Backspace') {
    if (input.value) {
      // Current box has value: clear it, stay focused
      // Default behavior handles this, but we prevent default to control it
      input.value = '';
      e.preventDefault();
      checkComplete();
    } else if (index > 0) {
      // Current box empty: go back, clear previous
      e.preventDefault();
      const prev = inputs[index - 1];
      prev.value = '';
      prev.focus();
      checkComplete();
    }
  }
  
  if (e.key === 'ArrowLeft' && index > 0) {
    e.preventDefault();
    inputs[index - 1].focus();
  }
  
  if (e.key === 'ArrowRight' && index < 5) {
    e.preventDefault();
    inputs[index + 1].focus();
  }
}
```

不调用`e.preventDefault()`的话，浏览器默认行为可能让退格先清除当前框的值，但焦点留在原位——用户需要按两次退格才能回到前一个框。

## 粘贴分发

用户从短信应用复制验证码后粘贴到第一个框，期望6位数字自动分发到所有框：

```javascript
function handlePaste(e) {
  e.preventDefault();
  const pasted = (e.clipboardData || window.clipboardData).getData('text');
  const digits = pasted.replace(/\D/g, '').slice(0, 6);
  
  // Distribute digits across inputs
  digits.split('').forEach((digit, i) => {
    if (inputs[i]) {
      inputs[i].value = digit;
    }
  });
  
  // Focus the next empty input, or the last one
  const nextEmpty = inputs.findIndex(inp => !inp.value);
  if (nextEmpty === -1) {
    inputs[5].focus();
    checkComplete();
  } else {
    inputs[nextEmpty].focus();
  }
}
```

粘贴分发是OTP组件最重要的UX优化——没有它，用户需要手动点击6次。注意`replace(/\D/g, '')`过滤非数字字符，因为用户可能复制了"Your code is: 123456"这样的完整短信。

## 移动端陷阱

**输入法问题**：某些Android输入法在`maxlength="1"`的输入框中行为异常——输入一位后不触发`input`事件，而是等待用户选择候选词。解决方案是改用`type="tel"`（比`type="text"`更可靠地触发数字键盘）并监听`keyup`作为后备。

**自动填充**：iOS Safari支持SMS OTP自动填充（`autocomplete="one-time-code"`），但要求所有OTP输入框在一个`<form>`内，且`<form>`有`action`属性。如果用React等框架且没有`<form>`包裹，自动填充不会工作。

```html
<form action="/verify" method="post">
  <input type="hidden" name="otp" id="otp-hidden" />
  <div class="otp-container">
    <input type="tel" inputmode="numeric" autocomplete="one-time-code" maxlength="1" data-index="0" />
    <!-- ... -->
  </div>
</form>
```

**焦点跳跃**：在iOS上，`focus()`调用如果不直接在用户手势的同步执行栈中，会被浏览器阻止。自动跳格的`next.focus()`通常没问题（因为在`input`事件处理中），但如果在异步回调中调用就会失败。

## 完成检测

当6位全部填完时自动提交：

```javascript
function checkComplete() {
  const code = inputs.map(inp => inp.value).join('');
  if (code.length === 6) {
    // Auto-submit or show verify button as active
    submitOTP(code);
  }
}
```

注意不要在每次`input`事件中都触发提交——只在长度达到6时触发一次。可以用一个`wasComplete`标志位防止重复提交。

## 替代方案：单输入框

有些实现用一个`<input>`覆盖在6个视觉方框上，通过CSS的`letter-spacing`让字符分散对齐。优点是粘贴和输入法兼容性更好（只有一个输入框），缺点是退格行为难以自定义，且`letter-spacing`在不同字体下对齐效果不一致。

选择哪种方案取决于优先级：如果移动端兼容性最重要，用单输入框；如果桌面端体验最重要，用6个独立输入框。

---

# OTP Input | Component Deep Dive #35: OTP Input — Auto-Advance, Paste, and Backspace Chaining

> Six boxes, one digit each. Seems too simple to warrant a component — until you handle paste distribution, backspace chaining, and mobile IME quirks.

The OTP (one-time password) input is a staple of authentication flows: SMS codes, email verification, 2FA app codes. Its interaction model is completely different from a regular text input: six independent boxes, auto-advance on input, backspace clears and retreats, paste auto-distributes across all boxes.

## Basic Structure

The most common implementation uses six separate `<input>` elements:

```html
<div class="otp-container" role="group" aria-label="One-time code">
  <input type="text" inputmode="numeric" maxlength="1" data-index="0" aria-label="Digit 1" />
  <input type="text" inputmode="numeric" maxlength="1" data-index="1" aria-label="Digit 2" />
  <input type="text" inputmode="numeric" maxlength="1" data-index="2" aria-label="Digit 3" />
  <input type="text" inputmode="numeric" maxlength="1" data-index="3" aria-label="Digit 4" />
  <input type="text" inputmode="numeric" maxlength="1" data-index="4" aria-label="Digit 5" />
  <input type="text" inputmode="numeric" maxlength="1" data-index="5" aria-label="Digit 6" />
</div>
```

Key attributes: `inputmode="numeric"` triggers the numeric keypad on mobile, `maxlength="1"` limits each box to one character, `aria-label` provides accessible labels.

## Auto-Advance

After entering a digit, auto-focus the next box:

```javascript
function handleInput(e) {
  const input = e.target;
  const index = parseInt(input.dataset.index);
  
  const value = input.value.replace(/\D/g, '');
  input.value = value;
  
  if (value && index < 5) {
    const next = inputs[index + 1];
    next.focus();
    next.select();
  }
  
  if (value && index === 5) {
    checkComplete();
  }
}
```

`next.select()` is important — if the user navigates back to a filled box and types, selecting existing content lets the new input overwrite it instead of appending.

## Backspace Chaining

Backspace behavior is the most bug-prone part. Expected behavior: if the current box has a value, clear it; if the current box is empty, clear the previous box and focus it.

```javascript
function handleKeydown(e) {
  const input = e.target;
  const index = parseInt(input.dataset.index);
  
  if (e.key === 'Backspace') {
    if (input.value) {
      input.value = '';
      e.preventDefault();
      checkComplete();
    } else if (index > 0) {
      e.preventDefault();
      const prev = inputs[index - 1];
      prev.value = '';
      prev.focus();
      checkComplete();
    }
  }
  
  if (e.key === 'ArrowLeft' && index > 0) {
    e.preventDefault();
    inputs[index - 1].focus();
  }
  
  if (e.key === 'ArrowRight' && index < 5) {
    e.preventDefault();
    inputs[index + 1].focus();
  }
}
```

Without `e.preventDefault()`, the browser's default behavior may clear the current box's value but leave focus in place — forcing the user to press backspace twice to retreat.

## Paste Distribution

When a user copies a code from their SMS app and pastes into the first box, they expect all six digits to auto-distribute:

```javascript
function handlePaste(e) {
  e.preventDefault();
  const pasted = (e.clipboardData || window.clipboardData).getData('text');
  const digits = pasted.replace(/\D/g, '').slice(0, 6);
  
  digits.split('').forEach((digit, i) => {
    if (inputs[i]) {
      inputs[i].value = digit;
    }
  });
  
  const nextEmpty = inputs.findIndex(inp => !inp.value);
  if (nextEmpty === -1) {
    inputs[5].focus();
    checkComplete();
  } else {
    inputs[nextEmpty].focus();
  }
}
```

Paste distribution is the most important UX optimization for OTP components — without it, users must tap six times. Note the `replace(/\D/g, '')` filter for non-digit characters, since users may copy "Your code is: 123456" from their SMS.

## Mobile Pitfalls

**IME Issues**: Some Android IMEs behave oddly with `maxlength="1"` inputs — they don't fire the `input` event after one character, instead waiting for candidate word selection. The workaround is to use `type="tel"` (more reliably triggers numeric keypad than `type="text"`) and listen to `keyup` as a fallback.

**Auto-fill**: iOS Safari supports SMS OTP autofill (`autocomplete="one-time-code"`), but requires all OTP inputs inside a `<form>` with an `action` attribute. Without a `<form>` wrapper (common in React SPAs), autofill won't work.

```html
<form action="/verify" method="post">
  <input type="hidden" name="otp" id="otp-hidden" />
  <div class="otp-container">
    <input type="tel" inputmode="numeric" autocomplete="one-time-code" maxlength="1" data-index="0" />
    <!-- ... -->
  </div>
</form>
```

**Focus jumping**: On iOS, `focus()` calls outside a user gesture's synchronous execution stack are blocked by the browser. Auto-advance `next.focus()` usually works (it's in the `input` event handler), but calling it in an async callback will fail silently.

## Completion Detection

Auto-submit when all six digits are filled:

```javascript
function checkComplete() {
  const code = inputs.map(inp => inp.value).join('');
  if (code.length === 6) {
    submitOTP(code);
  }
}
```

Don't trigger submission on every `input` event — only when length reaches 6. Use a `wasComplete` flag to prevent duplicate submissions.

## Alternative: Single Input

Some implementations use a single `<input>` overlaid on six visual boxes, using CSS `letter-spacing` to spread characters apart. The advantage: better paste and IME compatibility (single input). The disadvantage: backspace behavior is harder to customize, and `letter-spacing` alignment varies across fonts.

Which approach to choose depends on priorities: if mobile compatibility is paramount, use single input; if desktop experience matters most, use six separate inputs.
