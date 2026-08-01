---
title: "组件c68：开关切换 | Component c68: Toggle Switch"
layout: post
date: 2026-08-01
categories: [组件, 前端]
tags: [css, javascript, toggle, form]
---

> 复选框太"表单"，开关更像家里的灯——拨一下，状态变了。iOS风格的开关切换是设置页标配。

## 这是什么

开关切换（Toggle Switch）是iOS风格的二态控制器，用滑块在轨道上左右移动来表示开/关。与复选框不同，它强调"立即生效"——用户拨动开关的瞬间设置就变了，不需要点击"保存"。适合通知、主题、权限等即时生效的设置项。

## 效果预览

```
[关]  (○────)  灰色轨道，圆圈在左
  ↓ 用户点击
[开]  (────●)  红/绿轨道，圆圈在右
```

## 代码拆解

### HTML

```html
<div style="padding:40px">
  <div style="display:flex;align-items:center;justify-content:space-between;
    padding:14px 0;border-bottom:1px solid #eee">
    <span style="color:#333;font-size:14px">Notifications</span>
    <div id="tog1" style="width:52px;height:28px;border-radius:14px;
      background:#ccc;cursor:pointer;position:relative;
      transition:background 0.3s" onclick="toggleSw(this)">
      <div style="position:absolute;top:2px;left:2px;width:24px;
        height:24px;border-radius:50%;background:#fff;
        box-shadow:0 2px 4px rgba(0,0,0,0.2);
        transition:left 0.3s"></div>
    </div>
  </div>
</div>
```

### CSS

```css
/* 轨道 */
.toggle-track {
  width: 52px; height: 28px;
  border-radius: 14px;
  background: #ccc;
  cursor: pointer;
  position: relative;
  transition: background 0.3s;
}

.toggle-track.active {
  background: #e94560;
}

/* 圆块 */
.toggle-thumb {
  position: absolute;
  top: 2px; left: 2px;
  width: 24px; height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: left 0.3s;
}

.toggle-track.active .toggle-thumb {
  left: 26px;
}

/* 纯CSS方案：用checkbox隐藏 + label */
.toggle-css {
  display: none;
}
.toggle-css + label {
  width: 52px; height: 28px;
  border-radius: 14px;
  background: #ccc;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}
.toggle-css + label::after {
  content: '';
  position: absolute;
  top: 2px; left: 2px;
  width: 24px; height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: left 0.3s;
}
.toggle-css:checked + label {
  background: #e94560;
}
.toggle-css:checked + label::after {
  left: 26px;
}
```

### JavaScript

```javascript
// JS方案
function toggleSw(el) {
  var on = el.classList.contains('active') ||
    el.style.background === 'rgb(233, 69, 96)';

  el.classList.toggle('active');
  el.style.background = on ? '#ccc' : '#e94560';
  var thumb = el.querySelector('div');
  thumb.style.left = on ? '2px' : '26px';

  // 触发回调
  var eventName = on ? 'toggle-off' : 'toggle-on';
  el.dispatchEvent(new CustomEvent(eventName, { bubbles: true }));
}

// 事件监听版本
document.querySelectorAll('.toggle-track').forEach(function(t) {
  t.addEventListener('click', function() {
    toggleSw(this);
    var isOn = this.classList.contains('active');
    console.log('Toggle state:', isOn);
    // 在这里调用API保存设置
  });
});

// 纯CSS方案（无JS）
// <input type="checkbox" class="toggle-css" id="t1">
// <label for="t1"></label>
```

## 关键技术点

1. **left属性而非transform**：圆块用`left`定位切换，配合`transition: left 0.3s`实现滑动动画。也可用`transform: translateX(24px)`，性能更好
2. **box-shadow增加质感**：圆块加`box-shadow: 0 2px 4px rgba(0,0,0,0.2)`让它有"浮在轨道上"的立体感
3. **纯CSS方案**：用`<input type="checkbox">`+`<label>`+`:checked`伪类，零JS实现，可访问性更好
4. **transition而非animation**：0.3秒transition是最佳时长——太短像闪烁，太长像延迟

## 常见坑点

- **忘了transition**：没有`transition: left 0.3s`，圆块瞬移，像没有动画的checkbox
- **圆块超出轨道**：轨道宽52px，圆块24px，left最大值应为`52-24-2=26px`。算错会溢出
- **可访问性缺失**：JS方案没有`role="switch"`和`aria-checked`，屏幕阅读器无法识别。纯CSS方案的checkbox天然有
- **内联style判断状态**：用`el.style.background === 'rgb(233, 69, 96)'`判断状态不可靠，浏览器颜色格式不一致。应用class

## 变体拓展

- **带文字开关**：轨道上显示ON/OFF文字，圆块滑动时文字交替显示
- **三态开关**：左/中/右三个位置，适合"关闭/自动/常开"模式
- **方形开关**：`border-radius: 4px`，适合Material Design风格
- **彩色状态**：开=绿色（成功）、关=灰色（中性）、警告=橙色（异常）
- **开关组**：多个开关联动，如"全选/全不选"控制子项

---

A toggle switch is an iOS-style binary controller where a thumb slides left/right on a track. Unlike checkboxes, it emphasizes immediate effect — settings change the moment you flip it. Perfect for notifications, themes, and permissions.

**Key implementation**: Slide the thumb via `left` property + `transition: 0.3s`. Add `box-shadow` for depth. Pure CSS version using `:checked` pseudo-class has better accessibility. Use class toggles, not inline style checks, for state.

**Common pitfalls**: Missing `transition` = instant jump. Wrong max `left` value = thumb overflows. Missing `role="switch"` for screen readers. Using `style.background` string comparison for state (unreliable).

**Variants**: ON/OFF text labels, three-position switch, square Material style, color-coded states, linked toggle groups.

*Full copy-paste code available above. Questions? Leave a comment.*
