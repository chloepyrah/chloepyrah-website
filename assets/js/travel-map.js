/* TravelMap: dot-matrix world map with pins, zoom and region views. Vanilla JS, no dependencies.
   Usage: CPTravelMap(element, { places: [{name, region, lat, lon, notes, href}], caption, initial, regions }) */
(function (root) {
  var ROWS = ["000000b448003fffe00000000e003fc0080000", "000001c25ac01fff40000000400dfee2040000", "8000003e12f807ff4000000041abffffbfc000", "07fffff83d9c07ff00003fc00d9ffffffffffc", "d2ffffffff0f87f84000ffbfff7ffffffffffc", "01ffffffef8f07c07001effffffffffffffff8", "03fffffff01803800007cffffffffffffff3e0", "01c07fffe03d00000007cffffffffffffc0400", "00001ffffc1f80000042cffffffffffff80e00", "00000fffff7fc00001425fffffffffffe01800", "000003ffffbff0000177fffffffffffffe0800", "000001fffffc2000001ffffffffffffffa0000", "000001ffffff0800003ffffffffffffffa0000", "000001ffffff0000003ffebcffffffffe00000", "000001fffff8000001f09e0e7fffffff820000", "000001fffff0000001e217fe7ffffff7040000", "000000fffff0000001e08ffe7ffffffc840000", "000000ffffe0000000be00fffffffff1300000", "0000003fffc0000001ff803ffffffff8400000", "0000003fff80000003ffdffffffffff8000000", "00000017e08000000bffffbefffffff8000000", "00000007c00000000fffffbe1ffffff0000000", "00000001c00000000fffffdff0fffff4000000", "00000001c42000000fffffdfe07e7e00000000", "00000000fc2d00000fffffefe07c3e84000000", "00000000380000000fffffef00701f08000000", "00000000030000000ffffffe00300f80000000", "00000000010c00000ffffff900300706000000", "0000000000ffc00007ffffff00180801000000", "00000000003fe00003fffffe00080812000000", "00000000001ffc000001fffe00001430000000", "00000000003ffc000001fff8000008f0000000", "00000000007fff000001fff800000470300000", "00000000007fffc00001ffe000000768bc0000", "00000000007ffff00000ffe000000200075000", "00000000007ffff00000ffe0000000c00d0000", "00000000003ffff000007ff000000000004000", "00000000001fffe00000ffe000000000600000", "00000000000fffe00000fff100000001f30080", "000000000007ffc00001ffc600000007fe0008", "000000000003ffc00000ff8600000007ff8000", "000000000007ff8000007f840000003fff8000", "000000000003fe0000007f860000003fffe000", "000000000007fc0000007f000000003fffc000", "000000000007fc0000003f000000001fffe000", "000000000007f80000003e000000001f3fc000", "000000000007f800000010000000001817c000", "00000000000fe0000000000000000000078000", "00000000000f80000000000000000000000018", "00000000000e00000000000000000000010020", "40000000000f00000000000000000000000060", "00000000001c00000000000000000000000000", "00000000000e00000000000000000000000000", "00000000000c00000000000000000000000000", "00000000000a00000000000000000000000000", "00000000000000000000000000000000000000"];
  var STEP = 2.4, LAT0 = 76, COLS = 150, W = COLS * 10, H = ROWS.length * 10;
  var ZMIN = 1, ZMAX = 6;
  var REGIONS = [
    { label: "World", lon: 10, lat: 10, z: 1 },
    { label: "Americas", lon: -85, lat: 18, z: 2.2 },
    { label: "Europe", lon: 10, lat: 45, z: 4 },
    { label: "Asia", lon: 112, lat: 14, z: 2.6 }
  ];
  var SVGNS = "http://www.w3.org/2000/svg";
  function el(tag, cls, attrs) { var e = document.createElement(tag); if (cls) e.className = cls; if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function fx(lon) { return ((lon + 180) / STEP * 10) / W; }
  function fy(lat) { return ((LAT0 - lat) / STEP * 10) / H; }
  function dotsSvg() {
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.setAttribute("class", "cp-tmap-dots"); svg.setAttribute("aria-hidden", "true");
    var d = "";
    ROWS.forEach(function (hex, r) {
      for (var i = 0; i < hex.length; i++) {
        var n = parseInt(hex[i], 16);
        for (var b = 0; b < 4; b++) if (n & (8 >> b)) {
          var c = i * 4 + b; if (c >= COLS) continue;
          var x = c * 10 + 5 + (r % 2) * 5, y = r * 10 + 5;
          d += "M" + (x - 3.4) + " " + y + "a3.4 3.4 0 1 0 6.8 0a3.4 3.4 0 1 0 -6.8 0";
        }
      }
    });
    var path = document.createElementNS(SVGNS, "path"); path.setAttribute("d", d); svg.appendChild(path);
    return svg;
  }

  function CPTravelMap(host, opts) {
    var places = opts.places || [];
    var regions = opts.regions || REGIONS;
    host.innerHTML = "";
    host.classList.add("cp-tmap");
    if (opts.caption) { var cap = el("p", "cp-tmap-caption"); cap.textContent = opts.caption; host.appendChild(cap); }
    var stage = el("div", "cp-tmap-stage"); stage.style.aspectRatio = W + " / " + H;
    var world = el("div", "cp-tmap-world"); world.appendChild(dotsSvg()); stage.appendChild(world);
    var pinLayer = el("div", "cp-tmap-pins"); stage.appendChild(pinLayer);
    host.appendChild(stage);

    var view = { z: 1, cx: 0.5, cy: 0.5 }, open = null;
    var pins = places.map(function (p, i) {
      var b = el("button", "cp-tmap-pin", { type: "button", "aria-label": p.name, title: p.name, "aria-expanded": "false" });
      b.addEventListener("click", function (e) { e.stopPropagation(); setOpen(open === i ? null : i); });
      pinLayer.appendChild(b); return b;
    });

    var card = el("div", "cp-tmap-card", { role: "dialog" });
    card.hidden = true; host.appendChild(card);

    var regionBar = el("div", "cp-tmap-regions", { role: "group", "aria-label": "Map regions" });
    var regionBtns = regions.map(function (r) {
      var b = el("button", "cp-tmap-chip", { type: "button", "aria-pressed": "false" }); b.textContent = r.label;
      b.addEventListener("click", function () { goTo(r); }); regionBar.appendChild(b); return b;
    });
    stage.appendChild(regionBar);

    var zoomBar = el("div", "cp-tmap-zoom", { role: "group", "aria-label": "Zoom" });
    var zin = el("button", "cp-tmap-zbtn", { type: "button", "aria-label": "Zoom in" }); zin.textContent = "+";
    var zout = el("button", "cp-tmap-zbtn", { type: "button", "aria-label": "Zoom out" }); zout.textContent = "−";
    zin.addEventListener("click", function () { zoomBy(1.6); });
    zout.addEventListener("click", function () { zoomBy(1 / 1.6); });
    zoomBar.appendChild(zin); zoomBar.appendChild(zout); stage.appendChild(zoomBar);

    function clamp() {
      view.z = Math.max(ZMIN, Math.min(ZMAX, view.z));
      var hx = 0.5 / view.z, hy = 0.5 / view.z;
      view.cx = Math.max(hx, Math.min(1 - hx, view.cx));
      view.cy = Math.max(hy, Math.min(1 - hy, view.cy));
    }
    function screen(px, py) { return { x: 0.5 + (px - view.cx) * view.z, y: 0.5 + (py - view.cy) * view.z }; }
    function render() {
      clamp();
      world.style.transform = "translate(" + ((0.5 - view.cx * view.z) * 100) + "%, " + ((0.5 - view.cy * view.z) * 100) + "%) scale(" + view.z + ")";
      places.forEach(function (p, i) {
        var s = screen(fx(p.lon), fy(p.lat)), b = pins[i];
        b.style.left = (s.x * 100) + "%"; b.style.top = (s.y * 100) + "%";
        var out = s.x < -0.02 || s.x > 1.02 || s.y < -0.02 || s.y > 1.02;
        b.hidden = out;
      });
      zin.disabled = view.z >= ZMAX - 0.01; zout.disabled = view.z <= ZMIN + 0.01;
      regionBtns.forEach(function (b, i) {
        var r = regions[i], on = Math.abs(view.z - r.z) < 0.05 && Math.abs(view.cx - Math.max(0.5 / r.z, Math.min(1 - 0.5 / r.z, fx(r.lon)))) < 0.01;
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      placeCard();
    }
    function zoomBy(f) { view.z *= f; render(); }
    function goTo(r) { view.z = r.z; view.cx = fx(r.lon); view.cy = fy(r.lat); render(); }

    function setOpen(i) {
      open = i;
      pins.forEach(function (b, k) { b.classList.toggle("is-open", k === i); b.setAttribute("aria-expanded", k === i ? "true" : "false"); });
      if (i == null) { card.hidden = true; return; }
      var p = places[i], notes = p.notes || ["note one", "note two", "note three"];
      card.setAttribute("aria-label", p.name);
      card.innerHTML = "";
      var note = el("aside", "cp-note");
      var bar = el("div", "cp-note-bar"); var app = el("span", "cp-note-app"); app.textContent = "‹ " + (p.region || "travel notes");
      var x = el("button", "cp-tmap-close", { type: "button", "aria-label": "Close" }); x.textContent = "×";
      x.addEventListener("click", function () { setOpen(null); pins[i].focus(); });
      bar.appendChild(app); bar.appendChild(x); note.appendChild(bar);
      var t = el("p", "cp-note-title"); var m = el("mark"); m.textContent = p.name; t.appendChild(m); note.appendChild(t);
      var ul = el("ul", "cp-note-list"); notes.forEach(function (n) { var li = el("li"); li.textContent = n; ul.appendChild(li); }); note.appendChild(ul);
      if (p.href) { var a = el("a", "cp-tmap-more", { href: p.href }); a.textContent = "Read the guide →"; note.appendChild(a); }
      card.appendChild(note); card.hidden = false;
      placeCard();
    }
    var narrow = window.matchMedia("(max-width: 640px)");
    function placeCard() {
      if (open == null || card.hidden) return;
      if (narrow.matches) { card.style.left = card.style.top = ""; card.classList.remove("is-left", "is-up"); return; }
      var p = places[open], s = screen(fx(p.lon), fy(p.lat));
      var sx = stage.offsetLeft + s.x * stage.clientWidth, sy = stage.offsetTop + s.y * stage.clientHeight;
      card.style.left = sx + "px"; card.style.top = sy + "px";
      card.classList.toggle("is-left", s.x > 0.62);
      card.classList.toggle("is-up", s.y > 0.55);
      card.style.visibility = pins[open].hidden ? "hidden" : "";
    }

    // Drag to pan when zoomed in
    var drag = null;
    stage.addEventListener("pointerdown", function (e) {
      if (view.z <= 1.01 || e.target.closest("button")) return;
      drag = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy }; stage.classList.add("is-panning"); stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointermove", function (e) {
      if (!drag) return;
      view.cx = drag.cx - (e.clientX - drag.x) / stage.clientWidth / view.z;
      view.cy = drag.cy - (e.clientY - drag.y) / stage.clientHeight / view.z;
      render();
    });
    function endDrag() { drag = null; stage.classList.remove("is-panning"); }
    stage.addEventListener("pointerup", endDrag); stage.addEventListener("pointercancel", endDrag);

    host.addEventListener("keydown", function (e) { if (e.key === "Escape" && open != null) { var i = open; setOpen(null); pins[i].focus(); } });
    window.addEventListener("resize", placeCard);
    narrow.addEventListener("change", placeCard);

    render();
    if (opts.initial != null) setOpen(opts.initial);
    return { goTo: goTo, open: setOpen };
  }
  root.CPTravelMap = CPTravelMap;
})(window);
