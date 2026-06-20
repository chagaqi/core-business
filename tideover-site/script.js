/* ============================================================
   TIDEOVER — landing page behavior
   Vanilla JS, no dependencies.
   - Gentle scroll-reveal (IntersectionObserver)
   - Subtle nav shadow once scrolled
   - prefers-reduced-motion fully honored
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    // Show everything immediately — no motion.
    for (var i = 0; i < revealEls.length; i++) {
      revealEls[i].classList.add('is-visible');
    }
  } else {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Nav shadow on scroll ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var ticking = false;
    var setNav = function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    };
    setNav();
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(setNav);
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---------- Smooth in-page focus handoff ---------- */
  // Move focus to the target section after an anchor jump (a11y).
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function () {
      var id = link.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      // After the smooth scroll, make the target focusable for keyboard users.
      window.setTimeout(function () {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }, reduceMotion ? 0 : 420);
    });
  });
})();
