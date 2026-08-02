/* ============================================================
   COMPONENT LIBRARY
   Shared chrome (nav, mobile menu, footer, preloader, cursor,
   grain, hand-drawn grid) rendered once here and mounted into
   every page. Keeps markup in one place so new themes/pages
   don't require copy-pasting the same structure everywhere.
   ============================================================ */

(function () {
  'use strict';

  var THEMES = [
    { value: 'hand-drawn', label: 'Hand-drawn' },
    { value: 'workbook', label: 'Workbook' },
    { value: 'orange-candy', label: 'Orange Candy' }
  ];

  function navLinks(base) {
    return [
      { href: base + '#work', label: 'Work' },
      { href: base + '#about', label: 'About' },
      { href: base + '#prototype', label: 'Lab' },
      { href: base + '#experience', label: 'Experience' }
    ];
  }

  function themeSwitcherHTML(idSuffix) {
    var options = THEMES.map(function (t) {
      return '<option value="' + t.value + '">' + t.label + '</option>';
    }).join('');
    return (
      '<select id="themeSwitcher' + idSuffix + '" class="theme-switcher" data-hover aria-label="Switch theme">' +
      options +
      '</select>'
    );
  }

  function navHTML(opts) {
    var base = opts.base || '';
    // base is '' on the homepage (anchors like "#work") or the path back to
    // index.html on subpages (e.g. "../index.html", so links become
    // "../index.html#work"). The logo itself just points at that base page.
    var logoHref = opts.isHome ? '#top' : base;
    var links = navLinks(base)
      .map(function (l) {
        return '<a href="' + l.href + '" data-hover>' + l.label + '</a>';
      })
      .join('\n      ');
    return (
      '<header class="nav">\n' +
      '  <a href="' + logoHref + '" class="nav-logo">Sanchit Soni<span>.</span></a>\n' +
      '  <nav class="nav-links">\n' +
      '    ' + links + '\n' +
      '    <a href="' + base + '#contact" data-hover class="nav-cta">Say Hi</a>\n' +
      '    ' + themeSwitcherHTML('Desktop') + '\n' +
      '  </nav>\n' +
      '  <button class="nav-burger" id="navBurger" aria-label="Toggle menu">\n' +
      '    <span></span><span></span>\n' +
      '  </button>\n' +
      '</header>'
    );
  }

  function mobileMenuHTML(opts) {
    var base = opts.base || '';
    var links = navLinks(base)
      .map(function (l) {
        return '<a href="' + l.href + '">' + l.label + '</a>';
      })
      .join('\n    ');
    return (
      '<div class="mobile-menu" id="mobileMenu">\n' +
      '    ' + links + '\n' +
      '    <a href="' + base + '#contact">Say Hi</a>\n' +
      '    ' + themeSwitcherHTML('Mobile') + '\n' +
      '  </div>'
    );
  }

  function footerHTML() {
    return (
      '<footer class="footer">\n' +
      '  <span>© 2026 Sanchit Soni. Lorem ipsum, all rights reserved.</span>\n' +
      '  <a href="#top" data-hover>Back to top ↑</a>\n' +
      '</footer>'
    );
  }

  function preloaderHTML(label) {
    return (
      '<div class="preloader" id="preloader">\n' +
      '  <div class="preloader-count" id="preloaderCount">0</div>\n' +
      '  <div class="preloader-label">' + (label || 'loading') + '</div>\n' +
      '</div>'
    );
  }

  function overlaysHTML(opts) {
    return (
      '<svg id="roughGrid" class="rough-grid-bg" aria-hidden="true"></svg>\n' +
      '<div class="cursor-dot" id="cursorDot"></div>\n' +
      '<div class="cursor-ring" id="cursorRing"></div>\n' +
      '<div class="grain"></div>\n' +
      '<div class="scroll-progress" id="scrollProgress"></div>\n' +
      preloaderHTML(opts.preloaderLabel)
    );
  }

  function mount(id, html) {
    var el = document.getElementById(id);
    if (el) el.outerHTML = html;
  }

  /**
   * Mounts the overlay layer + nav + mobile menu into their placeholder
   * elements. Call this immediately after the placeholders exist in the
   * DOM (synchronous <script> right below them) to avoid any flash.
   */
  function mountChrome(opts) {
    opts = opts || {};
    mount('overlays-mount', overlaysHTML(opts));
    mount('nav-mount', navHTML(opts));
    mount('mobile-menu-mount', mobileMenuHTML(opts));
  }

  function mountFooter() {
    mount('footer-mount', footerHTML());
  }

  window.Components = {
    THEMES: THEMES,
    mountChrome: mountChrome,
    mountFooter: mountFooter
  };
})();
