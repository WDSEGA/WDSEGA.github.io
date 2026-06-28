---
layout: post
title: "c10-标签组件 Tag | 内容分类的视觉语言"
date: 2026-06-27 09:30:00 +0800
categories: [组件, Web Component Dictionary]
tags: [tag, css, web-components, frontend]
---


> **Web Component Dictionary v2.0 · 网页组件活字典**  
> 83个组件/8大分类/中英双语/实时预览/单文件无依赖  
> [在线体验](https://wdsega.github.io/web-components) | [购买 ¥9.99](https://payhip.com/b/S9pj2)



博客标签、商品分类、技能标注——Tag（标签组件）是内容组织的基础工具。

## 组件是什么

Tag（标签）是可附加到内容的短文本标识符，帮助用户快速理解内容归属和筛选内容。与Badge不同：Badge传达状态，Tag传达分类。

## 三种核心形态

**1. 静态标签（只读）**
```html
<span class="tag">JavaScript</span>
<span class="tag tag-blue">React</span>
<span class="tag tag-green">Node.js</span>
```

**2. 可删除标签（输入框中）**
```html
<div class="tag tag-removable">
  前端开发
  <button class="tag-remove" aria-label="删除标签" onclick="removeTag(this)">×</button>
</div>
```

**3. 可选标签（筛选器）**
```html
<div class="tag-group" role="group">
  <button class="tag tag-selectable active">全部</button>
  <button class="tag tag-selectable">设计</button>
  <button class="tag tag-selectable">开发</button>
  <button class="tag tag-selectable">产品</button>
</div>
```

## CSS 核心

```css
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  white-space: nowrap;
}

/* 颜色变体 */
.tag-blue  { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.tag-green { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
.tag-red   { background: #fef2f2; color: #991b1b; border-color: #fecaca; }

/* 可删除 */
.tag-remove {
  background: none; border: none; cursor: pointer;
  color: inherit; opacity: 0.6; padding: 0;
  line-height: 1; font-size: 14px;
}
.tag-remove:hover { opacity: 1; }

/* 可选 */
.tag-selectable { cursor: pointer; }
.tag-selectable:hover { background: #e5e7eb; }
.tag-selectable.active { background: #2563eb; color: white; border-color: #2563eb; }
```

## Tag输入框实现

```javascript
class TagInput {
  constructor(container) {
    this.container = container;
    this.tags = [];
    this.input = container.querySelector('input');
    this.input.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        this.addTag(this.input.value.trim());
        this.input.value = '';
      }
      if (e.key === 'Backspace' && !this.input.value) {
        this.removeTag(this.tags.length - 1);
      }
    });
  }
  
  addTag(text) {
    if (!text || this.tags.includes(text)) return;
    this.tags.push(text);
    this.render();
  }
  
  removeTag(index) {
    this.tags.splice(index, 1);
    this.render();
  }
  
  render() {
    // 重新渲染标签列表
  }
}
```

## 常见坑点

1. `white-space: nowrap` 防止标签文字换行
2. 标签输入框用 `,` 和 `Enter` 触发创建，符合用户习惯
3. 重复标签检测：`includes(text)` 前先 `toLowerCase()` 统一化

---

*本文组件收录于 [Web Component Dictionary v2.0](https://payhip.com/b/S9pj2)，83个实用组件，¥9.99即可获取全套。*

---

## Tag Component - The Visual Language of Content Categorization


> **Web Component Dictionary v2.0**  
> 83 components / 8 categories / bilingual / live preview / zero dependencies  
> [Live Demo](https://wdsega.github.io/web-components) | [Buy $1.38](https://payhip.com/b/S9pj2)



Tags vs Badges: Badges convey **status**, Tags convey **category**. Both small, different purpose.

### Three Forms

1. **Static tags**: read-only category labels
2. **Removable tags**: in input fields, with × button
3. **Selectable tags**: filter toggles with active state

### Tag Input UX

- Press `Enter` or `,` to create tag
- Press `Backspace` on empty input to remove last tag  
- Deduplicate with `toLowerCase()` comparison

*Part of [Web Component Dictionary v2.0](https://payhip.com/b/S9pj2)*
