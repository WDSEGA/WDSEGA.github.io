---
title: "组件详解#54：瀑布流布局，CSS columns三行代码 vs JS精准定位 | Component Deep Dive #54: Masonry Layout — CSS Columns in 3 Lines vs JS Pinpoint Positioning"
date: 2026-07-12
categories: [组件详解]
tags: [webdev, css, layout, masonry]
excerpt: "瀑布流布局是图片社区的标配。CSS columns三行搞定但列序从上到下，JS绝对定位精准但需计算。本文对比两种方案并给出完整实现。"
---

## 组件详解#54：瀑布流布局，CSS columns三行代码 vs JS精准定位

瀑布流（Masonry Layout）是Pinterest开创的布局方式，不等高卡片按列排列，紧密填满空间。图片社区、电商商品页、设计灵感站都在用。实现方式有两种：CSS columns（简单但列序不理想）和JS绝对定位（精准但需计算）。

### 组件是什么

瀑布流布局的核心特征：

- **不等高卡片**：每张卡片高度不同，按内容自适应
- **列排列**：卡片从左到右排列，每列内从上到下
- **紧密填充**：列内卡片紧密排列，无额外间隙
- **响应式**：屏幕变窄时列数减少

### 方案一：CSS columns（3行代码）

```css
.masonry {
  column-count: 3;        /* 3列 */
  column-gap: 16px;       /* 列间距 */
}
.masonry-item {
  break-inside: avoid;    /* 防止卡片被分断到两列 */
  margin-bottom: 16px;
}
```

**优点**：代码极简，纯CSS，浏览器原生支持
**缺点**：卡片排列顺序是**从上到下再从左到右**（第1张在第1列顶部，第2张在第1列第二行...），而不是用户期望的**从左到右再从上到下**（第1张在第1列顶部，第2张在第2列顶部）

### 方案二：JS绝对定位（精准控制）

```javascript
class Masonry {
  constructor(container, options = {}) {
    this.container = container;
    this.columns = options.columns || 3;
    this.gap = options.gap || 16;
    this.items = [];
    this.columnHeights = [];
    this.resizeObserver = new ResizeObserver(() => this.layout());
  }
  
  init() {
    this.container.style.position = 'relative';
    this.resizeObserver.observe(this.container);
    this.layout();
  }
  
  layout() {
    const containerWidth = this.container.clientWidth;
    const itemWidth = (containerWidth - this.gap * (this.columns - 1)) / this.columns;
    
    this.columnHeights = new Array(this.columns).fill(0);
    
    this.items.forEach(item => {
      // 找到最短列
      const shortestCol = this.columnHeights.indexOf(Math.min(...this.columnHeights));
      
      // 定位
      item.style.position = 'absolute';
      item.style.width = `${itemWidth}px`;
      item.style.left = `${shortestCol * (itemWidth + this.gap)}px`;
      item.style.top = `${this.columnHeights[shortestCol]}px`;
      
      // 更新列高
      this.columnHeights[shortestCol] += item.offsetHeight + this.gap;
    });
    
    // 设置容器高度
    this.container.style.height = `${Math.max(...this.columnHeights)}px`;
  }
  
  add(item) {
    this.items.push(item);
    this.container.appendChild(item);
    this.layout();
  }
}
```

**核心算法**：每次将新卡片放入**最短的列**，这样所有列的高度趋于均衡。

### 完整可复制代码

