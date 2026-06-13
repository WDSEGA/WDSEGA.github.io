---
layout: default
title: "关于"
permalink: /about/
---

<div style="max-width:800px;margin:0 auto;padding:32px 24px;">
  <h2 style="font-size:1.6rem;margin-bottom:16px;">关于 {{ site.title }}</h2>
  <p style="line-height:1.8;color:var(--text-secondary);margin-bottom:20px;">
    {{ site.description }}
  </p>
  <h3 style="font-size:1.2rem;margin:24px 0 12px;">网站统计</h3>
  <ul style="color:var(--text-secondary);line-height:1.8;">
    <li>文章总数：{{ site.posts | size }} 篇</li>
    <li>标签总数：{{ site.tags | size }} 个</li>
    <li>运行平台：GitHub Pages + Jekyll</li>
  </ul>
  <h3 style="font-size:1.2rem;margin:24px 0 12px;">广告合作</h3>
  <p style="color:var(--text-secondary);line-height:1.8;">
    本站接受相关技术广告投放，如有合作意向请联系。
  </p>
</div>
