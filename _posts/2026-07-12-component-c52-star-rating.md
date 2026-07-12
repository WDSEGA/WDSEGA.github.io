---
title: "组件详解#52：星级评分，纯CSS实现hover预览与键盘可访问 | Component Deep Dive #52: Star Rating — Pure CSS Hover Preview and Keyboard Accessibility"
date: 2026-07-12
categories: [组件详解]
tags: [webdev, javascript, ui, css]
excerpt: "星级评分组件看似简单，但要做好hover预览、键盘操作和ARIA标签却需要不少技巧。本文用纯CSS实现hover预览，用少量JS处理键盘和触摸。"
---

## 组件详解#52：星级评分，纯CSS实现hover预览与键盘可访问

星级评分是电商、应用商店和评论系统中最常见的反馈组件。看似只需要5个星星图标，但真正做好hover预览、点击锁定、键盘可访问和半星精度，需要不少技巧。

### 组件是什么

星级评分组件允许用户通过点击星星来给出1-5星的评分。核心交互包括：

- **hover预览**：鼠标悬停时实时显示将要给出的评分
- **点击锁定**：点击后固定评分，鼠标移出不再变化
- **键盘可访问**：方向键调整，Enter确认
- **只读模式**：展示已有评分，不允许修改

### 效果预览

```html
<!-- 基础HTML结构 -->
<div class="star-rating" id="rating">
  <input type="radio" name="rating" id="r5" value="5">
  <label for="r5">★</label>
  <input type="radio" name="rating" id="r4" value="4">
  <label for="r4">★</label>
  <input type="radio" name="rating" id="r3" value="3">
  <label for="r3">★</label>
  <input type="radio" name="rating" id="r2" value="2">
  <label for="r2">★</label>
  <input type="radio" name="rating" id="r1" value="1">
  <label for="r1">★</label>
</div>
```

### 代码拆解

#### CSS：纯CSS实现hover预览

```css
.star-rating {
  display: inline-flex;
  flex-direction: row-reverse; /* 关键：反转顺序实现hover级联 */
  font-size: 2rem;
  gap: 4px;
}

.star-rating input {
  display: none; /* 隐藏radio按钮 */
}

.star-rating label {
  color: #ddd;
  cursor: pointer;
  transition: color 0.15s;
  user-select: none;
}

/* hover时：当前星及之前的星变金 */
.star-rating label:hover,
.star-rating label:hover ~ label {
  color: #ffc107;
}

/* 选中时：当前星及之前的星保持金色 */
.star-rating input:checked ~ label {
  color: #ffc107;
}

/* hover优先于选中状态 */
.star-rating label:hover ~ label,
.star-rating input:checked ~ label {
  color: #ffc107;
}
```

**关键技巧**：`flex-direction: row-reverse` 让HTML中5→1排列的星星在视觉上变为1→5。这样CSS的`~`兄弟选择器（向后选择）就变成了"向左选择"，正好实现hover一颗星时它左边所有星都变色。

#### JS：键盘和半星支持

```javascript
const rating = document.getElementById('rating');
const inputs = rating.querySelectorAll('input');
let currentValue = 0;

// 键盘支持
rating.setAttribute('tabindex', '0');
rating.setAttribute('role', 'slider');
rating.setAttribute('aria-valuemin', '0');
rating.setAttribute('aria-valuemax', '5');
rating.setAttribute('aria-valuenow', '0');
rating.setAttribute('aria-label', '评分');

rating.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    e.preventDefault();
    currentValue = Math.min(5, currentValue + 1);
    updateRating(currentValue);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    e.preventDefault();
    currentValue = Math.max(0, currentValue - 1);
    updateRating(currentValue);
  }
});

function updateRating(val) {
  inputs.forEach(input => {
    input.checked = parseInt(input.value) === val;
  });
  rating.setAttribute('aria-valuenow', val);
  rating.dispatchEvent(new Event('change'));
}

// 点击锁定
inputs.forEach(input => {
  input.addEventListener('change', () => {
    currentValue = parseInt(input.value);
    console.log('评分:', currentValue);
  });
});
```

### 关键技术点

