(function () {
  'use strict';

  /* ============ THEME SWITCHER ============ */
  var THEME_KEY = 'portfolio-theme';
  var DEFAULT_THEME = 'hand-drawn';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-switcher').forEach(function (sel) {
      sel.value = theme;
    });
  }

  function initThemeSwitcher() {
    var stored = DEFAULT_THEME;
    try {
      stored = localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
    } catch (e) { /* localStorage unavailable */ }
    applyTheme(stored);

    document.querySelectorAll('.theme-switcher').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var next = sel.value;
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
      });
    });
  }
  initThemeSwitcher();

  /* ============ PRELOADER ============ */
  const preloader = document.getElementById('preloader');
  const preloaderCount = document.getElementById('preloaderCount');
  let count = 0;
  const countInterval = setInterval(() => {
    count += Math.ceil(Math.random() * 18);
    if (count >= 100) {
      count = 100;
      clearInterval(countInterval);
      setTimeout(() => preloader.classList.add('done'), 250);
    }
    preloaderCount.textContent = count;
  }, 60);

  /* ============ CUSTOM CURSOR ============ */
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll('[data-hover]').forEach((el) => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('active'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('active'));
  });

  /* ============ SCROLL PROGRESS ============ */
  const scrollProgress = document.getElementById('scrollProgress');
  const timelineFill = document.getElementById('timelineFill');
  const timeline = document.querySelector('.timeline');
  const nav = document.querySelector('.nav');

  function onScroll() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    scrollProgress.style.width = scrolled + '%';

    nav.classList.toggle('scrolled', window.scrollY > 40);

    if (timeline && timelineFill) {
      const rect = timeline.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height;
      const visible = Math.min(Math.max(vh * 0.6 - rect.top, 0), total);
      const pct = total > 0 ? (visible / total) * 100 : 0;
      timelineFill.style.height = pct + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============ PARALLAX (blobs, cards, device frame) ============ */
  const parallaxEls = document.querySelectorAll('[data-parallax], .blob');
  function onParallaxScroll() {
    const scrollY = window.scrollY;
    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.dataset.speed || 0.2);
      el.style.transform = (el.classList.contains('blob') && el.classList.contains('blob-4'))
        ? `translate(-50%, calc(-50% + ${scrollY * speed}px))`
        : `translateY(${scrollY * speed * -0.3}px)`;
    });
  }
  window.addEventListener('scroll', onParallaxScroll, { passive: true });
  onParallaxScroll();

  /* Hero title lines: subtle mouse-parallax tilt */
  const heroLines = document.querySelectorAll('.hero-title .line');
  const hero = document.getElementById('hero');
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      heroLines.forEach((line) => {
        const speed = parseFloat(line.dataset.speed || 0.2);
        line.style.transform = `translate(${x * speed * 14}px, ${y * speed * 10}px)`;
      });
    });
    hero.addEventListener('mouseleave', () => {
      heroLines.forEach((line) => { line.style.transform = 'translate(0,0)'; });
    });
  }

  /* ============ HERO DYNAMIC WORD ROTATOR ============ */
  const dynamicWord = document.getElementById('dynamicWord');
  if (dynamicWord) {
    const words = ['Enterprise', 'Business Intelligence', 'Developer Tools'];
    const wordColors = ['#e8341c', '#f5d400', '#1b4ce0'];
    let wordIndex = 0;
    let wordAnnotation = null;

    function markWord() {
      if (!window.RoughNotation) return;
      if (wordAnnotation) wordAnnotation.remove();
      wordAnnotation = RoughNotation.annotate(dynamicWord, {
        type: 'highlight',
        color: wordColors[wordIndex] + '55',
        iterations: 2,
        multiline: false
      });
      wordAnnotation.show();
    }

    setInterval(() => {
      dynamicWord.classList.add('out');
      setTimeout(() => {
        wordIndex = (wordIndex + 1) % words.length;
        dynamicWord.textContent = words[wordIndex];
        dynamicWord.classList.remove('out');
        dynamicWord.classList.add('in-instant');
        void dynamicWord.offsetWidth;
        dynamicWord.classList.remove('in-instant');
        markWord();
      }, 450);
    }, 2600);
  }

  /* ============ SCROLL REVEAL (IntersectionObserver) ============ */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ============ NAV / MOBILE MENU ============ */
  const navBurger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  navBurger.addEventListener('click', () => {
    navBurger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
  mobileMenu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      navBurger.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });

  /* ============ PROTOTYPE LAB: mini demos ============ */

  // Draggable chip
  const dragDemo = document.getElementById('dragDemo');
  const dragChip = document.getElementById('dragChip');
  if (dragDemo && dragChip) {
    let isDragging = false, offsetX = 0, offsetY = 0;

    const startDrag = (clientX, clientY) => {
      isDragging = true;
      const chipRect = dragChip.getBoundingClientRect();
      offsetX = clientX - chipRect.left;
      offsetY = clientY - chipRect.top;
    };
    const moveDrag = (clientX, clientY) => {
      if (!isDragging) return;
      const demoRect = dragDemo.getBoundingClientRect();
      let x = clientX - demoRect.left - offsetX;
      let y = clientY - demoRect.top - offsetY;
      x = Math.max(4, Math.min(x, demoRect.width - dragChip.offsetWidth - 4));
      y = Math.max(4, Math.min(y, demoRect.height - dragChip.offsetHeight - 4));
      dragChip.style.left = x + 'px';
      dragChip.style.top = y + 'px';
    };
    const endDrag = () => { isDragging = false; };

    dragChip.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
    window.addEventListener('mouseup', endDrag);

    dragChip.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    }, { passive: true });
    window.addEventListener('touchend', endDrag);

    // initial position
    dragChip.style.position = 'absolute';
    dragChip.style.left = '50%';
    dragChip.style.top = '50%';
    dragChip.style.transform = 'translate(-50%, -50%)';
    dragChip.addEventListener('mousedown', () => { dragChip.style.transform = 'none'; }, { once: true });
    dragChip.addEventListener('touchstart', () => { dragChip.style.transform = 'none'; }, { once: true });
  }

  // wired-elements toggle/button micro-interaction (wired-toggle handles its own state)
  const fakeBtn = document.getElementById('fakeBtn');
  if (fakeBtn) {
    fakeBtn.addEventListener('click', () => {
      fakeBtn.textContent = 'Done ✓';
      setTimeout(() => { fakeBtn.textContent = 'Lorem action'; }, 1200);
    });
  }

  // Chat demo: loop typing indicator -> new bubble
  const chatDemo = document.getElementById('chatDemo');
  if (chatDemo) {
    const lines = [
      'Lorem ipsum dolor sit.',
      'Consectetur adipiscing elit.',
      'Sed do eiusmod tempor.',
      'Ut labore et dolore magna.'
    ];
    let i = 0;
    setInterval(() => {
      const typing = chatDemo.querySelector('.chat-typing');
      const bubbles = chatDemo.querySelectorAll('.chat-bubble');
      if (bubbles.length > 2) bubbles[0].remove();
      const newBubble = document.createElement('div');
      newBubble.className = i % 2 === 0 ? 'chat-bubble chat-bubble-out' : 'chat-bubble chat-bubble-in';
      newBubble.textContent = lines[i % lines.length];
      chatDemo.insertBefore(newBubble, typing);
      i++;
    }, 2600);
  }

  /* ============ SMOOTH ANCHOR SCROLL OFFSET (nav-aware) ============ */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ============ ROUGH.JS HAND-DRAWN OVERLAYS ============ */
  function initRough() {
    if (!window.rough) return;
    const inkStroke = 'rgba(43, 41, 30, 0.7)';
    const lightStroke = 'rgba(253, 251, 242, 0.85)';
    const redrawFns = [];

    function roughifyRect(el, opts) {
      opts = opts || {};
      if (!el || el.querySelector(':scope > svg.rough-overlay')) return null;
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'rough-overlay');
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.appendChild(svg);
      const rc = rough.svg(svg);

      function draw() {
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (!w || !h) return;
        const pad = opts.pad != null ? opts.pad : 3;
        const seed = opts.seed || 1;
        const baseConfig = {
          roughness: opts.roughness != null ? opts.roughness : 1.6,
          bowing: opts.bowing != null ? opts.bowing : 1,
          stroke: opts.stroke || inkStroke,
          strokeWidth: opts.strokeWidth != null ? opts.strokeWidth : 3.5,
          fillStyle: 'solid'
        };
        // Sharpie double-pass: draw twice with different seeds so the
        // overlapping imperfect strokes build up like a real marker.
        svg.appendChild(rc.rectangle(pad, pad, w - pad * 2, h - pad * 2, Object.assign({}, baseConfig, { seed: seed })));
        if (opts.doublePass !== false) {
          svg.appendChild(rc.rectangle(pad, pad, w - pad * 2, h - pad * 2, Object.assign({}, baseConfig, { seed: seed + 500, strokeWidth: baseConfig.strokeWidth * 0.7 })));
        }
      }
      draw();
      return draw;
    }

    const rectTargets = document.querySelectorAll(
      '.hero-polaroid, .about-card, .sticky-note, .lab-mini-card, .work-item-media, .device-frame-bar, .device-frame-screen, .btn, .nav-cta'
    );
    rectTargets.forEach((el, i) => {
      const isTight = el.classList.contains('work-item-media') || el.classList.contains('about-card') || el.classList.contains('hero-polaroid');
      const isButton = el.classList.contains('btn') || el.classList.contains('nav-cta');
      const isColored = el.classList.contains('work-item-media') || el.classList.contains('btn-primary');
      const fn = roughifyRect(el, {
        seed: i + 1,
        pad: isTight ? 4 : isButton ? 2 : 2,
        roughness: isButton ? 1.4 : 1.7,
        strokeWidth: isButton ? 2.8 : el.classList.contains('hero-polaroid') ? 4.5 : 3.5,
        stroke: isColored ? lightStroke : inkStroke,
        doublePass: !isButton
      });
      if (fn) redrawFns.push(fn);
    });

    // Hand-drawn background grid, fixed to viewport
    const gridSvg = document.getElementById('roughGrid');
    function drawGrid() {
      if (!gridSvg) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      gridSvg.setAttribute('width', w);
      gridSvg.setAttribute('height', h);
      gridSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      while (gridSvg.firstChild) gridSvg.removeChild(gridSvg.firstChild);
      const rc = rough.svg(gridSvg);
      const gap = 64;
      const stroke = 'rgba(43, 41, 30, 0.16)';
      let seed = 200;
      for (let x = 0; x <= w; x += gap) {
        const jitter = (x * 37) % 7 - 3;
        gridSvg.appendChild(rc.line(x, 0, x + jitter, h, { roughness: 1.3, bowing: 2, stroke: stroke, strokeWidth: 1, seed: seed++ }));
      }
      for (let y = 0; y <= h; y += gap) {
        const jitter = (y * 53) % 7 - 3;
        gridSvg.appendChild(rc.line(0, y, w, y + jitter, { roughness: 1.3, bowing: 2, stroke: stroke, strokeWidth: 1, seed: seed++ }));
      }
    }
    if (gridSvg) drawGrid();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        redrawFns.forEach((fn) => fn());
        drawGrid();
      }, 200);
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(initRough).catch(initRough);
  } else {
    setTimeout(initRough, 300);
  }

  /* ============ ROUGHNOTATION HIGHLIGHTS ============ */
  if (window.RoughNotation) {
    // Hero name: underline in blue, once the entrance reveal settles.
    const heroNameText = document.getElementById('heroNameText');
    if (heroNameText) {
      setTimeout(() => {
        RoughNotation.annotate(heroNameText, {
          type: 'underline',
          color: '#1b4ce0',
          strokeWidth: 3,
          padding: 2
        }).show();
      }, 1500);
    }

    // "Intuit" mention: hand-drawn circle in red, triggered on scroll into view.
    const intuitEl = document.getElementById('intuitHighlight');
    if (intuitEl) {
      const circleAnnotation = RoughNotation.annotate(intuitEl, {
        type: 'circle',
        color: '#e8341c',
        strokeWidth: 2,
        padding: [4, 8]
      });
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            circleAnnotation.show();
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      io.observe(intuitEl);
    }
  }

  /* ============ MOCK CAROUSELS (auto-rotating, fixed square stage) ============ */
  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const track = carousel.querySelector('.mock-carousel-track');
    const dotsWrap = carousel.querySelector('.carousel-dots');
    const slides = track ? Array.from(track.querySelectorAll('.mock-carousel-slide')) : [];
    if (!track || slides.length < 2) return;

    track.classList.add('carousel-js');
    let current = 0;
    let timer = null;

    const goTo = (index) => {
      const next = (index + slides.length) % slides.length;
      if (next === current && slides[current].classList.contains('active')) return;
      slides[current].classList.remove('active');
      if (dotsWrap) dotsWrap.children[current].classList.remove('active');
      current = next;
      slides[current].classList.add('active');
      if (dotsWrap) dotsWrap.children[current].classList.add('active');
    };

    if (dotsWrap) {
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Go to image ' + (i + 1));
        dot.addEventListener('click', () => { goTo(i); resetTimer(); });
        dotsWrap.appendChild(dot);
      });
    }

    function resetTimer() {
      clearInterval(timer);
      timer = setInterval(() => goTo(current + 1), 4500);
    }

    slides[0].classList.add('active');
    if (dotsWrap) dotsWrap.children[0].classList.add('active');
    resetTimer();

    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', resetTimer);
  });

})();
