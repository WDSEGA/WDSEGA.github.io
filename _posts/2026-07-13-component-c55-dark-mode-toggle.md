---
layout: post
title: "暗黑模式切换 Dark Mode Toggle | 纯CSS+JS实现网站主题切换"
date: 2026-07-13
categories: [component]
tags: [web-component, css, javascript, dark-mode]
---

> 一个按钮，两种世界。暗黑模式切换是现代网站的标配功能——但90%的实现都忽略了prefers-color-scheme和CSS变量这一黄金组合。今天我们从零实现一个完美的暗黑模式切换组件。

## 组件是什么

暗黑模式切换（Dark Mode Toggle）允许用户在亮色和暗色主题之间切换。一个好的实现需要：
- 跟随系统偏好自动选择初始主题
- 用户手动切换后持久化保存到localStorage
- 用CSS变量驱动，零JS样式操作
- 平滑过渡动画，不闪烁

## 效果预览

```html
<div class="theme-toggle">
  <button id="themeBtn" class="theme-btn" aria-label="Toggle dark mode">
    <span class="theme-icon"></span>
  </button>
</div>
<div class="demo-card">
  <h3>Demo Content</h3>
  <p>Click the button to toggle theme.</p>
</div>
```

## 代码拆解

### HTML结构

```html
<button id="themeBtn" class="theme-btn" aria-label="Toggle dark mode">
  <span class="theme-icon"></span>
</button>
```

只需一个button，图标用CSS伪元素绘制太阳/月亮，无需SVG。

### CSS核心：变量驱动

```css
:root {
  --bg: #ffffff;
  --text: #1a1a2e;
  --card-bg: #f5f5f7;
  --border: #e0e0e0;
  --accent: #6c5ce7;
  --transition: 0.3s ease;
}

[data-theme="dark"] {
  --bg: #1a1a2e;
  --text: #e0e0e0;
  --card-bg: #16213e;
  --border: #2a2a4a;
  --accent: #a29bfe;
}

body {
  background: var(--bg);
  color: var(--text);
  transition: background var(--transition), color var(--transition);
}
```

关键点：所有颜色用CSS变量，切换时只改`data-theme`属性，浏览器自动重绘。

### CSS：图标动画

```css
.theme-btn {
  width: 48px;
  height: 48px;
  border: 2px solid var(--border);
  border-radius: 50%;
  background: var(--card-bg);
  cursor: pointer;
  position: relative;
  transition: border-color var(--transition);
}

.theme-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent);
  transform: translate(-50%, -50%);
  transition: all var(--transition);
  box-shadow: 0 0 0 0 transparent;
}

/* 亮色模式：太阳（带光芒） */
[data-theme="light"] .theme-icon {
  box-shadow:
    8px 0 0 -4px var(--accent),
    -8px 0 0 -4px var(--accent),
    0 8px 0 -4px var(--accent),
    0 -8px 0 -4px var(--accent),
    6px 6px 0 -4px var(--accent),
    -6px -6px 0 -4px var(--accent),
    6px -6px 0 -4px var(--accent),
    -6px 6px 0 -4px var(--accent);
}

/* 暗色模式：月亮（弯月） */
[data-theme="dark"] .theme-icon {
  box-shadow: 5px -3px 0 -1px var(--bg);
  transform: translate(-50%, -50%) rotate(-30deg);
}
```

太阳用8个box-shadow模拟光芒，月亮用一个偏移的阴影"咬掉"一部分形成弯月。

### JavaScript：三态逻辑

```javascript
const themeBtn = document.getElementById('themeBtn');

function getPreferredTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// 初始化
applyTheme(getPreferredTheme());

// 点击切换
themeBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// 跟随系统变化（仅当用户未手动选择时）
window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
```

## 关键技术点

1. **CSS变量驱动**：不操作style属性，只改data-theme，性能最优
2. **三态优先级**：localStorage > prefers-color-scheme > 默认light
3. **防闪烁**：在`<head>`中内联初始化脚本，避免FOUC（Flash of Unstyled Content）

```html
<head>
  <script>
    (function() {
      var t = localStorage.getItem('theme')
        || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', t);
    })();
  </script>
</head>
```

## 常见坑点

