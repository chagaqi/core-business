/* ============================================================
   ADWIELD — lean interactions (no libraries)
   - scroll reveal via IntersectionObserver
   - count-up numbers on reveal
   - subtle living hero accent (pointer-tracked glow)
   All gated behind prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var rvs = Array.prototype.slice.call(document.querySelectorAll(".rv"));
  var counters = Array.prototype.slice.call(document.querySelectorAll(".cu"));

  /* ---- count-up ---- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute("data-to")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = to + suffix; return; }
    var dur = 900, start = null;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min(1, (ts - start) / dur);
      var e = 1 - Math.pow(1 - t, 3); // easeOutCubic
      el.textContent = Math.round(to * e) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---- reveal + counters via IntersectionObserver ---- */
  if (reduce || !("IntersectionObserver" in window)) {
    rvs.forEach(function (el) { el.classList.add("in"); });
    counters.forEach(countUp);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("in");
        // fire any counters living inside this revealed block
        Array.prototype.slice.call(el.querySelectorAll(".cu")).forEach(function (c) {
          if (!c.__done) { c.__done = true; countUp(c); }
        });
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });

    rvs.forEach(function (el) { io.observe(el); });

    // counters that aren't wrapped in a .rv get their own observer
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var c = entry.target;
        if (!c.__done) { c.__done = true; countUp(c); }
        io2.unobserve(c);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) {
      if (!c.closest(".rv")) io2.observe(c);
    });
  }

  /* ---- subtle living hero accent: glow drifts toward pointer ---- */
  if (!reduce) {
    var tx = 50, ty = 50, cx = 50, cy = 50, raf = null;
    function loop() {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      document.body.style.setProperty("--gx", cx.toFixed(2) + "%");
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }
    window.addEventListener("pointermove", function (e) {
      tx = (e.clientX / window.innerWidth) * 100;
      // clamp vertical so the glow stays an upper-band accent
      ty = Math.min(40, (e.clientY / window.innerHeight) * 100);
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
  }
})();
