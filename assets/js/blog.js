// 西米 写的博客增强脚本
// 包含：阅读进度条、TOC 目录 + 锚点、本地阅读量统计、图片懒加载兜底

(function () {
  'use strict';

  // ============== 阅读进度条 ==============
  function initReadingProgress() {
    var bar = document.getElementById('reading-progress');
    if (!bar) return;

    function update() {
      var doc = document.documentElement;
      var scrollTop = window.scrollY || doc.scrollTop || 0;
      var winHeight = window.innerHeight;
      var docHeight = doc.scrollHeight;
      var max = Math.max(docHeight - winHeight, 1);
      var pct = Math.min(Math.max((scrollTop / max) * 100, 0), 100);
      bar.style.width = pct + '%';
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  // ============== TOC 目录 + 标题锚点 ==============
  function initTOC() {
    var content = document.querySelector('.post-content');
    var toc = document.getElementById('post-toc');
    var tocContainer = document.getElementById('post-toc-container');
    if (!content || !toc) return;

    var headings = content.querySelectorAll('h2, h3');
    if (headings.length < 3) {
      // 文章太短就不显示 TOC
      if (tocContainer) tocContainer.style.display = 'none';
      return;
    }

    // 1) 给每个标题加锚点 id
    headings.forEach(function (h, i) {
      if (!h.id) {
        // 优先用文本生成稳定的 slug；同文本时再加序号区分
        var base = (h.textContent || '').trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\u4e00-\u9fa5a-z0-9\-_]/g, '')
          .substring(0, 40) || 'h';
        var id = base;
        var n = 1;
        while (document.getElementById(id)) {
          n += 1;
          id = base + '-' + n;
        }
        h.id = id;
      }
    });

    // 2) 生成 TOC
    var list = document.createElement('ul');
    list.className = 'toc-list';

    headings.forEach(function (h) {
      var li = document.createElement('li');
      li.className = 'toc-item toc-' + h.tagName.toLowerCase();
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + h.id);
      });
      li.appendChild(a);
      list.appendChild(li);
    });

    toc.appendChild(list);
    if (tocContainer) tocContainer.style.display = '';

    // 3) 当前章节高亮
    var links = toc.querySelectorAll('a');
    function highlight() {
      var scrollTop = window.scrollY + 100;
      var current = null;
      headings.forEach(function (h) {
        if (h.offsetTop <= scrollTop) current = h;
      });
      links.forEach(function (a) {
        a.classList.toggle('active', current && a.getAttribute('href') === '#' + current.id);
      });
    }
    window.addEventListener('scroll', highlight, { passive: true });
    highlight();
  }

  // ============== 本地阅读量统计 ==============
  function initViewCounter() {
    var el = document.getElementById('view-count');
    if (!el) return;

    var path = window.location.pathname;
    var key = 'simin-blog-views::' + path;
    var lastSessionKey = 'simin-blog-session::' + path;

    // 同一会话内不重复计数
    if (sessionStorage.getItem(lastSessionKey)) {
      var stored = parseInt(localStorage.getItem(key) || '0', 10);
      el.textContent = stored > 0 ? stored : '';
      return;
    }
    sessionStorage.setItem(lastSessionKey, '1');

    var views = parseInt(localStorage.getItem(key) || '0', 10) + 1;
    localStorage.setItem(key, String(views));
    el.textContent = views;
  }

  // ============== 图片懒加载兜底 ==============
  // 浏览器原生 loading="lazy" 兼容性不够时，用 IntersectionObserver 兜底
  function initLazyImages() {
    // 1) 自动给文章里的所有 img 加上 loading="lazy" decoding="async"（如果有缺失）
    var content = document.querySelector('.post-content');
    if (content) {
      var imgs = content.querySelectorAll('img');
      imgs.forEach(function (img) {
        if (!img.hasAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
        if (!img.hasAttribute('decoding')) {
          img.setAttribute('decoding', 'async');
        }
      });
    }
    // 2) 如果某些老浏览器不支持 loading="lazy"，用 IntersectionObserver 兏底
    if (!('IntersectionObserver' in window) || !('loading' in HTMLImageElement.prototype)) {
      var lazyImgs = document.querySelectorAll('img[loading="lazy"]');
      if (lazyImgs.length === 0) return;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var img = e.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            io.unobserve(img);
          }
        });
      });
      lazyImgs.forEach(function (img) { io.observe(img); });
    }
  }

  // ============== 启动 ==============
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initReadingProgress();
      initTOC();
      initViewCounter();
      initLazyImages();
    });
  } else {
    initReadingProgress();
    initTOC();
    initViewCounter();
    initLazyImages();
  }
})();
