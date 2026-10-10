/* Maven Hair — interactions */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Séquence d'entrée */
  window.addEventListener("load", function () {
    document.body.classList.add("loaded");
  });
  /* filet de sécurité si "load" tarde (vidéo, réseau lent) */
  setTimeout(function () { document.body.classList.add("loaded"); }, 1800);

  /* certains navigateurs bloquent l'autoplay : on relance les vidéos muettes */
  if (!reduced) {
    var wakeVideos = function () {
      document.querySelectorAll("video[autoplay], video[data-active]").forEach(function (v) {
        if (v.paused) v.play().catch(function () {});
      });
    };
    setTimeout(wakeVideos, 600);
    document.addEventListener("visibilitychange", wakeVideos);
    window.addEventListener("scroll", wakeVideos, { passive: true, once: false });
  }

  /* Header : fond au scroll + retrait à la descente */
  var header = document.querySelector(".site-header");
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("scrolled", y > 40);
    if (!document.body.classList.contains("menu-open")) {
      header.classList.toggle("hidden", y > 480 && y > lastY);
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Menu mobile */
  var burger = document.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) header.classList.remove("hidden");
    });
    document.querySelectorAll(".mobile-menu a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("menu-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Révélations au scroll */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  document.querySelectorAll(".reveal, .mask-img").forEach(function (el) { io.observe(el); });

  /* Liste des services : image flottante au survol (desktop) */
  var float = document.querySelector(".service-float");
  var fine = window.matchMedia("(pointer: fine)").matches;
  if (float && fine && !reduced) {
    var imgs = float.querySelectorAll("img");
    var rows = document.querySelectorAll(".service-row[data-img]");
    rows.forEach(function (row, i) {
      row.addEventListener("mouseenter", function () {
        float.classList.add("on");
        imgs.forEach(function (im, j) { im.classList.toggle("on", i === j); });
      });
      row.addEventListener("mouseleave", function () { float.classList.remove("on"); });
    });
    document.addEventListener("mousemove", function (e) {
      if (!float.classList.contains("on")) return;
      float.style.left = Math.min(e.clientX + 32, window.innerWidth - 260) + "px";
      float.style.top = (e.clientY - 140) + "px";
    }, { passive: true });
  }

  /* Témoignages */
  var slides = document.querySelectorAll(".quote-slide");
  if (slides.length) {
    var idx = 0, count = slides.length;
    var current = document.querySelector(".quotes-count .cur");
    function show(n) {
      idx = (n + count) % count;
      slides.forEach(function (s, i) { s.classList.toggle("active", i === idx); });
      if (current) current.textContent = String(idx + 1).padStart(2, "0");
    }
    var prev = document.querySelector(".quotes-nav .prev");
    var next = document.querySelector(".quotes-nav .next");
    if (prev) prev.addEventListener("click", function () { show(idx - 1); resetAuto(); });
    if (next) next.addEventListener("click", function () { show(idx + 1); resetAuto(); });
    var auto = null;
    function resetAuto() {
      if (reduced) return;
      clearInterval(auto);
      auto = setInterval(function () { show(idx + 1); }, 7000);
    }
    show(0);
    resetAuto();
  }

  /* Vidéos sous la ligne de flottaison : chargées et lancées à l'approche */
  var lazyVids = document.querySelectorAll("video[data-lazyplay]");
  if (lazyVids.length) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        vio.unobserve(e.target);
        e.target.preload = "auto";
        e.target.dataset.active = "1";
        if (!reduced) e.target.play().catch(function () {});
      });
    }, { rootMargin: "320px" });
    lazyVids.forEach(function (v) { vio.observe(v); });
  }

  /* Tracés japonais (Ensō, ligne zen, Seigaiha) : dessin au scroll */
  var drawSvgs = document.querySelectorAll(".draw-svg");
  if (drawSvgs.length && !reduced) {
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("go");
          dio.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    drawSvgs.forEach(function (svg) {
      svg.querySelectorAll("path, circle").forEach(function (p) {
        var len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        p.style.transition = "stroke-dashoffset " + (p.dataset.dur || 2.6) + "s cubic-bezier(.4, 0, .2, 1) " + (p.dataset.delay || 0) + "s";
      });
      dio.observe(svg);
    });
  }

  /* Comparateurs avant / après */
  var compares = document.querySelectorAll(".ba-compare .frame");
  if (compares.length) {
    var baIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        baIO.unobserve(e.target);
        e.target.dataset.seen = "1";
        if (reduced) return;
        /* animation d'introduction : le curseur glisse de 16 % à 50 % */
        var start = null;
        var frame = e.target;
        function tick(ts) {
          if (frame.classList.contains("dragging")) return;
          if (!start) start = ts;
          var t = Math.min((ts - start) / 1100, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          frame.baSet(16 + (50 - 16) * eased);
          if (t < 1) requestAnimationFrame(tick);
        }
        frame.baSet(16);
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.35 });

    compares.forEach(function (frame) {
      var avant = frame.querySelector(".tag--avant");
      var apres = frame.querySelector(".tag--apres");

      frame.baSet = function (p) {
        p = Math.max(0, Math.min(100, p));
        frame.style.setProperty("--pos", p + "%");
        frame.setAttribute("aria-valuenow", Math.round(p));
        if (avant) avant.classList.toggle("off", p < 16);
        if (apres) apres.classList.toggle("off", p > 84);
      };

      function fromEvent(e) {
        var r = frame.getBoundingClientRect();
        frame.baSet(((e.clientX - r.left) / r.width) * 100);
      }

      frame.addEventListener("pointerdown", function (e) {
        frame.classList.add("dragging");
        try { frame.setPointerCapture(e.pointerId); } catch (err) { /* capture indisponible : le glisser direct reste fonctionnel */ }
        fromEvent(e);
      });
      frame.addEventListener("pointermove", function (e) {
        if (frame.classList.contains("dragging")) fromEvent(e);
      });
      ["pointerup", "pointercancel"].forEach(function (evt) {
        frame.addEventListener(evt, function () { frame.classList.remove("dragging"); });
      });

      frame.addEventListener("keydown", function (e) {
        var cur = parseFloat(frame.getAttribute("aria-valuenow")) || 50;
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") { frame.baSet(cur - 5); e.preventDefault(); }
        if (e.key === "ArrowRight" || e.key === "ArrowUp") { frame.baSet(cur + 5); e.preventDefault(); }
        if (e.key === "Home") { frame.baSet(0); e.preventDefault(); }
        if (e.key === "End") { frame.baSet(100); e.preventDefault(); }
      });

      baIO.observe(frame);
    });
  }

  /* Lightbox galerie */
  var lightbox = document.querySelector(".lightbox");
  if (lightbox) {
    var lbImg = lightbox.querySelector("img");
    document.querySelectorAll(".m-item, .lb-open").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var src = btn.getAttribute("data-full") || btn.querySelector("img").src;
        var alt = btn.querySelector("img") ? btn.querySelector("img").alt : "";
        lbImg.src = src;
        lbImg.alt = alt;
        lightbox.classList.add("on");
        document.body.style.overflow = "hidden";
      });
    });
    function closeLb() {
      lightbox.classList.remove("on");
      document.body.style.overflow = "";
    }
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox || e.target.classList.contains("close")) closeLb();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLb();
    });
  }
})();
