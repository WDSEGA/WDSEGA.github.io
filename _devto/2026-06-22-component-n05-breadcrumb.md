---
title: "Component Deep Dive #5: Breadcrumb — Never Let Users Get Lost"
published: true
tags: webcomponents, navigation, ux, frontend, tutorial
canonical_url: "https://wdsega.github.io/2026/06/22/component-n05-breadcrumb/"
---

Breadcrumb navigation is the "you are here" signpost of the web. If your site has hierarchy (Home > Products > Category > Item), you need a breadcrumb.

## What It Looks Like

`Home › Products › Category › Current Page`

The current page is gray (not clickable), ancestors are links.

---

## The Minimal HTML

```html
<nav style="font-size:14px;color:#666">
  <a href="/" style="color:#e94560">Home</a>
  ›
  <a href="/products" style="color:#666">Products</a>
  ›
  <span style="color:#999">Current Page</span>
</nav>
```

Key points:
- Use `<nav>` for semantics (screen readers recognize it as nav)
- Use `›` (U+203A) as separator — cleaner than `>`
- Last item is `<span>`, not `<a>` — it shouldn't link to itself

---

## SEO Boost: JSON-LD Structured Data

Google recommends [BreadcrumbList schema](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com/"},
    {"@type": "ListItem", "position": 2, "name": "Products", "item": "https://example.com/products"}
  ]
}
</script>
```

This helps Google understand your site structure — and may show breadcrumbs in search results.

---

## Mobile Adaptation

On phones, breadcrumbs can overflow. Three solutions:

**1. Truncate to last 2-3 levels:**
```javascript
// Show only: ... › Category › Current
if (levels.length > 3) {
  show = ['...', ...levels.slice(-2)];
}
```

**2. Horizontal scroll:**
```css
.breadcrumb {
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
}
```

**3. Collapse into back button** (mobile only):
```css
@media (max-width: 600px) {
  .breadcrumb .ancestors { display: none; }
  .breadcrumb::before { content: "‹ Back"; }
}
```

---

## Accessibility (A11y)

Add `aria-label` to `<nav>`:

```html
<nav aria-label="breadcrumb">
  ...
</nav>
```

Screen readers will announce: "Breadcrumb navigation, list, 3 items".

---

## Live Demo

Try all 83 components (including this breadcrumb) live at:  
**https://wdsega.github.io/web-components/**

Search for `n05` and click "Preview".

---

## Get the Full Version

This component is part of **Web Component Dictionary v2.0** — 83 components / 8 categories / bilingual (Chinese-English) / live preview / zero dependencies.

**Buy the full version**: [payhip.com/b/S9pj2](https://payhip.com/b/S9pj2) — $9.99 one-time.

Includes:
- Source code for all 83 components
- Bilingual documentation
- Single-file standalone version (no build step)
