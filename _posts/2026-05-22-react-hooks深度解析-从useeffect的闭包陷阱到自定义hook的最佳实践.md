---
title: "React Hooks深度解析：从useEffect的闭包陷阱到自定义Hook的最佳实践"
date: 2026-05-22
categories: [技术, 科普]
tags: "react, javascript, frontend, tutorial"
---

React Hooks已经发布5年多了，但我在Code Review中还是经常看到一些典型错误。今天我想深入聊聊几个最容易踩坑的地方，以及如何避免它们。

## useEffect的闭包陷阱

这是最常见的问题：

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1);  // 问题在这里
  }, 1000);
}, []);
```

这段代码只会从0增加到1，然后停止。

原因：useEffect的回调在组件挂载时执行，此时count的值是0。setInterval的回调形成了闭包，永远引用着count=0。

### 解决方案

1. 使用函数式更新：`setCount(prev => prev + 1)`
2. 正确设置依赖数组
3. 使用useRef（推荐）

## 自定义Hook的设计原则

好的自定义Hook应该：
- 返回对象而不是数组
- 提供手动执行方法
- 提供setData方法
- 使用useCallback缓存

## useMemo和useCallback的正确使用

记住一个原则：先测量，再优化。

简单计算不需要memo，只有真正昂贵的计算才需要。

---

*原文发表于 [WDSEGA Blog](https://wdsega.github.io/2025/05/22/react-hooks-deep-dive.html)*