- **FOUC闪烁**：页面加载时先显示默认主题再跳变。解决：在`<head>`内联执行`applyTheme`，在任何CSS渲染之前
- **iframe不继承**：每个iframe的documentElement是独立的，需要单独设置
- **box-shadow计算**：太阳光芒的8个shadow偏移和spread需要精确计算，差1px就会变形
- **Safari兼容**：`prefers-color-scheme`在Safari 12.1+才支持，旧版需要降级

## 完整可复制代码

```html
<!DOCTYPE html>
<html lang="zh" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dark Mode Toggle</title>
<script>
(function(){
  var t=localStorage.getItem('theme')||
  (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  document.documentElement.setAttribute('data-theme',t);
})();
</script>
<style>
:root{--bg:#fff;--text:#1a1a2e;--card:#f5f5f7;--border:#e0e0e0;--accent:#6c5ce7;--t:0.3s ease}
[data-theme="dark"]{--bg:#1a1a2e;--text:#e0e0e0;--card:#16213e;--border:#2a2a4a;--accent:#a29bfe}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;gap:20px;transition:background var(--t),color var(--t)}
.theme-btn{width:48px;height:48px;border:2px solid var(--border);border-radius:50%;background:var(--card);cursor:pointer;position:relative;transition:border-color var(--t)}
.theme-icon{position:absolute;top:50%;left:50%;width:18px;height:18px;border-radius:50%;background:var(--accent);transform:translate(-50%,-50%);transition:all var(--t)}
[data-theme="light"] .theme-icon{box-shadow:8px 0 0 -4px var(--accent),-8px 0 0 -4px var(--accent),0 8px 0 -4px var(--accent),0 -8px 0 -4px var(--accent),6px 6px 0 -4px var(--accent),-6px -6px 0 -4px var(--accent),6px -6px 0 -4px var(--accent),-6px 6px 0 -4px var(--accent)}
[data-theme="dark"] .theme-icon{box-shadow:5px -3px 0 -1px var(--bg);transform:translate(-50%,-50%) rotate(-30deg)}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;transition:all var(--t)}
.card h3{color:var(--accent);margin-bottom:8px}
</style>
</head>
<body>
<button class="theme-btn" onclick="var c=document.documentElement.getAttribute('data-theme');var n=c==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',n);localStorage.setItem('theme',n)">
<span class="theme-icon"></span>
</button>
<div class="card"><h3>Hello World</h3><p>Toggle theme with the button.</p></div>
</body>
</html>
```

## 变体拓展

- **三态切换**：light / dark / system，用select或三段式开关
- **主题色选择器**：除明暗外，让用户选主色调（blue/purple/green等）
- **自动跟随时间**：6:00-18:00亮色，其余暗色，无需用户操作

---

> One button, two worlds. Dark mode toggle is a standard feature of modern websites — but 90% of implementations ignore the golden combo of prefers-color-scheme and CSS variables. Today we build a perfect dark mode toggle from scratch.

## What Is It

Dark Mode Toggle lets users switch between light and dark themes. A good implementation needs:
- Follow system preference for initial theme
- Persist user's manual choice to localStorage
- CSS variable driven, zero JS style manipulation
- Smooth transition animation, no flash

## Code Breakdown

### CSS Core: Variable Driven

All colors use CSS variables. Switching only changes the `data-theme` attribute — the browser handles repainting automatically.

### Icon Animation

The sun uses 8 box-shadows to simulate rays; the moon uses one offset shadow to "bite" a portion, creating a crescent.

### JavaScript: Three-State Logic

Priority: localStorage > prefers-color-scheme > default light. Also listens for system theme changes.

## Key Technical Points

1. **CSS variable driven**: No style property manipulation, only data-theme change — optimal performance
2. **Three-state priority**: localStorage > prefers-color-scheme > default light
3. **Anti-flash**: Inline initialization script in `<head>` to prevent FOUC

## Common Pitfalls

- **FOUC flash**: Inline execute applyTheme in `<head>` before any CSS renders
- **iframe inheritance**: Each iframe has its own documentElement
- **box-shadow calculation**: Sun ray shadows need precise offset and spread
- **Safari compat**: prefers-color-scheme requires Safari 12.1+

---

*更多Web组件，请访问 [Web组件字典](https://wdsega.github.io/web-components/widget.html)。*
