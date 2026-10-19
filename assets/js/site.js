/* chloepyrah.com: small interactions from the design system.
   - Windows, notes and icons inside a .cp-desktop can be dragged (mouse, touch, arrow keys) on wide screens.
   - Window dots: red shakes, mustard folds the window, teal brings it to the front.
*/
(function () {
  var wide = window.matchMedia("(min-width: 761px)");
  var topZ = 10;

  function place(el) {
    if (wide.matches) {
      el.style.left = (el.dataset.x || 0) + "px";
      el.style.top = (el.dataset.y || 0) + "px";
    } else {
      el.style.left = el.style.top = "";
    }
  }

  function raise(el) { topZ += 1; el.style.zIndex = topZ; }

  function play(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener("animationend", function done() { el.classList.remove(cls); el.removeEventListener("animationend", done); });
  }

  document.querySelectorAll("[data-drag]").forEach(function (el) {
    place(el);
    el.classList.add("cp-draggable");
    if (!el.hasAttribute("tabindex") && el.tagName !== "A" && el.tagName !== "BUTTON") el.tabIndex = 0;
    var handle = el.querySelector(".cp-win-handle") || el;

    handle.addEventListener("pointerdown", function (e) {
      if (!wide.matches || e.button !== 0) return;
      if (e.target.closest("[data-cp-nodrag]")) return;
      var parent = el.offsetParent, sx = e.clientX, sy = e.clientY;
      var ox = el.offsetLeft, oy = el.offsetTop, moved = false;
      raise(el); el.classList.add("is-dragging");
      function move(ev) {
        var nx = ox + ev.clientX - sx, ny = oy + ev.clientY - sy;
        if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 3) moved = true;
        nx = Math.max(-el.offsetWidth / 2, Math.min(parent.clientWidth - el.offsetWidth / 2, nx));
        ny = Math.max(0, Math.min(parent.clientHeight - 40, ny));
        el.style.left = nx + "px"; el.style.top = ny + "px";
      }
      function up() {
        el.classList.remove("is-dragging");
        window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
        if (moved) el.addEventListener("click", function stop(ev) { ev.preventDefault(); el.removeEventListener("click", stop, true); }, true);
      }
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
      e.preventDefault();
    });

    el.addEventListener("keydown", function (e) {
      if (!wide.matches || e.target !== el) return;
      var s = e.shiftKey ? 32 : 8;
      var m = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[e.key];
      if (!m) return;
      e.preventDefault(); raise(el);
      el.style.left = el.offsetLeft + m[0] + "px";
      el.style.top = Math.max(0, el.offsetTop + m[1]) + "px";
    });
    el.addEventListener("focus", function () { if (wide.matches) raise(el); });
  });

  wide.addEventListener("change", function () { document.querySelectorAll("[data-drag]").forEach(place); });

  document.querySelectorAll(".cp-win").forEach(function (win) {
    var body = win.querySelector(".cp-win-body");
    var min = win.querySelector(".cp-dot-min");
    function toggle() {
      var collapsed = win.classList.toggle("is-collapsed");
      if (body) body.hidden = collapsed;
      if (min) { min.setAttribute("aria-expanded", String(!collapsed)); min.setAttribute("aria-label", collapsed ? "Expand window" : "Collapse window"); }
    }
    var close = win.querySelector(".cp-dot-close"), max = win.querySelector(".cp-dot-max");
    if (close) close.addEventListener("click", function () { play(win, "cp-shake"); });
    if (min) min.addEventListener("click", toggle);
    if (max) max.addEventListener("click", function () { raise(win); play(win, "cp-rise"); });
    var handle = win.querySelector(".cp-win-handle");
    if (handle) handle.addEventListener("dblclick", function (e) { if (!e.target.closest("[data-cp-nodrag]")) toggle(); });
  });
})();
