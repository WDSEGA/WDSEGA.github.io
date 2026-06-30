---
layout: post
title: "c17-标签云组件 Tag Cloud | 用字体大小讲一个关于权重的故事"
date: 2026-06-30 08:10:00 +0800
categories: [组件, Web Component Dictionary]
tags: [tag-cloud, tags, navigation, css]
---

> **Web Component Dictionary v2.0 · 网页组件活字典**
> 83个组件 / 8大分类 / 中英双语 / 实时预览 / 单文件无依赖
> [在线体验](https://wdsega.github.io/web-components) | [购买 ¥9.99](https://payhip.com/b/S9pj2)


博客侧边栏最常见的组件：一堆关键字挤在一起，热门的大，冷门的小。这就是标签云。30行JS能让用户3秒内找到最受欢迎的内容方向。

## 组件是什么

Tag Cloud（标签云）是关键词的可视化集合，标签字号与其权重（热度/频次）成正比。常见场景：博客主题导航、技能标签、产品特性列表。

## HTML结构

```html
<div id="tag-cloud" class="tag-cloud">
  <!-- 标签由JS动态生成，字号根据权重变化 -->
</div>
```

## CSS核心

```css
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  align-items: center;
  padding: 30px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.tag-pill {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  color: #fff;
  cursor: pointer;
  transition: transform 0.2s;
  user-select: none;
}

.tag-pill:hover {
  transform: scale(1.1);
}
```

## JavaScript核心

```javascript
const tags = [
  { text: 'JavaScript', weight: 10 },
  { text: 'CSS', weight: 8 },
  { text: 'React', weight: 9 },
  { text: 'Python', weight: 6 },
  { text: 'Node.js', weight: 5 },
  { text: 'Frontend', weight: 8 },
  { text: 'Backend', weight: 6 },
  { text: 'Design', weight: 4 },
  { text: 'API', weight: 5 },
];

const colors = ['#e94560','#667eea','#2ed573','#ffa502','#764ba2','#3742fa'];
const cloud = document.getElementById('tag-cloud');

tags.forEach(tag => {
  const span = document.createElement('span');
  span.className = 'tag-pill';
  span.textContent = tag.text;
  
  // 字号：基础12px + 权重值
  span.style.fontSize = `${12 + tag.weight}px`;
  
  // 内边距也随权重微调
  span.style.padding = `${4 + tag.weight/2}px ${8 + tag.weight/2}px`;
  
  // 随机颜色
  span.style.background = colors[Math.floor(Math.random() * colors.length)];
  
  span.addEventListener('click', () => {
    console.log(`Clicked: ${tag.text}`);
    // 实际项目中跳转到对应标签页面
  });
  
  cloud.appendChild(span);
});
```

## 权重计算策略

实际项目中 `weight` 不是手写死的：

```javascript
// 从文章数据计算标签频次
const tagCounts = {};
allArticles.forEach(article => {
  article.tags.forEach(tag => {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  });
});

// 映射到字号范围（12px ~ 30px）
const maxCount = Math.max(...Object.values(tagCounts));
const minFontSize = 12;
const maxFontSize = 30;

const tags = Object.entries(tagCounts).map(([text, count]) => ({
  text,
  weight: Math.round((count / maxCount) * (maxFontSize - minFontSize))
}));
```

## 为什么不用 Canvas 渲染

Canvas标签云（如WP-Cumulus 3D球）看起来很炫，但有两个致命问题：
1. **可访问性**：屏幕阅读器读不到Canvas里的文字
2. **SEO**：搜索引擎无法抓取Canvas内容

用DOM+CSS Flex布局，标签是真实文本，无障碍友好且可被索引。

## 响应式优化

```css
@media (max-width: 480px) {
  .tag-cloud {
    gap: 6px;
    padding: 16px;
  }
  .tag-pill {
    font-size: 12px !important; /* 移动端统一缩小 */
  }
}
```

---

## Tag Cloud: Every Font Size Tells a Story About Weight

Blog sidebars always have that cluster of keywords — hot ones big, niche ones small. That's a tag cloud. 30 lines of JS lets users spot the most popular content in 3 seconds.

### What It Is

A visual collection of keywords where font size is proportional to frequency or importance. Product feature lists, blog navigation, skill showcases.

### Core Implementation

```javascript
const tags = [
  { text: 'JavaScript', weight: 10 },
  { text: 'CSS', weight: 8 },
  { text: 'React', weight: 9 },
];

tags.forEach(tag => {
  const span = document.createElement('span');
  span.textContent = tag.text;
  span.style.fontSize = `${12 + tag.weight}px`;
  span.style.padding = `${4 + tag.weight/2}px ${8 + tag.weight/2}px`;
  span.style.background = colors[Math.floor(Math.random() * colors.length)];
  span.className = 'tag-pill';
  cloud.appendChild(span);
});
```

### Weight Calculation

```javascript
const tagCounts = {};
allArticles.forEach(a => a.tags.forEach(t => {
  tagCounts[t] = (tagCounts[t] || 0) + 1;
}));
const maxCount = Math.max(...Object.values(tagCounts));
// Map to font size range: 12px ~ 30px
```

### Why Not Canvas
- **Accessibility**: Screen readers can't parse Canvas text
- **SEO**: Search engines can't index Canvas content

DOM + Flexbox keeps real text, accessible and indexable.

---

*本文是 Web Component Dictionary 组件介绍系列第17篇。查看全部83个组件：[在线体验](https://wdsega.github.io/web-components)*
