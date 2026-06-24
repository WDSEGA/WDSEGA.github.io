---
title: "组件详解#7：分页器，万条数据只加载一页的秘密 | Component Deep Dive #7: Pagination — The Secret to Loading 10,000 Records One Page at a Time"
date: 2026-06-23 00:45:00 +0800
categories: [组件详解]
tags: [代码产品, 分页器, Pagination, Web组件, 前端开发]
canonical_url: https://wdsega.github.io/2026/06/23/component-n07-pagination/
---

> 本文组件来自Web Component Dictionary v2.0·网页组件活字典，83组件/8分类/中英双语/实时预览/单文件无依赖。在线体验 wdsega.github.io/web-components | 购买 payhip.com/b/S9pj2 ¥9.99

你打开一个电商网站搜索"手机壳"，结果返回了12,847条商品。如果一次性全部渲染，浏览器直接卡死。但页面却丝滑地只显示了24个商品，底部一排数字按钮让你翻页浏览。这就是分页器——一个看似简单、实则处处是坑的组件。

## 分页器是什么

分页器（Pagination）是数据量过大时，将内容拆分为多页展示的导航组件。它让用户通过"上一页/下一页"或直接点击页码来浏览不同页面，是列表页、搜索结果页、后台数据表格的标配。

核心交互模式：当前页高亮、前后页跳转、首尾页快捷入口、省略号折叠中间页码。

## 效果预览

分页器由一组按钮组成：上一页、页码1（高亮）、页码2、页码3、省略号、页码12、下一页。当前页用主色背景突出显示，其余页码为白底灰边。

## 代码拆解

### HTML结构

```html
<div class="pagination">
  <button class="page-btn prev">Prev</button>
  <button class="page-btn active">1</button>
  <button class="page-btn">2</button>
  <button class="page-btn">3</button>
  <span class="page-ellipsis">...</span>
  <button class="page-btn">12</button>
  <button class="page-btn next">Next</button>
</div>
```

结构极简：一个容器div包裹所有按钮。关键点在于`active`类标记当前页，`ellipsis`处理页码过多时的折叠。

### CSS样式

```css
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
}
.page-btn {
  padding: 8px 14px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}
.page-btn:hover {
  border-color: #e94560;
  color: #e94560;
}
.page-btn.active {
  background: #e94560;
  color: #fff;
  border-color: #e94560;
}
.page-ellipsis {
  padding: 0 4px;
  color: #999;
}
```

### JavaScript逻辑

```javascript
function createPagination(current, total, visible = 5) {
  let pages = [];
  let start = Math.max(1, current - Math.floor(visible / 2));
  let end = Math.min(total, start + visible - 1);
  // 调整start确保显示足够的页码
  start = Math.max(1, end - visible + 1);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('...');
  }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total) {
    if (end < total - 1) pages.push('...');
    pages.push(total);
  }
  return pages;
}
```

## 关键技术点深挖

### 省略号算法

分页器最难的部分不是样式，而是"什么时候显示省略号"。规则是：当总页数超过可见页码数时，中间页码用省略号折叠。上面的`createPagination`函数通过比较`start`和`end`与边界的关系，智能插入省略号。

### 键盘可访问性

好的分页器必须支持键盘操作：左右箭头翻页、Home/End跳到首尾页、数字键直接跳转。加上`aria-label="Pagination"`和`aria-current="page"`让屏幕阅读器也能正确朗读。

### URL同步

用户翻到第3页后刷新或分享链接，应该还能回到第3页。这需要用`URLSearchParams`或`history.pushState`把页码写进URL。

## 常见坑点

1. **页码越界**：用户手动输入URL `?page=999` 超出总页数，必须做边界检查
2. **并发请求竞态**：快速点击翻页时，先发的请求可能后返回，导致显示错误页面的数据。解决方案：用请求ID或AbortController取消旧请求
3. **SEO考虑**：搜索引擎爬虫可能不会执行JS翻页，重要内容应提供分页的静态链接或使用`rel="next"`/`rel="prev"`

## 完整可复制代码

```html
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: sans-serif; padding: 40px; display: flex; justify-content: center; }
.pagination { display: flex; gap: 6px; align-items: center; }
.page-btn {
  padding: 8px 14px; border: 1px solid #ddd; background: #fff;
  cursor: pointer; border-radius: 6px; transition: all 0.2s; font-size: 14px;
}
.page-btn:hover { border-color: #e94560; color: #e94560; }
.page-btn.active { background: #e94560; color: #fff; border-color: #e94560; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-ellipsis { padding: 0 4px; color: #999; }
</style>
</head>
<body>
<div class="pagination" id="pg"></div>
<script>
var currentPage = 1, totalPages = 12, visiblePages = 5;

function render() {
  var pg = document.getElementById('pg');
  pg.innerHTML = '';
  // Prev button
  var prev = document.createElement('button');
  prev.className = 'page-btn'; prev.textContent = 'Prev';
  prev.disabled = currentPage === 1;
  prev.onclick = function() { if (currentPage > 1) { currentPage--; render(); } };
  pg.appendChild(prev);
  // Page numbers
  var pages = getPageNumbers();
  pages.forEach(function(p) {
    if (p === '...') {
      var span = document.createElement('span');
      span.className = 'page-ellipsis'; span.textContent = '...';
      pg.appendChild(span);
    } else {
      var btn = document.createElement('button');
      btn.className = 'page-btn' + (p === currentPage ? ' active' : '');
      btn.textContent = p;
      btn.onclick = function() { currentPage = p; render(); };
      pg.appendChild(btn);
    }
  });
  // Next button
  var next = document.createElement('button');
  next.className = 'page-btn'; next.textContent = 'Next';
  next.disabled = currentPage === totalPages;
  next.onclick = function() { if (currentPage < totalPages) { currentPage++; render(); } };
  pg.appendChild(next);
}

function getPageNumbers() {
  var pages = [];
  var start = Math.max(1, currentPage - Math.floor(visiblePages / 2));
  var end = Math.min(totalPages, start + visiblePages - 1);
  start = Math.max(1, end - visiblePages + 1);
  if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
  for (var i = start; i <= end; i++) pages.push(i);
  if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
  return pages;
}
render();
</script>
</body>
</html>
```

## 变体拓展

- **无限滚动替代**：用Intersection Observer监听滚动到底部时自动加载下一页
- **跳页输入框**：在分页器末尾加一个输入框，用户输入数字直接跳转
- **每页条数选择器**：配合下拉菜单，让用户选择每页显示10/20/50条
- **移动端简化**：屏幕小于768px时只显示Prev/Next和"3/12"文字

---

> This component is from Web Component Dictionary v2.0 — 83 components / 8 categories / bilingual / live preview / single-file zero-dependency. Try it at wdsega.github.io/web-components | Buy at payhip.com/b/S9pj2

You search "phone case" on an e-commerce site and get 12,847 results. Rendering them all at once would freeze the browser. Instead, the page smoothly shows 24 items with a row of numbered buttons at the bottom. That's pagination — a seemingly simple component full of pitfalls.

Pagination is a navigation component that splits large datasets into multiple pages. Core interaction: current page highlighted, prev/next navigation, first/last page shortcuts, and ellipsis folding for middle pages.

The hardest part isn't styling — it's the ellipsis algorithm: when to show "..." and how many page numbers to display. You also need to handle URL sync for refresh/share, keyboard accessibility, and request race conditions when users click too fast.

Key pitfalls: page number overflow (user manually types `?page=999`), concurrent request race conditions (use AbortController), and SEO considerations (search engines may not execute JS pagination).