```html
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Masonry Layout</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: sans-serif; padding: 20px; background: #f0f0f0; }
  
  #masonry {
    position: relative;
    max-width: 900px;
    margin: 0 auto;
  }
  
  .masonry-item {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 16px;
  }
  
  .masonry-item img {
    width: 100%;
    display: block;
  }
  
  .masonry-item .desc {
    padding: 12px;
    font-size: 14px;
    color: #555;
  }
  
  @media (max-width: 768px) {
    #masonry { columns-adjust: 2; }
  }
</style>
</head>
<body>
  <div id="masonry"></div>
  <script>
    class Masonry {
      constructor(container, options = {}) {
        this.container = container;
        this.gap = options.gap || 16;
        this.items = [];
        this.resizeObserver = new ResizeObserver(() => this.layout());
        window.addEventListener('resize', () => this.layout());
      }
      
      get columns() {
        const w = window.innerWidth;
        if (w < 600) return 1;
        if (w < 900) return 2;
        return 3;
      }
      
      init() {
        this.container.style.position = 'relative';
        this.layout();
      }
      
      layout() {
        const cols = this.columns;
        const containerWidth = this.container.clientWidth;
        const itemWidth = (containerWidth - this.gap * (cols - 1)) / cols;
        const heights = new Array(cols).fill(0);
        
        this.items.forEach(item => {
          const shortest = heights.indexOf(Math.min(...heights));
          item.style.position = 'absolute';
          item.style.width = itemWidth + 'px';
          item.style.left = shortest * (itemWidth + this.gap) + 'px';
          item.style.top = heights[shortest] + 'px';
          heights[shortest] += item.offsetHeight + this.gap;
        });
        
        this.container.style.height = Math.max(...heights) + 'px';
      }
      
      add(content) {
        const item = document.createElement('div');
        item.className = 'masonry-item';
        item.innerHTML = content;
        this.container.appendChild(item);
        this.items.push(item);
        
        const imgs = item.querySelectorAll('img');
        if (imgs.length > 0) {
          imgs[0].onload = () => this.layout();
        } else {
          this.layout();
        }
      }
    }
    
    const masonry = new Masonry(document.getElementById('masonry'), { gap: 16 });
    masonry.init();
    
    const heights = [180, 240, 150, 300, 200, 160, 280, 120, 220];
    const colors = ['#ff6b6b','#4ecdc4','#45b7d1','#f9ca24','#6c5ce7','#a29bfe','#fd79a8','#fdcb6e','#00b894'];
    
    for (let i = 0; i < 9; i++) {
      masonry.add(`<div style="height:${heights[i]}px;background:${colors[i]};display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:bold;">${i+1}</div><div class="desc">Card ${i+1}</div>`);
    }
  </script>
</body>
</html>
```

### 关键技术点

1. **最短列优先**：每次放入最短列，保证整体高度均衡
2. **ResizeObserver**：监听容器尺寸变化，自动重新布局
3. **图片加载**：图片加载完成后再layout，否则高度计算错误
4. **响应式列数**：根据`window.innerWidth`动态调整列数

### 常见坑点

1. **图片未加载就layout**：图片高度为0导致卡片重叠，必须在`img.onload`后重新布局
2. **ResizeObserver循环**：layout改变了容器高度可能再次触发ResizeObserver，需加防抖
3. **columns方案顺序问题**：CSS columns的顺序是列优先（先填满第一列再第二列），不符合用户阅读习惯
4. **滚动性能**：大量卡片时用`content-visibility: auto`优化滚动渲染

### 变体拓展

- **CSS Grid Masonry**：Firefox已支持`grid-template-rows: masonry`，Chrome跟进中
- **无限滚动**：滚动到底部时`fetch`更多数据，`masonry.add()`追加
- **过滤动画**：过滤卡片时用FLIP动画重新排列
- **拖拽排序**：配合HTML5 Drag API实现卡片拖拽重排

---

### Component Deep Dive #54: Masonry Layout — CSS Columns in 3 Lines vs JS Pinpoint Positioning

Masonry layout (Pinterest-style) arranges unequal-height cards in columns, tightly filling space. Two approaches:

**CSS columns** (3 lines): `column-count: 3; column-gap: 16px;` + `break-inside: avoid`. Dead simple but cards flow top-to-bottom per column, not left-to-right as users expect.

**JS absolute positioning**: Track each column's height, place each card in the shortest column, update heights. Use `ResizeObserver` for responsive relayout, and always relayout after `img.onload` to avoid overlapping from zero-height images.

**CSS Grid Masonry** (`grid-template-rows: masonry`) is coming to Firefox and Chrome, but for production today, JS positioning remains the reliable choice.

*More components at 无人日报 | Deskless Daily.*
