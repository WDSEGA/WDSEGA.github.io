---
title: "组件详解#45：可排序数据表格，点击表头排序+前端分页一把梭 | Component Deep Dive #45: Sortable Data Table — Click-to-Sort Header and Frontend Pagination in One Shot"
date: 2026-07-09
categories: 组件详解
tags: [Component, Data Table, Sortable, JavaScript, UI]
---

## 组件详解#45：可排序数据表格，点击表头排序+前端分页一把梭

> 产品介绍：Web Component Dictionary v2.0 收录83个手写UI组件，无需任何框架。完整源码+实时预览，已在 Payhip 上架。文末有获取方式。

### 为什么不用 `<table>` 原生排序？

HTML `<table>` 本身不支持排序、分页、固定表头。后台管理系统的数据表格是最高频的组件之一，但用原生API手写一个功能完整的表格，需要处理排序逻辑、分页状态、表头固定、列宽拖拽——每一个都是独立的坑。

### 效果预览

表格表头可点击排序（升序/降序切换），排序列显示箭头指示器。底部有分页器，显示当前页/总页数，支持上一页/下一页/跳转。固定表头，滚动时表头始终可见。

### 代码拆解

**HTML 结构**：

```html
<div class="data-table-wrapper">
  <div class="data-table-scroll">
    <table class="data-table" id="dataTable">
      <thead>
        <tr>
          <th data-key="name" data-type="string">Name <span class="sort-icon"></span></th>
          <th data-key="age" data-type="number">Age <span class="sort-icon"></span></th>
          <th data-key="joinDate" data-type="date">Join Date <span class="sort-icon"></span></th>
          <th data-key="salary" data-type="number">Salary <span class="sort-icon"></span></th>
        </tr>
      </thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>
  <div class="pagination" id="pagination"></div>
</div>
```

**CSS 核心样式**：

```css
.data-table-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}
.data-table-scroll {
  max-height: 400px;
  overflow-y: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.data-table thead {
  position: sticky;
  top: 0;
  background: #f8fafc;
  z-index: 1;
}
.data-table th {
  padding: 10px 16px;
  text-align: left;
  cursor: pointer;
  user-select: none;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}
.data-table th:hover {
  background: #f1f5f9;
}
.data-table td {
  padding: 8px 16px;
  border-bottom: 1px solid #f1f5f9;
}
.sort-icon::after {
  content: '\2195';
  color: #cbd5e1;
  margin-left: 4px;
  font-size: 0.85em;
}
th.sort-asc .sort-icon::after { content: '\2191'; color: #2563eb; }
th.sort-desc .sort-icon::after { content: '\2193'; color: #2563eb; }
.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}
.pagination button {
  padding: 4px 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}
.pagination button.active {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

**JavaScript 核心逻辑**：

```javascript
const allData = [
  { name: 'Alice', age: 28, joinDate: '2024-03-15', salary: 8500 },
  { name: 'Bob', age: 35, joinDate: '2023-07-01', salary: 12000 },
  { name: 'Charlie', age: 22, joinDate: '2025-01-10', salary: 6500 },
  { name: 'Diana', age: 31, joinDate: '2022-11-20', salary: 15000 },
  { name: 'Eve', age: 27, joinDate: '2024-09-05', salary: 9200 }
  // ...more data
];

let sortKey = null;
let sortDir = 'asc';
let currentPage = 1;
const pageSize = 3;

