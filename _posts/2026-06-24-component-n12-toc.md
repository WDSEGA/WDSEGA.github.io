---
layout: post
title: "组件详解#12：目录导航，你的文章很长，但读者的耐心只有3秒 | Component Deep Dive #12: Table of Contents — Your Article Is Long, But Your Reader's Patience Is 3 Seconds"
date: 2026-06-24 18:00:00 +0800
categories: components
tags: [代码产品, Web Components, CSS, JavaScript, TOC]
---

> 本文组件来自 **Web Component Dictionary v2.0** · 网页组件活字典，83组件/8分类/中英双语/实时预览/单文件无依赖。  
> 在线体验：[wdsega.github.io/web-components](https://wdsega.github.io/web-components/) | 购买完整版：[payhip.com/b/S9pj2](https://payhip.com/b/S9pj2) ¥9.99

---

## 3000 字的文章，读者 3 秒决定看不看

你花了 4 小时写了一篇深度技术文章。发布后，平均阅读时长 32 秒。为什么？

因为这 3000 字对读者来说是一堵墙。他不知道里面有什么，不知道值不值得花时间。目录导航（Table of Contents，TOC）就是这堵墙上的地图。

几乎所有技术文档网站都有 TOC：MDN、Vue 文档、React 文档。它不是装饰，是信息架构的一部分。

## 组件是什么

Web Component Dictionary v2.0 中的目录导航是一个侧边栏组件，自动提取页面标题生成目录，固定吸附在页面一侧，滚动时高亮当前阅读位置。

核心特征：
- 自动提取 `<h2>` / `<h3>` 标题生成目录
- 侧边栏固定（sticky），不随页面滚动消失
- 当前阅读位置高亮（Scroll Spy）
- 点击跳转 + 平滑滚动

## 代码拆解

### HTML 结构

```html
<div class="toc-container">
  <nav class="toc">
    <h3 class="toc-title">目录</h3>
    <ul class="toc-list" id="tocList">
      <!-- JS 动态生成 -->
    </ul>
  </nav>
  <main class="toc-content">
    <h2 id="intro">引言</h2>
    <h2 id="setup">环境搭建</h2>
    <h2 id="usage">使用方法</h2>
    <h2 id="advanced">高级技巧</h2>
  </main>
</div>
```

### CSS：侧边栏吸顶

```css
.toc-container {
  display: flex;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.toc {
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
  align-self: flex-start;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.toc-list a {
  display: block;
  padding: 6px 12px;
  color: #888;
  text-decoration: none;
  font-size: 14px;
  border-left: 2px solid transparent;
  transition: all 0.2s ease;
}

.toc-list a.active {
  color: #e94560;
  border-left-color: #e94560;
  background: rgba(233,69,96,0.1);
}

.toc-content {
  flex: 1;
  min-width: 0;
}
```

关键技巧：
- `position: sticky; top: 80px` — 侧边栏吸顶，留出导航栏空间
- `align-self: flex-start` — 防止 sticky 被 flex 拉伸
- `max-height: calc(100vh - 100px)` — 目录太长时自己滚动
- 活跃项用左边框高亮，视觉引导更清晰

### JavaScript：动态生成 + Scroll Spy

```javascript
function buildTOC() {
  const tocList = document.getElementById('tocList');
  const headings = document.querySelectorAll('.toc-content h2, .toc-content h3');
  
  headings.forEach(heading => {
    if (!heading.id) {
      heading.id = heading.textContent
        .toLowerCase().replace(/\s+/g, '-');
    }
    
    const a = document.createElement('a');
    a.href = '#' + heading.id;
    a.textContent = heading.textContent;
    a.dataset.target = heading.id;
    
    if (heading.tagName === 'H3') {
      a.style.paddingLeft = '28px';
      a.style.fontSize = '13px';
    }
    
    const li = document.createElement('li');
    li.appendChild(a);
    tocList.appendChild(li);
  });
}

// 点击平滑跳转
tocList.addEventListener('click', e => {
  if (e.target.tagName === 'A') {
    e.preventDefault();
    const target = document.getElementById(e.target.dataset.target);
    target.scrollIntoView({ behavior: 'smooth' });
  }
});

// Scroll Spy
window.addEventListener('scroll', () => {
  const headings = document.querySelectorAll('.toc-content h2, .toc-content h3');
  let current = '';
  headings.forEach(h => {
    if (window.scrollY >= h.offsetTop - 120) current = h.id;
  });
  document.querySelectorAll('.toc-list a').forEach(a => {
    a.classList.toggle('active', a.dataset.target === current);
  });
});
```

## 关键技术点深挖

### `sticky` vs `fixed`

很多人用 `fixed` 做侧边栏。问题：`fixed` 脱离文档流，需要手动算 left/right，响应式布局时位置会跑偏。

`sticky` 的优势：保持 flex 布局中的原始位置，只"粘"在指定位置。你不需要计算 left 值——在父容器列里自然定位。响应式友好得多。

### 自动生成 vs 手写 HTML

自动提取的好处是零维护。但如果标题是"那些年我们追过的技术债"这种文学化风格，提取出来的目录可读性差。

推荐：自动提取 + 手动覆盖。JS 生成默认目录，支持在 HTML 里用手写的 `<ul class="toc-list">` 覆盖。

### 移动端适配

小屏幕 240px 侧边栏太奢侈。用 `@media (max-width: 768px)` 把 TOC 改成顶部横排标签，或收进 `<details>` 折叠块：

```css
@media (max-width: 768px) {
  .toc-container { flex-direction: column; }
  .toc { width: 100%; position: static; }
  .toc-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .toc-list a { border-left: none; border-bottom: 2px solid transparent; }
  .toc-list a.active { border-bottom-color: #e94560; }
}
```

## 常见坑点

**坑1：`id` 冲突**

两个 section 都叫"使用方法" → 都生成 `#使用方法` → 锚点失效。解决：检查重复后追加 `-2`、`-3`。

**坑2：动态内容**

SPA/MDX 页面加载时标题还不存在。`buildTOC()` 要放在内容加载完成的回调里。

**坑3：URL hash 污染**

点击 TOC 链接改变 URL。用户刷新后跳到锚点位置，但 TOC 没高亮。解决：页面加载时读取 hash，主动高亮对应目录项。

## 变体拓展

1. **折叠式层级**：h3 默认隐藏，点击 h2 展开
2. **进度条版**：目录项旁显示阅读进度百分比
3. **浮窗版**：移动端右下角浮窗按钮呼出目录

---

> 本文组件来自 **Web Component Dictionary v2.0** — 83个开箱即用的网页组件，导航/表单/数据展示/多媒体等8大分类，中英双语，实时预览，单文件无依赖。  
> 🔗 在线体验：[wdsega.github.io/web-components](https://wdsega.github.io/web-components/)  
> 🛒 购买完整版源码（¥9.99 一次性买断）：[payhip.com/b/S9pj2](https://payhip.com/b/S9pj2)

---

## Component Deep Dive #12: Table of Contents — Your Article Is Long, But Your Reader's Patience Is 3 Seconds

### 3,000 Words, 3 Seconds to Decide

You spent 4 hours writing a deep technical article. Published it. Average read time: 32 seconds. Why?

Because to a reader, 3,000 words is a wall. They don't know what's inside. A Table of Contents is the map on that wall.

Almost every technical documentation site has a TOC: MDN, Vue docs, React docs. It's not decoration; it's information architecture.

### What It Is

A sidebar component that auto-extracts headings, sticks to the page side, and highlights the current reading position via Scroll Spy.

### Code Breakdown

**HTML**: A flex container with `<nav class="toc">` and `<main>`. Headings have IDs.

**CSS**: `position: sticky; top: 80px` keeps the sidebar visible during scroll. `align-self: flex-start` prevents flex stretching. Active items highlight with a left border accent.

**JS**: `buildTOC()` scans `<h2>`/`<h3>` elements and builds anchor links. Click handlers use `scrollIntoView({ behavior: 'smooth' })`. Scroll listener updates `.active` class.

### Key Insight: `sticky` > `fixed`

`position: fixed` requires manual left/right calculations that break on responsive layouts. `sticky` stays in its natural flex position and just sticks — no position math needed.

### Auto-Generation vs Manual HTML

Auto-extraction = zero maintenance. But literary-style headings produce ugly TOC entries. Best practice: auto-generate by default, with a manual override option using pre-written `<ul class="toc-list">`.

### Mobile Adaptation

At `< 768px`, restructure TOC as horizontal tag cloud or collapse into a `<details>` block.

### Common Pitfalls

- **Duplicate IDs**: Two "Usage" sections collide. Add sequential suffixes.
- **Dynamic content**: In SPAs, headings may not exist at `DOMContentLoaded`. Call `buildTOC()` in content-loaded callback.
- **URL hash pollution**: Handle URL hash on page load to highlight the correct TOC item.

### Variants

- **Collapsible hierarchy**: h3 hidden, expand on h2 click
- **Progress indicator**: Reading percentage beside each item
- **Floating trigger**: Corner button overlay for mobile

---

> This component is from **Web Component Dictionary v2.0** — 83 ready-to-use web components across 8 categories. Bilingual, live preview, single-file, zero dependencies.  
> 🔗 Live demo: [wdsega.github.io/web-components](https://wdsega.github.io/web-components/)  
> 🛒 Buy full source code ($9.99 one-time): [payhip.com/b/S9pj2](https://payhip.com/b/S9pj2)
