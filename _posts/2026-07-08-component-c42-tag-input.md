---
title: "组件详解#42：标签输入框，比普通select好10倍的多选方案 | Component Deep Dive #42: Tag Input — A Multi-Select Pattern 10x Better Than Plain Select"
date: 2026-07-08
categories: 组件详解
tags: [Component, Tag Input, Multi-Select, JavaScript, UI]
---

## 组件详解#42：标签输入框，比普通select好10倍的多选方案

> 产品介绍：Web Component Dictionary v2.0 收录83个手写UI组件，无需任何框架。完整源码+实时预览，已在 Payhip 上架。文末有获取方式。

### 为什么不用原生 `<select multiple>`？

原生多选下拉框有三个致命问题：

1. **可视化极差**：用户看不到已选了哪些项，必须展开下拉才能确认
2. **交互反直觉**：Windows 用 Ctrl+点击、Mac 用 Cmd+点击——普通用户根本不知道
3. **无法自定义**：样式几乎不可修改，放任何现代界面里都格格不入

标签输入框（Tag/Chip Input）完美解决了这些痛点：已选项以标签形式直接展示，支持删除；输入时提供建议下拉，回车或点击即可添加。

### 效果预览

输入框内展示已选标签（带×删除按钮），输入文字后弹出匹配建议列表。核心功能：任意文字添加标签、建议过滤、回车/点击添加、Backspace 删除最后一个、标签去重、最大数量限制。

### 代码拆解

**HTML 结构**：

```html
<div class="tag-input-wrap">
  <div class="tag-input-inner">
    <span class="tag" data-value="react">React <button class="tag-x">&times;</button></span>
    <span class="tag" data-value="vue">Vue <button class="tag-x">&times;</button></span>
    <input type="text" class="tag-input-real" placeholder="输入标签...">
  </div>
  <ul class="tag-suggestions"></ul>
</div>
```

**JS 核心逻辑**——输入→过滤建议→选择添加→去重+上限：

```javascript
const tags = new Set(['react', 'vue']);
const MAX_TAGS = 10;
const suggestions = ['angular', 'svelte', 'solid', 'qwik', 'preact', 'lit', 'alpine', 'ember', 'backbone', 'jquery'];

input.addEventListener('input', () => {
  const val = input.value.trim().toLowerCase();
  if (!val) { hideSuggestions(); return; }
  const matches = suggestions.filter(s => s.includes(val) && !tags.has(s));
  renderSuggestions(matches.slice(0, 5));
});

function addTag(val) {
  val = val.trim().toLowerCase();
  if (!val || tags.has(val)) return;
  if (tags.size >= MAX_TAGS) return;
  tags.add(val);
  input.value = '';
  renderTags();
  hideSuggestions();
}
```

**CSS 关键**：`.tag-input-inner` 用 `flex-wrap:wrap` 让标签和输入框同行排列，`.tag` 用 inline-flex + 圆角背景。

### 关键技术点

1. **`Set` 数据结构**：天然去重，`has()` O(1) 查找比数组快
2. **Backspace 删除最后一个**：输入框为空时按 Backspace 高亮最后一个标签，再按一次删除
3. **建议列表定位**：`position:absolute` 相对于 `.tag-input-wrap`，计算输入框底部位置
4. **键盘导航建议**：上下方向键移动高亮项，Enter 选中
5. **表单数据提交**：用隐藏 `<select multiple>` 同步标签值，保证传统表单提交兼容

### 常见坑点

- **标签删除后焦点丢失**：删除标签时用 `input.focus()` 保持输入状态
- **建议列表遮挡**：建议列表 z-index 必须高于后续页面内容
- **中文输入法冲突**：用 `compositionstart` / `compositionend` 事件防止拼音中间状态触发过滤
- **空格标签**：`val.trim()` 防止空字符串被添加

### 完整可复制代码

