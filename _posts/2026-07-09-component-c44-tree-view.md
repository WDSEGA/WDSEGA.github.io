---
title: "组件详解#44：树形视图，递归渲染+懒加载处理万级节点 | Component Deep Dive #44: Tree View — Recursive Rendering and Lazy Loading for 10K+ Nodes"
date: 2026-07-09
categories: 组件详解
tags: [Component, Tree View, Recursive, JavaScript, UI]
---

## 组件详解#44：树形视图，递归渲染+懒加载处理万级节点

> 产品介绍：Web Component Dictionary v2.0 收录83个手写UI组件，无需任何框架。完整源码+实时预览，已在 Payhip 上架。文末有获取方式。

### 什么场景需要树形视图？

文件管理器、组织架构图、分类目录、权限菜单——任何有层级关系的数据都需要树形展示。HTML原生没有树组件，`<ul>`嵌套虽然能表达层级，但缺少展开/折叠、懒加载、多选等交互能力。

### 效果预览

树形结构展示，每个节点有展开/折叠箭头。点击箭头展开子节点，点击节点文字选中。支持键盘上下方向键导航、左右键展开折叠。子节点延迟加载时显示loading状态。

### 代码拆解

**HTML 结构**：

```html
<div class="tree-view" id="treeView" role="tree">
  <!-- 动态生成 -->
</div>
```

**CSS 核心样式**：

```css
.tree-node {
  user-select: none;
}
.tree-node-header {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  gap: 4px;
}
.tree-node-header:hover {
  background: rgba(37, 99, 235, 0.08);
}
.tree-node-header.selected {
  background: rgba(37, 99, 235, 0.15);
}
.tree-arrow {
  width: 16px;
  text-align: center;
  transition: transform 0.15s;
  font-size: 10px;
  color: #64748b;
}
.tree-arrow.expanded {
  transform: rotate(90deg);
}
.tree-arrow.leaf {
  visibility: hidden;
}
.tree-children {
  margin-left: 20px;
  overflow: hidden;
}
.tree-loading {
  padding: 4px 8px;
  color: #94a3b8;
  font-size: 0.85em;
}
```

**JavaScript 核心逻辑**：

```javascript
const treeData = [
  { id: 1, label: 'src', children: [
    { id: 2, label: 'components', children: [
      { id: 3, label: 'Button.tsx' },
      { id: 4, label: 'Modal.tsx' }
    ]},
    { id: 5, label: 'utils', lazy: true }
  ]},
  { id: 6, label: 'package.json' }
];

function renderNode(node, level) {
  const div = document.createElement('div');
  div.className = 'tree-node';
  div.setAttribute('role', 'treeitem');
  div.dataset.id = node.id;

  const header = document.createElement('div');
  header.className = 'tree-node-header';
  header.style.paddingLeft = (level * 20 + 8) + 'px';

  const arrow = document.createElement('span');
  arrow.className = 'tree-arrow';
  const hasChildren = node.children || node.lazy;
  if (!hasChildren) arrow.classList.add('leaf');
  arrow.textContent = '\u25B6';

  const label = document.createElement('span');
  label.textContent = node.label;

  header.appendChild(arrow);
  header.appendChild(label);
  div.appendChild(header);

  if (hasChildren) {
    header.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleNode(div, node, arrow);
    });
  }

  label.addEventListener('click', function(e) {
    e.stopPropagation();
    document.querySelectorAll('.tree-node-header.selected')
      .forEach(el => el.classList.remove('selected'));
    header.classList.add('selected');
  });

  return div;
}

function toggleNode(nodeEl, nodeData, arrow) {
  const existing = nodeEl.querySelector('.tree-children');
  if (existing) {
    // 折叠
    existing.style.display = 'none';
    arrow.classList.remove('expanded');
  } else {
    // 展开
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children';
    nodeEl.appendChild(childrenContainer);

    if (nodeData.lazy) {
      childrenContainer.innerHTML = '<div class="tree-loading">Loading...</div>';
      // 模拟异步加载
      setTimeout(function() {
        childrenContainer.innerHTML = '';
        mockFetchChildren(nodeData.id).forEach(function(child) {
          childrenContainer.appendChild(renderNode(child, 0));
        });
      }, 500);
    } else if (nodeData.children) {
      nodeData.children.forEach(function(child) {
        childrenContainer.appendChild(renderNode(child, 0));
      });
    }
    arrow.classList.add('expanded');
  }
}

function mockFetchChildren(parentId) {
  return [
    { id: parentId * 10 + 1, label: 'file_a.js' },
    { id: parentId * 10 + 2, label: 'file_b.js' }
  ];
}
```

### 关键技术点

1. **递归渲染**：`renderNode`函数在`toggleNode`内被递归调用，每次展开子节点时动态创建DOM。不用一次性渲染整棵树，避免万级节点卡顿
2. **懒加载**：`node.lazy = true`的节点在首次展开时才请求数据。子节点容器先显示loading，数据返回后替换
3. **事件冒泡控制**：`e.stopPropagation()`确保点击箭头不会触发节点选中，点击节点不会触发展开折叠
4. **缩进计算**：用`paddingLeft = level * 20 + 8`实现层级缩进，不用嵌套CSS margin

### 常见坑点

- **内存泄漏**：折叠时如果只是`display:none`，DOM节点仍然在内存中。万级节点树建议折叠时`removeChild`，展开时重新渲染
- **搜索高亮**：搜索时需要递归展开所有匹配节点的父链，用`nodeEl.scrollIntoView()`滚动到可视区域
- **拖拽排序**：跨层级拖拽需要处理`dragover`事件的`dropEffect`，并在`drop`时更新数据结构而非只移动DOM

### 变体拓展

- **复选框树**：每个节点前加checkbox，父节点勾选状态为子节点的"全选/部分选/未选"三态
- **虚拟滚动**：节点数量超过1000时，只渲染可视区域内的节点，用`transform: translateY`模拟滚动位置
- **右键菜单**：监听`contextmenu`事件，根据节点类型显示不同菜单项

***

Component Deep Dive #44: Tree View — Recursive Rendering and Lazy Loading for 10K+ Nodes

File managers, org charts, category directories, permission menus — any hierarchical data needs a tree view. HTML has no native tree component. While nested `<ul>` can express hierarchy, it lacks expand/collapse, lazy loading, and multi-select interactions.

The core approach is recursive rendering: `renderNode` is called recursively inside `toggleNode`, dynamically creating DOM only when a node is expanded. This avoids rendering the entire tree at once, preventing lag with thousands of nodes.

Lazy loading is handled by checking `node.lazy` — on first expansion, a loading indicator shows while data is fetched, then children are rendered. Event propagation is carefully controlled with `stopPropagation()` so arrow clicks don't trigger selection and vice versa.

Key pitfalls: memory leaks from keeping collapsed DOM nodes (use `removeChild` for large trees), search highlighting requires recursively expanding parent chains, and drag-and-drop across levels needs careful `dropEffect` handling.

Extensions include tri-state checkbox trees, virtual scrolling for 1000+ nodes, and context menus with node-type-specific items.
