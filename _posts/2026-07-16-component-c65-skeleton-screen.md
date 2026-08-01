---
title: "组件c65：加载骨架屏 | Component c65: Skeleton Screen"
layout: post
date: 2026-07-16
categories: [组件, 前端]
tags: [css, skeleton, loading, animation]
---

> 用户最怕的不是慢，是白屏——骨架屏用灰色占位块告诉他们"内容正在来"，比转圈圈强十倍。

## 这是什么

加载骨架屏（Skeleton Screen）用灰色色块模拟即将加载的内容布局（头像、标题、段落），配合shimmer微光动画，在数据返回前提供视觉占位。它比loading spinner更有效，因为它提前展示了内容结构，降低用户的感知等待时间。

## 效果预览

```
[加载中]  (○)  ████████░░░░░░  ← shimmer微光从左到右流动
               ████░░░░░░░░░░

[加载完成] (头像)  张三的动态标题
                  一行简短描述文字...
```

## 代码拆解

### HTML

```html
<div style="max-width:500px;margin:40px auto;padding:20px">
  <!-- 头像 + 标题行 -->
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
    <div style="width:48px;height:48px;border-radius:50%;
      background:linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%);
      background-size:200% 100%;animation:skel 1.5s infinite;flex-shrink:0"></div>
    <div style="flex:1">
      <div style="height:14px;
        background:linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%);
        background-size:200% 100%;animation:skel 1.5s infinite;
        margin-bottom:8px;border-radius:4px"></div>
      <div style="height:12px;width:60%;
        background:linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%);
        background-size:200% 100%;animation:skel 1.5s infinite 0.2s;
        border-radius:4px"></div>
    </div>
  </div>
  <!-- 内容行 -->
  <div style="height:20px;margin-bottom:14px;
    background:linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%);
    background-size:200% 100%;animation:skel 1.5s infinite 0.4s;
    border-radius:4px"></div>
</div>
```

### CSS

```css
/* shimmer微光动画核心 */
@keyframes skel {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 骨架块基础样式 */
.skel-block {
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
  background-size: 200% 100%;
  animation: skel 1.5s infinite;
  border-radius: 4px;
}

/* 用animation-delay错开各块，避免整齐划一 */
.skel-title  { animation-delay: 0s; }
.skel-sub    { animation-delay: 0.2s; }
.skel-body   { animation-delay: 0.4s; }
```

### JavaScript

```javascript
// 模拟数据加载后替换骨架屏
function loadContent() {
  const skeleton = document.getElementById('skeleton');
  const content = document.getElementById('content');

  fetch('/api/user-profile')
    .then(r => r.json())
    .then(data => {
      skeleton.style.display = 'none';
      content.innerHTML = `
        <div style="display:flex;align-items:center;gap:14px">
          <img src="${data.avatar}" style="width:48px;height:48px;border-radius:50%">
          <div>
            <h3 style="margin:0 0 8px">${data.name}</h3>
            <p style="margin:0;color:#999">${data.bio}</p>
          </div>
        </div>
        <p style="margin-top:14px">${data.latestPost}</p>
      `;
      content.style.display = 'block';
    });
}
```

## 关键技术点

1. **三段式渐变制造微光**：`linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%)` 中间亮两头暗，配合`background-position`移动产生shimmer流动效果
2. **background-size:200%**：渐变宽度设为元素的2倍，让流动有足够的位移空间，避免颜色突变
3. **animation-delay错开**：各骨架块延迟0s/0.2s/0.4s，微光波浪式扫过，比同时闪烁自然得多
4. **flex布局模拟真实结构**：骨架屏的尺寸和布局必须与最终内容一致，否则替换时布局跳动（CLS）

## 常见坑点

- **骨架与内容尺寸不匹配**：骨架头像40px，真实头像48px，替换时页面跳动。两者必须严格一致
- **shimmer方向错误**：`background-position`从`200%`到`-200%`是左到右流动。反了会变成右到左，不符合阅读习惯
- **忘记移除animation**：内容替换后骨架块还在DOM中animation继续跑，浪费GPU。用`display:none`或直接移除
- **圆角不一致**：骨架块`border-radius:4px`，真实内容`border-radius:8px`，视觉跳变。所有圆角必须匹配

## 变体拓展

- **脉冲式骨架**：不用shimmer，用`opacity: 0.5 → 1`脉冲闪烁，适合深色主题
- **波形shimmer**：用`cubic-bezier`缓动函数让微光速度不均匀，更像水面反光
- **内容渐入**：骨架消失时真实内容用`opacity:0→1`+`translateY(10px→0)`渐入，过渡更柔和
- **多级骨架**：先显示粗粒度骨架（只有大块），数据部分到达后显示细粒度骨架，渐进式揭示
- **骨架+错误态**：加载失败时骨架变成错误提示，用`@keyframes`做颜色从灰到红的过渡

---

A skeleton screen uses gray blocks to mimic the layout of upcoming content (avatars, titles, paragraphs) with a shimmer animation. It's more effective than a spinner because it previews content structure, reducing perceived wait time.

**Key implementation**: Three-stop gradient `linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%)` creates the shimmer. Set `background-size: 200%` for enough displacement. Use `animation-delay` (0s/0.2s/0.4s) to stagger blocks into a wave. Skeleton dimensions must match final content exactly to prevent layout shift (CLS).

**Common pitfalls**: Size mismatch between skeleton and content causes visual jumps. Shimmer must flow left-to-right (matching reading direction). Remove animation after content swap. Match all border-radius values.

**Variants**: Pulse animation for dark themes, wave shimmer with cubic-bezier, content fade-in transition, progressive skeleton reveal, skeleton-to-error state.

*Full copy-paste code available above. Questions? Leave a comment.*