```html
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
.tag-input-wrap { position:relative; width:100%; max-width:400px; }
.tag-input-inner { display:flex; flex-wrap:wrap; gap:6px; align-items:center; padding:8px; border:1px solid #d1d5db; border-radius:8px; background:#fff; min-height:44px; cursor:text; transition:border-color .15s; }
.tag-input-inner:focus-within { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.1); }
.tag { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; background:#e0e7ff; color:#3730a3; border-radius:20px; font-size:13px; line-height:1.4; }
.tag-x { width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center; border:none; background:rgba(55,48,163,.15); border-radius:50%; cursor:pointer; font-size:10px; color:#3730a3; line-height:1; padding:0; }
.tag-x:hover { background:rgba(55,48,163,.3); }
.tag-input-real { flex:1; min-width:80px; border:none; outline:none; font-size:14px; padding:2px 0; background:transparent; }
.tag-suggestions { display:none; position:absolute; top:100%; left:0; right:0; z-index:100; margin-top:4px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,.1); list-style:none; padding:4px; max-height:160px; overflow-y:auto; }
.tag-suggestions.open { display:block; }
.tag-suggestion { padding:8px 12px; border-radius:4px; cursor:pointer; font-size:14px; color:#374151; }
.tag-suggestion:hover,.tag-suggestion.highlight { background:#f3f4f6; }
</style></head><body>
<form>
<div class="tag-input-wrap" id="tagWrap">
  <div class="tag-input-inner" id="tagInner">
    <input type="text" class="tag-input-real" id="tagInput" placeholder="添加标签...">
  </div>
  <ul class="tag-suggestions" id="tagSuggestions"></ul>
</div>
<select name="tags" multiple hidden id="tagHidden"></select>
<button type="submit" style="margin-top:12px; padding:8px 20px; background:#2563eb; color:#fff; border:none; border-radius:6px; cursor:pointer;">提交</button>
</form>
<script>
const tags = new Set();
const MAX = 10;
const allSuggestions = ['React','Vue','Angular','Svelte','Solid','Qwik','Preact','Lit','Alpine','Ember','Next.js','Nuxt','Astro','Remix','SvelteKit','jQuery','Backbone','Meteor','Stencil','htmx'];
const input = document.getElementById('tagInput');
const inner = document.getElementById('tagInner');
const sugList = document.getElementById('tagSuggestions');
const hidden = document.getElementById('tagHidden');
let highlightIdx = -1;

function renderTags(){
  const existing = inner.querySelectorAll('.tag');
  existing.forEach(e=>e.remove());
  tags.forEach(v=>{
    const span = document.createElement('span');
    span.className='tag'; span.dataset.value=v;
    span.innerHTML=v+' <button type="button" class="tag-x">&times;</button>';
    inner.insertBefore(span, input);
  });
  syncHidden();
}

function syncHidden(){
  hidden.innerHTML = [...tags].map(v=>`<option value="${v}" selected>${v}</option>`).join('');
}

function showSuggestions(items){
  sugList.innerHTML = items.map((v,i)=>`<li class="tag-suggestion${i===highlightIdx?' highlight':''}" data-value="${v}">${v}</li>`).join('');
  sugList.classList.add('open');
}

function hideSuggestions(){
  sugList.classList.remove('open');
  highlightIdx = -1;
}

function addTag(val){
  val = val.trim();
  if(!val || tags.has(val) || tags.size >= MAX) return;
  tags.add(val);
  input.value = '';
  renderTags();
  hideSuggestions();
}

function removeTag(val){
  tags.delete(val);
  renderTags();
  input.focus();
}

input.addEventListener('input', ()=>{
  const val = input.value.trim().toLowerCase();
  if(!val){ hideSuggestions(); return; }
  highlightIdx = -1;
  const matches = allSuggestions.filter(s=>s.toLowerCase().includes(val) && !tags.has(s));
  showSuggestions(matches.slice(0,6));
});

input.addEventListener('keydown', e=>{
  const items = sugList.querySelectorAll('.tag-suggestion');
  if(e.key==='Enter'){
    e.preventDefault();
    if(highlightIdx>=0 && items[highlightIdx]){
      addTag(items[highlightIdx].dataset.value);
    } else if(input.value.trim()){
      addTag(input.value);
    }
  }
  if(e.key==='Backspace' && !input.value && tags.size>0){
    const lastTag = [...tags].pop();
    removeTag(lastTag);
  }
  if(e.key==='ArrowDown'){ e.preventDefault(); highlightIdx=Math.min(highlightIdx+1, items.length-1); renderHighlight(items); }
  if(e.key==='ArrowUp'){ e.preventDefault(); highlightIdx=Math.max(highlightIdx-1, -1); renderHighlight(items); }
  if(e.key==='Escape') hideSuggestions();
});

function renderHighlight(items){
  items.forEach((el,i)=>el.classList.toggle('highlight', i===highlightIdx));
}

sugList.addEventListener('click', e=>{
  const li = e.target.closest('.tag-suggestion');
  if(li) addTag(li.dataset.value);
});

inner.addEventListener('click', e=>{
  if(e.target===inner) input.focus();
});

inner.addEventListener('click', e=>{
  const xBtn = e.target.closest('.tag-x');
  if(xBtn){ e.stopPropagation(); removeTag(xBtn.parentElement.dataset.value); }
});

document.addEventListener('click', e=>{
  if(!document.getElementById('tagWrap').contains(e.target)) hideSuggestions();
});
</script>
</body></html>
```

### 变体拓展

- **带头像标签**：标签内显示用户头像，用于收件人选择器
- **可编辑标签**：双击标签进入编辑模式
- **拖拽排序**：结合 Drag & Drop API 调整标签顺序

---

**Web Component Dictionary v2.0** 收录83个手写UI组件——从标签输入到分页器，全部零框架可运行。详情见博客首页。

---

## Component Deep Dive #42: Tag Input — A Multi-Select Pattern 10x Better Than Plain Select

### Why Not Use Native `<select multiple>`?

Native multi-select has three fatal problems: poor visibility (users can't see what's selected without opening the dropdown), counterintuitive interaction (Ctrl+click on Windows, Cmd+click on Mac), and zero customizability.

A tag input solves all of these: selected items are displayed as removable tags, suggestions appear as you type, and Enter or click adds them.

### The Core Logic

```javascript
const tags = new Set();
function addTag(val) {
  val = val.trim();
  if (!val || tags.has(val) || tags.size >= MAX) return;
  tags.add(val);
  input.value = '';
  renderTags();
  hideSuggestions();
}
```

Using `Set` provides built-in deduplication with O(1) lookup.

### Key Technical Points

1. **`Set` data structure**: natural deduplication, faster `has()` than array `includes()`
2. **Backspace to delete last tag**: when input is empty, highlight last tag; second Backspace removes it
3. **Suggestions positioning**: `position:absolute` relative to wrapper, calculates input bottom
4. **Keyboard navigation**: Arrow keys for suggestion list, Enter to select
5. **Form compatibility**: hidden `<select multiple>` syncs tag values for traditional form submission

### Critical Gotchas

- **Focus after deletion**: always `input.focus()` after removing a tag
- **Suggestion list z-index**: must be higher than subsequent page content
- **IME composition**: use `compositionstart`/`compositionend` to prevent mid-composition filtering
- **Empty tags**: always `val.trim()` before adding

Full demo with complete HTML/CSS/JS is included above — copy, paste, and it works.

**Web Component Dictionary v2.0** — 83 hand-coded UI components. Zero frameworks. Available on Payhip.