1. **row-reverse + ~选择器**：CSS实现hover级联的核心技巧，无需JS
2. **radio语义**：使用`input[type=radio]`天然支持单选语义和表单提交
3. **ARIA角色**：`role="slider"`让屏幕阅读器识别为可调节控件
4. **transition**：`color 0.15s`让hover有微妙的渐变效果

### 常见坑点

1. **忘记row-reverse**：不用`row-reverse`的话，`~`选择器只能选后面的元素，hover第3颗星时1-2不会变色
2. **移动端hover问题**：触摸设备没有hover，需要用touchstart模拟或直接用tap
3. **半星精度**：如果需要半星（3.5星），纯CSS方案不够用，需要JS计算鼠标在星星左半还是右半
4. **只读模式**：去掉`cursor:pointer`和hover效果，设置`pointer-events:none`

### 完整可复制代码

```html
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Star Rating</title>
<style>
  .star-rating {
    display: inline-flex;
    flex-direction: row-reverse;
    font-size: 2rem;
    gap: 4px;
  }
  .star-rating input { display: none; }
  .star-rating label {
    color: #ddd;
    cursor: pointer;
    transition: color 0.15s;
    user-select: none;
  }
  .star-rating label:hover,
  .star-rating label:hover ~ label { color: #ffc107; }
  .star-rating input:checked ~ label { color: #ffc107; }
  .star-rating.readonly label { cursor: default; pointer-events: none; }
  .star-rating.readonly input:checked ~ label { color: #ffc107; }
</style>
</head>
<body>
  <div class="star-rating" id="rating">
    <input type="radio" name="rating" id="r5" value="5">
    <label for="r5">&#9733;</label>
    <input type="radio" name="rating" id="r4" value="4">
    <label for="r4">&#9733;</label>
    <input type="radio" name="rating" id="r3" value="3">
    <label for="r3">&#9733;</label>
    <input type="radio" name="rating" id="r2" value="2">
    <label for="r2">&#9733;</label>
    <input type="radio" name="rating" id="r1" value="1">
    <label for="r1">&#9733;</label>
  </div>
  <p>当前评分: <span id="score">0</span></p>
  <script>
    const rating = document.getElementById('rating');
    const score = document.getElementById('score');
    let currentValue = 0;
    rating.setAttribute('tabindex', '0');
    rating.setAttribute('role', 'slider');
    rating.setAttribute('aria-valuemin', '0');
    rating.setAttribute('aria-valuemax', '5');
    rating.setAttribute('aria-valuenow', '0');
    rating.setAttribute('aria-label', '评分');
    rating.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        currentValue = Math.min(5, currentValue + 1);
        updateRating(currentValue);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        currentValue = Math.max(0, currentValue - 1);
        updateRating(currentValue);
      }
    });
    function updateRating(val) {
      rating.querySelectorAll('input').forEach(input => {
        input.checked = parseInt(input.value) === val;
      });
      rating.setAttribute('aria-valuenow', val);
      score.textContent = val;
    }
    rating.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        currentValue = parseInt(input.value);
        score.textContent = currentValue;
      });
    });
  </script>
</body>
</html>
```

### 变体拓展

- **半星精度**：监听mousemove，计算offsetX < clientWidth/2则为半星
- **动画效果**：点击时添加bounce动画（`@keyframes pop { 50% { transform: scale(1.3); } }`）
- **SVG星星**：用SVG代替Unicode字符，支持渐变填充和描边
- **评分分布**：电商常见的"5星80%、4星15%"分布条，用CSS `width` 百分比实现

---

### Component Deep Dive #52: Star Rating — Pure CSS Hover Preview and Keyboard Accessibility

Star rating seems trivial—just five star icons—but doing hover preview, click-lock, keyboard accessibility, and half-star precision right requires real technique.

**Core trick**: `flex-direction: row-reverse` + `~` sibling selector enables pure-CSS hover cascading. HTML lists stars 5→1, CSS reverses to 1→5 visually, so `~` (which selects forward in DOM) effectively selects "all stars to the left" when hovering.

**Keyboard**: `role="slider"` with Arrow keys adjusts value, Enter to confirm. `aria-valuenow` keeps screen readers informed.

**Pitfalls**: Mobile devices have no hover (use touchstart); half-star precision needs JS mousemove; read-only mode needs `pointer-events: none`.

*More components at 无人日报 | Deskless Daily.*
