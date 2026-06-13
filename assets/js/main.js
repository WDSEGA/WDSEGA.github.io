/**
 * 科技前沿 — 交互脚本 v2.0
 * 暗色模式 / 滚动进度条 / 移动菜单 / TOC / 返回顶部
 */
(function () {
  'use strict';

  // ============ 暗色模式 ============
  var html = document.documentElement;
  var toggle = document.getElementById('themeToggle');
  var saved = localStorage.getItem('theme');
  if (saved === 'dark') { html.classList.remove('light'); html.classList.add('dark'); }
  else if (saved === 'light') { html.classList.add('light'); }
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { html.classList.remove('light'); html.classList.add('dark'); }

  if (toggle) {
    toggle.addEventListener('click', function () {
      if (html.classList.contains('dark')) { html.classList.remove('dark'); html.classList.add('light'); localStorage.setItem('theme', 'light'); }
      else { html.classList.remove('light'); html.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    });
  }
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!localStorage.getItem('theme')) { if (e.matches) { html.classList.remove('light'); html.classList.add('dark'); } else { html.classList.remove('dark'); html.classList.add('light'); } }
    });
  }

  // ============ 移动菜单 ============
  var menuBtn = document.getElementById('mobileMenuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () { nav.classList.toggle('open'); });
    nav.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', function () { nav.classList.remove('open'); }); });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target) && !menuBtn.contains(e.target)) nav.classList.remove('open'); });
  }

  // ============ 滚动进度条 ============
  var progressBar = document.getElementById('progressBar');
  if (progressBar) {
    window.addEventListener('scroll', function () {
      var h = document.documentElement;
      var pct = h.scrollHeight - h.clientHeight;
      if (pct > 0) progressBar.style.width = (h.scrollTop / pct * 100) + '%';
    }, { passive: true });
  }

  // ============ 返回顶部 ============
  var scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    window.addEventListener('scroll', function () { scrollTopBtn.classList.toggle('visible', window.scrollY > 400); }, { passive: true });
    scrollTopBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  // ============ TOC 生成 ============
  var tocBody = document.getElementById('tocBody');
  var tocToggle = document.getElementById('tocToggle');
  var postToc = document.getElementById('postToc');
  if (tocBody && postToc) {
    var headings = document.querySelectorAll('.post-body h2, .post-body h3');
    if (headings.length > 0) {
      var html2 = '';
      headings.forEach(function (h, i) { var id = h.id || 'heading-' + i; h.id = id; html2 += '<a href="#' + id + '" class="toc-' + h.tagName.toLowerCase() + '">' + h.textContent + '</a>'; });
      tocBody.innerHTML = html2;
    } else { postToc.style.display = 'none'; }
  }
  if (tocToggle && postToc) {
    tocToggle.addEventListener('click', function () { postToc.classList.toggle('collapsed'); try { localStorage.setItem('tocCollapsed', postToc.classList.contains('collapsed') ? '1' : '0'); } catch(e){} });
    try { if (localStorage.getItem('tocCollapsed') === '1') postToc.classList.add('collapsed'); } catch(e){}
  }

  // ============ Header 阴影 ============
  var header = document.getElementById('siteHeader');
  if (header) {
    window.addEventListener('scroll', function () { header.style.boxShadow = window.scrollY > 10 ? '0 1px 3px rgba(0,0,0,0.06)' : ''; }, { passive: true });
  }
})();
