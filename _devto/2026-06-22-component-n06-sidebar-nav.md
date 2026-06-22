---
title: "Component Deep Dive #6: Sidebar Nav — The Standard Layout for Admin Panels"
published: true
tags: admin, navigation, css, javascript, webcomponents
canonical_url: "https://wdsega.github.io/2026/06/22/component-n06-sidebar-nav/"
---

Every admin panel has one — the **sidebar navigation**. WordPress, GitLab, Discord… they all use it. If you're building any dashboard or docs site, you need this component.

## What It Looks Like

A fixed vertical nav on the left, ~220px wide, dark background. Active item has a colored left border + semi-transparent background tint. Content area fills the rest.

---

## The Minimal Code

### HTML

```html
<div style="display:flex; min-height:400px">
  <div style="width:220px; background:#1a1a2e; padding:20px 0; display:flex; flex-direction:column; gap:2px">
    <div style="padding:18px 24px; color:#e94560; font-weight:bold; border-left:3px solid #e94560; background:rgba(233,69,96,0.1)">Dashboard</div>
    <div style="padding:18px 24px; color:#aaa; cursor:pointer; border-left:3px solid transparent">Analytics</div>
    <div style="padding:18px 24px; color:#aaa; cursor:pointer; border-left:3px solid transparent">Users</div>
  </div>
  <div style="flex:1; padding:40px; background:#fff">
    <h2>Main Content</h2>
  </div>
</div>
```

Key trick: inactive items have `border-left:3px solid transparent` — **prevents layout jump** when activating.

### CSS

```css
.sidebar-item {
  padding: 18px 24px;
  color: #aaa;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
}
.sidebar-item.active {
  color: #e94560;
  font-weight: bold;
  border-left-color: #e94560;
  background: rgba(233,69,96,0.1);
}
```

### JavaScript

```javascript
document.querySelectorAll('.sidebar-item').forEach(function(item) {
  item.addEventListener('click', function() {
    document.querySelectorAll('.sidebar-item').forEach(function(i) {
      i.classList.remove('active');
    });
    this.classList.add('active');
  });
});
```

---

## Key Technique: Auto-Highlight Current Page

If the sidebar is included on every page, use JS to auto-highlight:

```javascript
(function() {
  var current = location.pathname;
  document.querySelectorAll('.sidebar-item[href]').forEach(function(item) {
    if (item.getAttribute('href') === current) {
      item.classList.add('active');
    }
  });
})();
```

---

## Responsive: Mobile Drawer

On phones, 220px is too wide. Solution: hamburger button → slide-in drawer:

```css
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -220px;
    top: 0;
    bottom: 0;
    z-index: 999;
    transition: left 0.3s ease;
  }
  .sidebar.open { left: 0; }
}
```

---

## Live Demo

Try all 83 components (including this sidebar) live at:  
**https://wdsega.github.io/web-components/**

Search for `n06` and click "Preview".

---

## Get the Full Version

This component is part of **Web Component Dictionary v2.0** — 83 components / 8 categories / bilingual (Chinese-English) / live preview / zero dependencies.

**Buy the full version**: [payhip.com/b/S9pj2](https://payhip.com/b/S9pj2) — $9.99 one-time.

Includes:
- Source code for all 83 components
- Bilingual documentation
- Single-file standalone version (no build step)
