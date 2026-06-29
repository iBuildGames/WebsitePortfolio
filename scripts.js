/* =============================================================
   PORTFOLIO SCRIPTS
   ============================================================= */

/* ── Navbar: shadow on scroll + active link highlight ───────── */
(function () {
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-btn[href^="#"]');

  window.addEventListener('scroll', () => {
    // Scrolled shadow
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active section highlight
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 120) {
        current = section.id;
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
})();

/* ── Hamburger menu ─────────────────────────────────────────── */
(function () {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  // Close menu when a link is clicked (mobile)
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    }
  });
})();

/* ── Video thumbnails: load YouTube thumbnail images ─────────── */
document.querySelectorAll('.video-thumb').forEach(thumb => {
  const videoId = thumb.getAttribute('data-video');
  const img = thumb.querySelector('.thumb-img');
  if (img && videoId) {
    img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
});

/* ── Video carousel — infinite loop ─────────────────────────── */
/*
 * Strategy: clone all real cards at both ends of the row.
 * Layout: [ ...clones-of-end ] [ ...real cards ] [ ...clones-of-start ]
 *
 * We start with the row offset so the first REAL card is visible.
 * When the user scrolls into a clone region, we silently teleport
 * (no animation) to the mirrored real card, then continue animating.
 * This makes it feel like there are infinitely many cards.
 */
(function () {
  const row      = document.getElementById('showcaseRow');
  const viewport = document.getElementById('showcaseViewport');
  const leftBtn  = document.getElementById('arrowLeft');
  const rightBtn = document.getElementById('arrowRight');
  const dotsWrap = document.getElementById('carouselDots');

  if (!row || !viewport) return;

  const GAP = 24; // must match .showcase-row gap in CSS

  // ── 1. Capture real cards before cloning ──────────────────────
  const realCards = Array.from(row.children);
  const total     = realCards.length;

  // ── 2. Prepend clones of the END cards (for scrolling left) ───
  const prependClones = realCards.map(c => {
    const cl = c.cloneNode(true);
    cl.setAttribute('aria-hidden', 'true');
    return cl;
  });
  prependClones.reverse().forEach(cl => row.insertBefore(cl, row.firstElementChild));

  // ── 3. Append clones of the START cards (for scrolling right) ─
  const appendClones = realCards.map(c => {
    const cl = c.cloneNode(true);
    cl.setAttribute('aria-hidden', 'true');
    return cl;
  });
  appendClones.forEach(cl => row.appendChild(cl));

  // After cloning: all children = [ total prepend clones | real cards | total append clones ]
  // Index of the first real card inside row.children:
  const realOffset = total; // (prepended `total` clones before real cards)

  // ── 4. Dots (one per real card) ────────────────────────────────
  let dotIndex = 0; // 0-based index into real cards
  realCards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => jumpTo(i, true));
    dotsWrap.appendChild(dot);
  });

  function updateDots(i) {
    dotIndex = ((i % total) + total) % total;
    dotsWrap.querySelectorAll('.dot').forEach((dot, idx) => {
      dot.classList.toggle('active', idx === dotIndex);
    });
  }

  // ── 5. Core positioning ────────────────────────────────────────
  // `position` is the absolute child index in row.children we want to show
  let position = realOffset; // start showing the first real card

  function cw() {
    // Card width + gap (use first real card for measurement)
    return realCards[0].getBoundingClientRect().width + GAP;
  }

  function setPosition(pos, animate) {
    position = pos;
    row.style.transition = animate
      ? 'transform 0.4s cubic-bezier(0.4,0,0.2,1)'
      : 'none';
    row.style.transform = `translateX(-${position * cw()}px)`;
    updateDots(position - realOffset);
  }

  // Initialise without animation
  setPosition(realOffset, false);

  // ── 6. After each animated transition: check if we're in a clone ─
  row.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'transform') return;

    // Scrolled too far right → we're in the append-clone region
    if (position >= realOffset + total) {
      const equivalent = position - total; // matching real (or prepend clone) position
      setPosition(equivalent, false);
    }
    // Scrolled too far left → we're in the prepend-clone region
    else if (position < realOffset) {
      const equivalent = position + total;
      setPosition(equivalent, false);
    }
  });

  // ── 7. Navigation helpers ──────────────────────────────────────
  function next() { setPosition(position + 1, true); }
  function prev() { setPosition(position - 1, true); }

  function jumpTo(realIdx, animate) {
    setPosition(realOffset + realIdx, animate);
  }

  leftBtn.addEventListener('click',  prev);
  rightBtn.addEventListener('click', next);

  // ── 8. Touch / swipe ──────────────────────────────────────────
  let touchStartX = 0;
  viewport.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  viewport.addEventListener('touchend', e => {
    const dx = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) { dx > 0 ? next() : prev(); }
  });

  // ── 9. Keyboard ───────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });

  // ── 10. Recalculate on resize ─────────────────────────────────
  window.addEventListener('resize', () => {
    setPosition(position, false);
  });
})();

/* ── Video modal ─────────────────────────────────────────────── */
(function () {
  const modal  = document.getElementById('video-modal');
  const player = document.getElementById('ytPlayer');

  document.querySelectorAll('.video-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const videoId = thumb.getAttribute('data-video');
      player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  window.closeVideoModal = function () {
    modal.classList.remove('open');
    player.src = '';
    document.body.style.overflow = '';
  };

  // Close on backdrop click
  modal.addEventListener('click', e => {
    if (e.target === modal) closeVideoModal();
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeVideoModal();
    }
  });
})();

/* ── Gallery auto-scroll (infinite marquee) ──────────────────── */
(function () {
  const track = document.getElementById('galleryTrack');
  if (!track) return;

  // Clone all images for seamless loop
  const origImages = Array.from(track.children);
  origImages.forEach(img => {
    const clone = img.cloneNode(true);
    track.appendChild(clone);
  });

  let scrollX    = 0;
  let speed      = 0.8;
  let paused     = false;
  let rafId      = null;

  function getSetWidth() {
    // Width of the original set of images
    let w = 0;
    origImages.forEach(img => { w += img.offsetWidth + 20; }); // gap: 20px
    return w;
  }

  function step() {
    if (!paused) {
      scrollX += speed;
      const setWidth = getSetWidth();
      if (scrollX >= setWidth) {
        scrollX -= setWidth;
      }
      track.style.transform = `translateX(-${scrollX}px)`;
    }
    rafId = requestAnimationFrame(step);
  }

  rafId = requestAnimationFrame(step);

  track.addEventListener('mouseenter', () => { paused = true; });
  track.addEventListener('mouseleave', () => { paused = false; });
  track.addEventListener('touchstart', () => { paused = true; },  { passive: true });
  track.addEventListener('touchend',   () => { paused = false; });
})();

/* ── Contact section smooth scroll (intercept #contact nav) ──── */
document.querySelectorAll('a[href="#contact"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const target = document.getElementById('contact');
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
    // Close mobile menu if open
    document.getElementById('hamburger').classList.remove('open');
    document.getElementById('navLinks').classList.remove('open');
  });
});