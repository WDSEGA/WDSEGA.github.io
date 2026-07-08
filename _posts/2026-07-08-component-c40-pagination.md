---
title: "组件详解#40：分页器，列表页最不起眼但最重要的组件 | Component Deep Dive #40: Pagination — The Most Underrated Hero of Every List Page"
date: 2026-07-08
categories: 组件详解
tags: [Component, Pagination, CSS, JavaScript, UI]
---

## 组件详解#40：分页器，列表页最不起眼但最重要的组件

> 产品介绍：Web Component Dictionary v2.0 收录83个手写UI组件，无需任何框架。完整源码+实时预览，已在 Payhip 上架。文末有获取方式。

### 为什么分页器值得认真写？

分页器是列表页的"地基"——用户可能不会赞美它，但如果它设计糟糕，用户一定会骂你。

三个最常见的坑：

1. **页数太多时全展开**：100页的全展开分页器，在手机上比内容还占地方
2. **没有省略号逻辑**：用户不知道中间还有多少页
3. **跳页输入框没做边界校验**：输入9999页直接白屏

好的分页器应该：一眼看到总页数、快速定位到目标页、移动端友好。

### 效果预览

核心交互：上下页按钮 + 页码列表 + 省略号智能折叠 + 跳页输入框。

```
< 1 ... 4 [5] 6 ... 20 >  跳至 [__] 页
```

当前页特殊高亮样式，不可点的按钮（首页/尾页）视觉淡化。移动端自动收窄为精简版：只有上下页 + 当前页/总页数。

### 代码拆解

**HTML 结构**：

```html
<nav class="pagination" role="navigation" aria-label="分页导航">
  <button class="pg-btn pg-prev" disabled>&lsaquo; Prev</button>
  <div class="pg-numbers" id="pgNumbers"></div>
  <button class="pg-btn pg-next">&rsaquo; Next</button>
  <div class="pg-jump">
    <span>跳至</span> <input type="number" id="pgJump" min="1">
    <span>页</span> <button class="pg-go">GO</button>
  </div>
  <span class="pg-total">共 <strong>20</strong> 页</span>
</nav>
```

**CSS 核心**：Flexbox 统一对齐，`:disabled` 视觉弱化，`@media (max-width: 600px)` 隐藏跳页和总数只保留核心按钮。

**JS 核心逻辑**——折叠算法是灵魂：

```javascript
function getPageNumbers(current, total) {
  if (total <= 7) return range(1, total);
  if (current <= 4) return [...range(1, 5), '...', total];
  if (current >= total - 3) return [1, '...', ...range(total - 4, total)];
  return [1, '...', current - 1, current, current + 1, '...', total];
}
```

三个判断分支覆盖所有场景：前段展开、后段展开、中段缩略。

### 关键技术点

1. **语义化**：用 `<nav aria-label>` 让屏幕阅读器正确朗读导航区域
2. **省略号不可点**：`'...'` 仅为视觉元素，不应是 `<button>`
3. **边界校验**：跳页输入 `min=1 max=total` 并 `Math.min(Math.max(1, input), total)`
4. **URL 同步**：`history.pushState({}, '', '?page=' + page)` 保持可分享性
5. **键盘导航**：左右方向键翻页，提升无障碍体验

### 常见坑点

- **忘记 `preventDefault`**：按钮在 `<form>` 内会触发表单提交
- **跳跃过大时不更新省略号**：需要重新计算 `getPageNumbers`
- **移动端按钮太小**：手指触摸区至少 36x36px，padding 不能省

