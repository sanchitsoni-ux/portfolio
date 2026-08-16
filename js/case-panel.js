/* ============================================================
   CASE STUDY SIDE PANEL (prototype)
   Split-view, not a modal: opening a case study shrinks the work
   grid into a compact list (via reflow — .work-layout is a flex
   row and the panel grows from width 0) and loads the case study
   into a sticky panel on the right. No overlay/backdrop, so the
   list stays 1-click live the whole time — click another tile and
   the panel just swaps its content in place.

   Motion (https://motion.dev) drives the panel-width animation and
   a staggered fade/rise for the loaded content, loaded from a CDN
   as an ES module. If that fetch ever fails (offline, CDN down),
   everything falls back to instant, functional show/hide — see the
   .catch() blocks below.
   ============================================================ */

(function () {
  'use strict';

  var layout = document.getElementById('workLayout');
  var panel = document.getElementById('casePanel');
  var body = document.getElementById('casePanelBody');
  var closeBtn = document.getElementById('casePanelClose');
  var tiles = document.querySelectorAll('a.work-tile[href]');
  var nav = document.querySelector('.nav');
  if (!layout || !panel || !body || !closeBtn) return;

  var EASE = [0.16, 1, 0.3, 1];

  // Kicked off immediately (not on first open) so the module is already
  // warm by the time anyone clicks a tile — avoids the animation "waking
  // up" late on the very first open.
  var motion = import('https://cdn.jsdelivr.net/npm/motion@11.11.13/+esm');

  var cache = {};
  var isOpen = false;
  var activeHref = null;

  function rewritePaths(html) {
    return html
      .replace(/\.\.\/images\//g, 'images/')
      .replace(/\.\.\/index\.html/g, 'index.html')
      .replace(/\.\.\/work\//g, 'work/');
  }

  function bindHovers(scope) {
    var ring = document.getElementById('cursorRing');
    if (!ring) return;
    scope.querySelectorAll('[data-hover]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('active'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('active'); });
    });
  }

  function initCarousels(scope) {
    scope.querySelectorAll('[data-carousel]').forEach(function (carousel) {
      var track = carousel.querySelector('.mock-carousel-track');
      var dotsWrap = carousel.querySelector('.carousel-dots');
      var slides = track ? Array.prototype.slice.call(track.querySelectorAll('.mock-carousel-slide')) : [];
      if (!track || slides.length < 2) return;

      track.classList.add('carousel-js');
      var current = 0;
      var timer = null;

      function goTo(index) {
        var next = (index + slides.length) % slides.length;
        if (next === current && slides[current].classList.contains('active')) return;
        slides[current].classList.remove('active');
        if (dotsWrap) dotsWrap.children[current].classList.remove('active');
        current = next;
        slides[current].classList.add('active');
        if (dotsWrap) dotsWrap.children[current].classList.add('active');
      }

      if (dotsWrap) {
        slides.forEach(function (_, i) {
          var dot = document.createElement('button');
          dot.className = 'carousel-dot';
          dot.type = 'button';
          dot.setAttribute('aria-label', 'Go to image ' + (i + 1));
          dot.addEventListener('click', function () { goTo(i); resetTimer(); });
          dotsWrap.appendChild(dot);
        });
      }

      function resetTimer() {
        clearInterval(timer);
        timer = setInterval(function () { goTo(current + 1); }, 4500);
      }

      slides[0].classList.add('active');
      if (dotsWrap) dotsWrap.children[0].classList.add('active');
      resetTimer();

      carousel.addEventListener('mouseenter', function () { clearInterval(timer); });
      carousel.addEventListener('mouseleave', resetTimer);
    });
  }

  // Fade + rise in, staggered — this is the "panel just loaded" moment,
  // so it's the one place worth spending a real animation budget on.
  // Falls back to an instant reveal if Motion never loads.
  function animateContentIn(scope) {
    var els = scope.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    var settled = false;
    function settle() {
      if (settled) return;
      settled = true;
      els.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
    }

    motion.then(function (m) {
      m.animate(
        els,
        { opacity: [0, 1], y: [26, 0] },
        { duration: 0.6, delay: m.stagger(0.04), ease: EASE }
      );
      // Motion doesn't reliably expose a single "all done" promise across
      // a staggered group here, so this just guarantees the end state is
      // committed once the longest possible run has had time to finish,
      // rather than trusting per-element fills to stick on their own.
      setTimeout(settle, 700 + els.length * 40);
    }).catch(settle);

    // Belt and suspenders: if Motion never resolves at all (e.g. the tab
    // is backgrounded and its animation loop never gets to run), content
    // still shouldn't stay invisible forever.
    setTimeout(settle, 2500);
  }

  function setActiveTile(href) {
    activeHref = href;
    tiles.forEach(function (tile) {
      tile.classList.toggle('active-tile', tile.getAttribute('href') === href);
    });
  }

  function stackedLayout() {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  // Desktop: flex-basis is the property that actually resizes this flex
  // item (width doesn't reliably defer to it here), animated by the plain
  // CSS transition on .case-panel — Motion's engine doesn't recognize
  // flex-basis as an animatable property, so this one stays CSS-driven.
  // Mobile: the panel stacks below the list and sizes to content, so it's
  // just shown/hidden — no width to animate, and height:auto can't
  // meaningfully animate anyway.
  function setPanelSize(px) {
    document.documentElement.style.setProperty('--case-panel-w', (px || 1040) + 'px');

    if (stackedLayout()) {
      panel.style.height = px ? 'auto' : '0';
      panel.style.maxHeight = px ? '80vh' : '0';
      if (nav) nav.style.right = '0px';
      return;
    }

    panel.style.flex = '0 0 ' + px + 'px';
    if (nav) nav.style.right = px + 'px';
  }

  function closePanel() {
    isOpen = false;
    layout.classList.remove('panel-open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('case-panel-active');
    setActiveTile(null);
    setPanelSize(0);
  }

  function openPanel(url) {
    isOpen = true;
    layout.classList.add('panel-open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('case-panel-active');
    setActiveTile(url);
    setPanelSize(Math.min(1040, window.innerWidth * 0.62));
    body.innerHTML = '<div class="case-panel-loading">Loading case study…</div>';

    var load = cache[url]
      ? Promise.resolve(cache[url])
      : fetch(url).then(function (r) { return r.text(); }).then(function (html) {
          cache[url] = html;
          return html;
        });

    load.then(function (html) {
      // A click may have switched to a different case study while this
      // request was in flight — bail if the panel has moved on.
      if (activeHref !== url) return;
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var main = doc.querySelector('main');
      if (!main) {
        body.innerHTML = '<p style="padding: 40px;">Could not load this case study.</p>';
        return;
      }
      body.innerHTML = rewritePaths(main.innerHTML);

      // "Back to Work" / "All Work" links inside the fetched page should
      // just close the panel rather than navigating to index.html#work.
      body.querySelectorAll('.project-back, .project-next').forEach(function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          closePanel();
        });
      });

      bindHovers(body);
      initCarousels(body);
      animateContentIn(body);
      panel.scrollTop = 0;
    }).catch(function () {
      if (activeHref !== url) return;
      body.innerHTML = '<p style="padding: 40px;">Something went wrong loading this case study.</p>';
    });
  }

  tiles.forEach(function (tile) {
    tile.addEventListener('click', function (e) {
      e.preventDefault();
      var href = tile.getAttribute('href');
      if (isOpen && href === activeHref) return;
      openPanel(href);
    });
  });

  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closePanel();
  });
})();
