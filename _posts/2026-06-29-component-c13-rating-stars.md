---
layout: post
title: "c13-星级评分组件 Rating Stars | 五颗星背后的CSS变魔术"
date: 2026-06-29 08:00:00 +0800
categories: [组件, Web Component Dictionary]
tags: [rating-stars, css, web-components, ux]
---

> **Web Component Dictionary v2.0 · 网页组件活字典**
> 83个组件 / 8大分类 / 中英双语 / 实时预览 / 单文件无依赖
> [在线体验](https://wdsega.github.io/web-components) | [购买 ¥9.99](https://payhip.com/b/S9pj2)


"这家餐厅几颗星？"——评分是用户最直觉的表达方式。一套能点击、能悬停、能只读的星级评分组件，CSS就能搞定80%。

## 组件是什么

Rating Stars（星级评分）让用户用1-5颗星快速表达满意度。常见场景：电商评价、内容评分、满意度调查。

## 效果预览

```
☆ ☆ ☆ ☆ ☆  →  鼠标悬停到第3颗  →  ★ ★ ★ ☆ ☆
                 点击确认              ★ ★ ★ ☆ ☆（已选中）
```

## 代码拆解

### HTML结构
```html
<div class="ef-rating" data-rating="0" role="radiogroup" aria-label="星级评分">
  <span class="ef-star" data-value="1" role="radio" aria-label="1星" tabindex="0">★</span>
  <span class="ef-star" data-value="2" role="radio" aria-label="2星" tabindex="0">★</span>
  <span class="ef-star" data-value="3" role="radio" aria-label="3星" tabindex="0">★</span>
  <span class="ef-star" data-value="4" role="radio" aria-label="4星" tabindex="0">★</span>
  <span class="ef-star" data-value="5" role="radio" aria-label="5星" tabindex="0">★</span>
  <span class="ef-rating-text">点击评分</span>
</div>
```

### CSS核心
```css
.ef-rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}

.ef-star {
  font-size: 28px;
  color: #d1d5db;
  cursor: pointer;
  transition: color 0.15s, transform 0.1s;
  line-height: 1;
}

/* 悬停+选中 = 黄色 */
.ef-star.hovered,
.ef-star.selected {
  color: #f59e0b;
}

.ef-star:hover {
  transform: scale(1.2);
}

.ef-rating-text {
  font-size: 14px;
  color: #6b7280;
  margin-left: 8px;
}
```

### JS交互
```javascript
document.querySelectorAll('.ef-rating').forEach(ratingEl => {
  const stars = ratingEl.querySelectorAll('.ef-star');
  const text = ratingEl.querySelector('.ef-rating-text');
  const labels = ['', '非常差', '较差', '一般', '较好', '非常好'];
  let currentRating = parseInt(ratingEl.dataset.rating) || 0;

  function updateDisplay(hoverVal, selectedVal) {
    stars.forEach((star, i) => {
      const val = i + 1;
      star.classList.toggle('hovered', hoverVal > 0 && val <= hoverVal);
      star.classList.toggle('selected', hoverVal === 0 && val <= selectedVal);
    });
    if (hoverVal > 0) {
      text.textContent = labels[hoverVal];
    } else if (selectedVal > 0) {
      text.textContent = `已选 ${selectedVal} 星 · ${labels[selectedVal]}`;
    } else {
      text.textContent = '点击评分';
    }
  }

  stars.forEach((star, i) => {
    const val = i + 1;
    star.addEventListener('mouseenter', () => updateDisplay(val, currentRating));
    star.addEventListener('mouseleave', () => updateDisplay(0, currentRating));
    star.addEventListener('click', () => {
      currentRating = val;
      ratingEl.dataset.rating = val;
      updateDisplay(0, currentRating);
      ratingEl.dispatchEvent(new CustomEvent('rating-change', { detail: { value: val } }));
    });
    // 键盘支持
    star.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        currentRating = val;
        updateDisplay(0, currentRating);
      }
    });
  });

  updateDisplay(0, currentRating);
});
```

## 关键技术点

1. **CSS变量驱动**：颜色只改两个变量，主题切换秒完成
2. **`user-select: none`**：防止鼠标拖动时选中文字，体验更流畅
3. **RTL兼容**：阿拉伯/希伯来语布局需要反向排列，加 `direction: rtl` 即可
4. **只读模式**：去掉JS，加 `.readonly` 类，用 CSS `pointer-events: none` 屏蔽交互

## 常见坑点

- ❌ 用`<input type="radio">`实现，纯CSS原生方案，但样式极难控制
- ❌ 悬停判断用JS计算坐标，不如直接 `mouseenter` 每颗星独立监听
- ✅ 用 `data-rating` 存当前值，方便表单提交读取

## 完整可复制代码

```html
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>Rating Stars Demo</title>
<style>
.ef-rating { display: inline-flex; align-items: center; gap: 4px; user-select: none; }
.ef-star { font-size: 28px; color: #d1d5db; cursor: pointer; transition: color .15s, transform .1s; line-height: 1; }
.ef-star.hovered, .ef-star.selected { color: #f59e0b; }
.ef-star:hover { transform: scale(1.2); }
.ef-rating-text { font-size: 14px; color: #6b7280; margin-left: 8px; }
body { font-family: sans-serif; padding: 2rem; }
</style>
</head>
<body>
<div class="ef-rating" data-rating="0">
  <span class="ef-star" data-value="1" tabindex="0">★</span>
  <span class="ef-star" data-value="2" tabindex="0">★</span>
  <span class="ef-star" data-value="3" tabindex="0">★</span>
  <span class="ef-star" data-value="4" tabindex="0">★</span>
  <span class="ef-star" data-value="5" tabindex="0">★</span>
  <span class="ef-rating-text">点击评分</span>
</div>
<script>
document.querySelectorAll('.ef-rating').forEach(ratingEl => {
  const stars = ratingEl.querySelectorAll('.ef-star');
  const text = ratingEl.querySelector('.ef-rating-text');
  const labels = ['', '非常差', '较差', '一般', '较好', '非常好'];
  let cur = 0;
  function upd(h, s) {
    stars.forEach((st, i) => {
      st.classList.toggle('hovered', h > 0 && i+1 <= h);
      st.classList.toggle('selected', h === 0 && i+1 <= s);
    });
    text.textContent = h > 0 ? labels[h] : (s > 0 ? `已选 ${s} 星 · ${labels[s]}` : '点击评分');
  }
  stars.forEach((st, i) => {
    st.addEventListener('mouseenter', () => upd(i+1, cur));
    st.addEventListener('mouseleave', () => upd(0, cur));
    st.addEventListener('click', () => { cur = i+1; upd(0, cur); });
  });
  upd(0, cur);
});
</script>
</body>
</html>
```

## 变体拓展

- **半星评分**：监听 `mousemove`，判断鼠标在星左半还是右半
- **数字显示**：在 `★★★☆☆` 旁边显示 `(3.5 / 5.0, 共128条)`
- **颜色主题**：爱心型（❤）、圆圈型（●）、钻石型（◆），图标随意换

---

*Web Component Dictionary v2.0 — 下一篇：c14 FAB浮动操作按钮*
*[在线体验完整字典 →](https://wdsega.github.io/web-components)*

---

## Rating Stars Component: The CSS Color-Changing Magic Behind Five Stars

> **Web Component Dictionary v2.0** · 83 Components / 8 Categories / Bilingual / Live Preview / Zero Dependencies
> [Live Demo](https://wdsega.github.io/web-components) | [Buy ¥9.99](https://payhip.com/b/S9pj2)

"How many stars?" — Rating is the most intuitive way users express satisfaction. A clickable, hoverable, read-only star rating component? CSS handles 80% of it.

### Core CSS Trick

The hover-highlight trick uses `mouseenter` per star and toggles a `.hovered` class. No coordinate math needed. The `user-select: none` prevents text selection on drag.

```css
.ef-star.hovered, .ef-star.selected { color: #f59e0b; }
.ef-star:hover { transform: scale(1.2); }
```

### Key Pitfalls
- Don't use `<input type="radio">` — native CSS styling is a nightmare
- Store current rating in `data-rating` for easy form submission
- Add keyboard support (`Enter`/`Space`) for accessibility

[Full code + live demo →](https://wdsega.github.io/web-components)
