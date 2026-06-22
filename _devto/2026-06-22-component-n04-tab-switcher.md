---
title: "Component Deep Dive #4: Tab Switcher — Seamless Multi-Content Panel Switching"
published: true
tags: webcomponents, javascript, css, tutorial, frontend
canonical_url: "https://wdsega.github.io/2026/06/22/component-n04-tab-switcher/"
---

Tab switching is everywhere — product detail pages (Details / Specs / Reviews), settings pages (General / Advanced / Notifications), dashboard views (Overview / Analytics / Reports). If you're building any content-heavy page, you need a tab switcher.

## What This Component Does

A tab switcher lets users switch between multiple content panels by clicking tab buttons. Only one panel is visible at a time.

Key features of this implementation:
- 3 tab buttons with active state highlighting
- Smooth content switching (instant in the base version)
- Pure HTML/CSS/JS, no dependencies

---

## The Code

### HTML Structure

```html
<div style="padding:20px">
  <div style="display:flex;gap:2px">
    <button class="tb" onclick="switchTab(0,this)">Tab1</button>
    <button class="tb" onclick="switchTab(1,this)">Tab2</button>
    <button class="tb" onclick="switchTab(2,this)">Tab3</button>
  </div>
  <div id="tab-panel" style="background:#1a1a2e;padding:40px;min-height:200px;border-radius:0 8px 8px 8px">
    <h2 id="tab-t">Tab One</h2>
    <p id="tab-c">Content one</p>
  </div>
</div>
```

Key points:
- `display:flex` on the tab header row
- `border-radius:0 8px 8px 8px` on the content panel — top-left corner stays square, visually connecting to the active tab
- Each button calls `switchTab(i, this)` with the index and button element

### CSS

```css
.tb.active {
  background: #e94560 !important;
  color: #fff !important;
}
```

The `!important` is needed because default styles are set via inline `style` attributes. Better approach: move all styles to CSS classes and avoid `!important`.

### JavaScript

```javascript
var tabs = [
  {t: 'Tab One', c: 'Content one'},
  {t: 'Tab Two', c: 'Content two'},
  {t: 'Tab Three', c: 'Content three'}
];

function switchTab(i, btn) {
  // Remove active state from all buttons
  document.querySelectorAll('.tb').forEach(function(b) {
    b.classList.remove('active');
    b.style.background = '#333';
    b.style.color = '#aaa';
  });
  // Activate current button
  btn.classList.add('active');
  // Update content
  document.getElementById('tab-t').textContent = tabs[i].t;
  document.getElementById('tab-c').textContent = tabs[i].c;
}
```

---

## Key Technique: `textContent` vs `innerHTML`

`textContent` only sets plain text — safer (prevents XSS if the content source is untrusted). Use `innerHTML` only when you need to render HTML tags inside the content panel.

---

## Common Pitfall: Inline Styles vs CSS Classes

If you set default styles via inline `style` attributes (like the original), you'll find that CSS classes can't override them without `!important`. 

**Solution**: Don't use inline styles for default states. Use CSS classes:

```css
.tab-btn { padding: 12px 24px; background: #333; color: #aaa; border: none; cursor: pointer; }
.tab-btn.active { background: #e94560; color: #fff; }
```

---

## Adding Transition Animations

The base version switches instantly. To add a fade transition:

```css
#tab-panel {
  opacity: 1;
  transition: opacity 0.3s ease;
}
#tab-panel.fade-out {
  opacity: 0;
}
```

In JS: add `.fade-out`, wait for the transition to end (`setTimeout` or `transitionend` event), then update content and remove `.fade-out`.

---

## Live Demo

Try all 83 components (including this tab switcher) live at:  
**https://wdsega.github.io/web-components/**

Search for `n04` and click "Preview" to see the real-time effect.

---

## Get the Full Version

This component is part of **Web Component Dictionary v2.0** — 83 components / 8 categories / bilingual (Chinese-English) / live preview / zero dependencies.

**Buy the full version**: [payhip.com/b/S9pj2](https://payhip.com/b/S9pj2) — $9.99 one-time.

Includes:
- Source code for all 83 components
- Bilingual documentation
- Single-file standalone version (no build step)
