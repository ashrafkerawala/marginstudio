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

  /* ---- Staged reveals ---------------------------------------------------- */

  var items = document.querySelectorAll("[data-reveal]");

  function showAll() {
    for (var i = 0; i < items.length; i++) items[i].classList.add("is-in");
  }

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target); // reveal once, then forget it
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    for (var j = 0; j < items.length; j++) observer.observe(items[j]);
  }

  // If the user switches on reduced motion mid-visit, drop the effects.
  var onPrefChange = function () {
    if (!reduceMotion.matches) return;
    window.removeEventListener("pointermove", onPointerMove);
    root.style.setProperty("--mx", "0");
    root.style.setProperty("--my", "0");
    showAll();
  };

  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", onPrefChange);
  }
})();
