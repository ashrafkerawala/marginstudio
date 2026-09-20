/* Margin Studio — progressive enhancement only.
   With this file blocked or disabled the page is still complete:
   all content renders, only the parallax and staged reveals are lost. */

(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- Pointer parallax --------------------------------------------------
     Writes two normalised values (-1..1) as custom properties; the CSS
     decides what to do with them. Setting them through CSSOM rather than an
     inline style attribute keeps the strict CSP intact.
     A lerp on each frame smooths the motion so the stack trails the cursor
     instead of snapping to it. */

  var targetX = 0, targetY = 0;
  var currentX = 0, currentY = 0;
  var frame = null;

  function step() {
    currentX += (targetX - currentX) * 0.075;
    currentY += (targetY - currentY) * 0.075;

    root.style.setProperty("--mx", currentX.toFixed(4));
    root.style.setProperty("--my", currentY.toFixed(4));

    // Stop the loop once it has effectively settled; restart on next move.
    if (
      Math.abs(targetX - currentX) > 0.0005 ||
      Math.abs(targetY - currentY) > 0.0005
    ) {
      frame = requestAnimationFrame(step);
    } else {
      frame = null;
    }
  }

  function onPointerMove(event) {
    targetX = (event.clientX / window.innerWidth) * 2 - 1;
    targetY = (event.clientY / window.innerHeight) * 2 - 1;
    if (frame === null) frame = requestAnimationFrame(step);
  }

  // Pointer-driven depth only makes sense with a real hovering pointer.
  if (!reduceMotion.matches && window.matchMedia("(hover: hover)").matches) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
  }

  /* ---- Staged reveals ----------------------------------------------------
     These elements start at opacity:0, so whatever reveals them is load
     bearing — if it never runs, the page is blank. IntersectionObserver is
     the primary mechanism, but it only delivers callbacks while the document
     is actually rendering: open the site in a background tab and zero
     callbacks arrive until that tab is focused.

     That is recoverable, but it makes the whole page depend on one API
     firing. So a plain geometry check backs it up, driven by scroll, resize
     and visibilitychange. Any one of them is enough to reveal the content. */

  var pending = Array.prototype.slice.call(
    document.querySelectorAll("[data-reveal]")
  );

  function reveal(el) {
    el.classList.add("is-in");
    pending = pending.filter(function (other) {
      return other !== el;
    });
  }

  function revealAll() {
    pending.slice().forEach(reveal);
  }

  // Reveal anything currently on screen, without consulting the observer.
  function revealVisible() {
    if (!pending.length) return;
    var h = window.innerHeight || root.clientHeight;
    pending.slice().forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < h * 0.95 && rect.bottom > 0) reveal(el);
    });
  }

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealAll();
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target); // reveal once, then forget it
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    pending.forEach(function (el) {
      observer.observe(el);
    });

    // Backstop. rAF-throttled, and only ever touches what is still pending.
    var ticking = false;
    function onViewChange() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        revealVisible();
      });
    }

    window.addEventListener("scroll", onViewChange, { passive: true });
    window.addEventListener("resize", onViewChange, { passive: true });

    // A document that loads hidden gets no rendering lifecycle at all;
    // catch up the moment it becomes visible.
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") revealVisible();
    });

    onViewChange();
  }

  // If the user switches on reduced motion mid-visit, drop the effects.
  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", function () {
      if (!reduceMotion.matches) return;
      window.removeEventListener("pointermove", onPointerMove);
      root.style.setProperty("--mx", "0");
      root.style.setProperty("--my", "0");
      revealAll();
    });
  }
})();