// 排序
function sortData(data, key, dir) {
  const sorted = [...data];
  sorted.sort(function(a, b) {
    let va = a[key], vb = b[key];
    const th = document.querySelector('th[data-key="' + key + '"]');
    const type = th ? th.dataset.type : 'string';
    if (type === 'number') {
      va = Number(va); vb = Number(vb);
    } else if (type === 'date') {
      va = new Date(va).getTime();
      vb = new Date(vb).getTime();
    }
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}

// 渲染表格
function renderTable() {
  let data = sortKey ? sortData(allData, sortKey, sortDir) : allData;
  const totalPages = Math.ceil(data.length / pageSize);
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * pageSize;
  const pageData = data.slice(start, start + pageSize);

  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = pageData.map(function(row) {
    return '<tr>' +
      '<td>' + row.name + '</td>' +
      '<td>' + row.age + '</td>' +
      '<td>' + row.joinDate + '</td>' +
      '<td>$' + row.salary.toLocaleString() + '</td>' +
      '</tr>';
  }).join('');

  renderPagination(totalPages);
}

// 渲染分页
function renderPagination(totalPages) {
  const pag = document.getElementById('pagination');
  let html = '<button onclick="goPage(' + (currentPage - 1) + ')" ' +
    (currentPage <= 1 ? 'disabled' : '') + '>Prev</button>';
  for (var i = 1; i <= totalPages; i++) {
    html += '<button class="' + (i === currentPage ? 'active' : '') +
      '" onclick="goPage(' + i + ')">' + i + '</button>';
  }
  html += '<button onclick="goPage(' + (currentPage + 1) + ')" ' +
    (currentPage >= totalPages ? 'disabled' : '') + '>Next</button>';
  pag.innerHTML = html;
}

function goPage(p) {
  currentPage = p;
  renderTable();
}

// 表头点击排序
document.querySelectorAll('th[data-key]').forEach(function(th) {
  th.addEventListener('click', function() {
    const key = th.dataset.key;
    if (sortKey === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDir = 'asc';
    }
    document.querySelectorAll('th').forEach(function(t) {
      t.classList.remove('sort-asc', 'sort-desc');
    });
    th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    currentPage = 1;
    renderTable();
  });
});

renderTable();
```

### 关键技术点

1. **排序类型区分**：`data-type`属性区分string/number/date，数字排序用`Number()`转换，日期排序用`new Date().getTime()`转时间戳
2. **固定表头**：`thead { position: sticky; top: 0; }`是纯CSS方案，不需要JS监听滚动。但要注意`z-index`设置，否则内容会覆盖表头
3. **分页状态管理**：排序变化时重置到第一页`currentPage = 1`，避免排序后当前页超出范围

### 常见坑点

- **sticky表头+border-collapse**：`border-collapse: collapse`会导致sticky表头的border消失，改用`border-collapse: separate; border-spacing: 0`
- **大数组排序性能**：`[...data].sort()`会创建副本，万级数据排序会有明显延迟。考虑预排序索引或Web Worker
- **分页器页码过多**：当总页数超过20时，全部渲染页码按钮会撑爆布局。需要实现省略号分页（1 2 3 ... 8 9 10）

### 变体拓展

- **列宽拖拽**：在`th`右侧添加2px宽的拖拽手柄，`mousedown`监听后动态修改`th`的`width`
- **行选择**：每行前加checkbox，全选checkbox放在表头，支持Shift+点击范围选择
- **后端分页**：将`sortData`和`slice`替换为API请求，传递`sort_by`、`sort_dir`、`page`、`page_size`参数

***

Component Deep Dive #45: Sortable Data Table — Click-to-Sort Header and Frontend Pagination in One Shot

HTML `<table>` natively lacks sorting, pagination, and sticky headers. A feature-complete data table requires sorting logic, pagination state, fixed headers, and column resizing — each its own minefield.

The sorting implementation distinguishes data types via `data-type` attribute: strings sort lexicographically, numbers use `Number()` conversion, and dates use `new Date().getTime()` for timestamp comparison. The sticky header uses pure CSS (`position: sticky; top: 0`), but requires `border-collapse: separate` to avoid border disappearing.

Pagination state resets to page 1 when sorting changes. The `renderTable` function chains sort -> slice -> render, keeping the data flow single-directional. Key pitfalls include border-collapse breaking sticky headers, large array sort performance (consider pre-sorted indexes or Web Workers), and pagination overflow when total pages exceed 20 (implement ellipsis pagination).

Extensions include draggable column widths via mouse handlers on th resize handles, row selection with Shift+click range select, and backend pagination replacing frontend sort/slice with API parameters.