### 完整可复制代码

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
.pagination { display:flex; flex-wrap:wrap; align-items:center; gap:6px; font-size:14px; padding:16px 0; }
.pg-btn { min-width:36px; height:36px; border:1px solid #d1d5db; background:#fff; border-radius:6px; cursor:pointer; font-size:16px; color:#374151; transition:all .15s; }
.pg-btn:hover:not(:disabled) { background:#f3f4f6; border-color:#9ca3af; }
.pg-btn:disabled { opacity:.4; cursor:not-allowed; }
.pg-btn.active { background:#2563eb; color:#fff; border-color:#2563eb; font-weight:600; }
.pg-ellipsis { width:36px; text-align:center; color:#9ca3af; user-select:none; }
.pg-jump { display:flex; align-items:center; gap:4px; margin-left:12px; color:#6b7280; }
.pg-jump input { width:52px; height:32px; text-align:center; border:1px solid #d1d5db; border-radius:4px; font-size:14px; }
.pg-go { height:32px; padding:0 10px; background:#2563eb; color:#fff; border:none; border-radius:4px; cursor:pointer; }
.pg-total { color:#9ca3af; margin-left:8px; }
@media (max-width:600px) { .pg-jump,.pg-total { display:none; } }
</style></head>
<body>
<nav class="pagination" role="navigation" aria-label="分页导航">
  <button class="pg-btn pg-prev">&lsaquo; 上一页</button>
  <div class="pg-numbers" id="pgNumbers"></div>
  <button class="pg-btn pg-next">下一页 &rsaquo;</button>
  <div class="pg-jump"><span>跳至</span><input type="number" id="pgJump" min="1"><span>页</span><button class="pg-go">GO</button></div>
  <span class="pg-total">共 <strong id="pgTotalText">20</strong> 页</span>
</nav>
<script>
const total = 20; let current = 1;
const numbersEl = document.getElementById('pgNumbers');
const totalEl = document.getElementById('pgTotalText');
totalEl.textContent = total;

function range(s,e){ return Array.from({length:e-s+1},(_,i)=>s+i); }
function getPageNumbers(c,t){
  if(t<=7) return range(1,t);
  if(c<=4) return [...range(1,5),'...',t];
  if(c>=t-3) return [1,'...',...range(t-4,t)];
  return [1,'...',c-1,c,c+1,'...',t];
}

function render(){
  const pages = getPageNumbers(current,total);
  numbersEl.innerHTML = pages.map(p=>{
    if(p==='...') return '<span class="pg-ellipsis">...</span>';
    return `<button class="pg-btn${p===current?' active':''}" data-page="${p}">${p}</button>`;
  }).join('');
  document.querySelector('.pg-prev').disabled = current === 1;
  document.querySelector('.pg-next').disabled = current === total;
}

function goTo(p){
  p = Math.min(Math.max(1,p), total);
  if(p===current) return;
  current = p;
  render();
  history.pushState({}, '', '?page=' + current);
}

numbersEl.addEventListener('click',e=>{
  const btn = e.target.closest('button[data-page]');
  if(btn) goTo(+btn.dataset.page);
});

document.querySelector('.pg-prev').addEventListener('click',()=>goTo(current-1));
document.querySelector('.pg-next').addEventListener('click',()=>goTo(current+1));
document.querySelector('.pg-go').addEventListener('click',()=>{
  goTo(+document.getElementById('pgJump').value);
});

document.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'){ e.preventDefault(); goTo(current-1); }
  if(e.key==='ArrowRight'){ e.preventDefault(); goTo(current+1); }
});

render();
</script>
</body>
</html>
```

### 变体拓展

- **无限滚动替代方案**：适用于信息流场景，用 Intersection Observer 替代分页
- **Load More 按钮**：适合列表不长的场景，省去分页复杂度
- **虚拟滚动分页**：海量数据场景结合 `react-window` 或 `vue-virtual-scroller`

---

**Web Component Dictionary v2.0** 收录83个手写UI组件——从分页器到日期选择器，全部无框架纯代码。预览地址见博客首页。

---

## Component Deep Dive #40: Pagination — The Most Underrated Hero of Every List Page

Pagination is the foundation of every list page. Users may never praise it, but if it's poorly designed, they will definitely complain.

### The Three Most Common Mistakes

1. **Full expansion with too many pages** — a 100-page paginator takes up more space than the content on mobile
2. **No ellipsis logic** — users can't tell how many pages remain
3. **Jump input without bounds validation** — typing "9999" causes a white screen

### The Core Algorithm

```javascript
function getPageNumbers(current, total) {
  if (total <= 7) return range(1, total);
  if (current <= 4) return [...range(1, 5), '...', total];
  if (current >= total - 3) return [1, '...', ...range(total - 4, total)];
  return [1, '...', current - 1, current, current + 1, '...', total];
}
```

Three branches cover every scenario: front expansion, back expansion, mid-range collapse.

### Key Technical Points

1. **Semantic HTML**: Use `<nav aria-label>` for screen readers
2. **Ellipsis is NOT a button**: visual element only, not interactive
3. **Bounds validation**: `Math.min(Math.max(1, input), total)`
4. **URL sync**: `history.pushState` maintains shareable URLs
5. **Keyboard navigation**: ArrowLeft/ArrowRight for accessibility

The full working demo with all code is included above. Every pagination component should handle edge cases gracefully—zero results, single page (hide entirely), and first/last page button states.

**Web Component Dictionary v2.0** — 83 hand-coded UI components. Zero frameworks. Available on Payhip.

*Check out the full component library at our blog homepage.*
