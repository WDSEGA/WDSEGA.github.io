---
title: "组件c61：打字机效果 | Component c61: Typewriter Effect"
layout: post
date: 2026-07-15
categories: [组件, 前端]
tags: [javascript, animation, typewriter]
---

> 一字一字蹦出来的文字，总比一整段砸在脸上更有戏剧感。今天拆解打字机效果——前端最经典的"仪式感"组件。

## 这是什么

打字机效果（Typewriter Effect）让文本逐字显示，模拟手动敲击键盘的过程。常用于Hero区域标语、终端模拟器、聊天机器人回复动画等场景。

## 效果预览

```
H|He|Hel|Hell|Hello|Hello |Hello W|Hello Wo|Hello Wor|Hello Worl|Hello World
```

每个字符之间有可配置的延迟，打字完成后光标闪烁。

## 代码拆解

### HTML

```html
<div class="typewriter-container">
  <span id="typewriter-text"></span>
  <span class="typewriter-cursor">|</span>
</div>
```

### CSS

```css
.typewriter-container {
  font-family: 'Courier New', monospace;
  font-size: 1.5rem;
  display: inline-flex;
  align-items: center;
}

.typewriter-cursor {
  margin-left: 2px;
  animation: blink 0.8s infinite;
  font-weight: bold;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
```

### JavaScript

```javascript
class Typewriter {
  constructor(element, texts, options = {}) {
    this.element = element;
    this.texts = Array.isArray(texts) ? texts : [texts];
    this.typeSpeed = options.typeSpeed || 80;
    this.deleteSpeed = options.deleteSpeed || 40;
    this.delayBetween = options.delayBetween || 1500;
    this.loop = options.loop !== false;
    this.textIndex = 0;
    this.charIndex = 0;
    this.isDeleting = false;
    this.tick();
  }

  tick() {
    const currentText = this.texts[this.textIndex];
    let displayText;

    if (this.isDeleting) {
      this.charIndex--;
      displayText = currentText.substring(0, this.charIndex);
    } else {
      this.charIndex++;
      displayText = currentText.substring(0, this.charIndex);
    }

    this.element.textContent = displayText;

    let delay = this.isDeleting ? this.deleteSpeed : this.typeSpeed;

    if (!this.isDeleting && this.charIndex === currentText.length) {
      delay = this.delayBetween;
      this.isDeleting = true;
    } else if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.textIndex = (this.textIndex + 1) % this.texts.length;
      delay = 500;
    }

    setTimeout(() => this.tick(), delay);
  }
}

// 使用
const tw = new Typewriter(
  document.getElementById('typewriter-text'),
  ['Hello World', '你好世界', 'Bonjour le monde'],
  { typeSpeed: 80, deleteSpeed: 40, delayBetween: 2000 }
);
```

## 关键技术点

1. **setTimeout递归而非setInterval**：每帧延迟可能不同（打字vs删除vs停顿），setTimeout递归可以动态调整间隔
2. **循环多文本**：通过`textIndex`轮转，支持多段文本循环播放
3. **光标独立动画**：光标用CSS `@keyframes blink`独立处理，不干扰打字逻辑

## 常见坑点

- **不要用setInterval**：打字、删除、停顿三种状态延迟不同，setInterval只能固定间隔
- **HTML转义**：如果文本包含HTML标签，需先转义再插入，否则会被解析
- **性能**：长文本时每次substring都创建新字符串，超大文本考虑用数组+join
- **无障碍**：屏幕阅读器会逐字朗读，建议提供`aria-label`完整文本

## 变体拓展

- **打字+声音**：每个字符触发一次keydown音效
- **多行打字**：维护行数组，每行打完后换行
- **Markdown渲染**：打字过程中实时解析Markdown（复杂度高）
- **反向打字**：从完整文本开始逐字删除

---

The typewriter effect reveals text character by character, simulating manual keyboard typing. It's commonly used in hero sections, terminal emulators, and chatbot reply animations.

**Key implementation details**:
- Use recursive `setTimeout` instead of `setInterval` — typing, deleting, and pausing all need different delays
- Loop through multiple texts with a `textIndex` counter
- Keep cursor blink as an independent CSS animation

**Common pitfalls**: Don't use `setInterval` (fixed interval can't handle variable delays). Escape HTML to prevent tag parsing. For accessibility, provide an `aria-label` with the full text since screen readers read character by character.

**Variants**: Add keystroke sound effects, multi-line typing, real-time Markdown rendering, or reverse typewriter (delete from full text).

*Full copy-paste code available above. Questions? Leave a comment.*
