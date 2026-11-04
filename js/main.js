(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Año del pie */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* Header: sombra al hacer scroll */
  var header = document.querySelector(".header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Menú móvil */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  }
  toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
  });

  /* Enlace activo según la sección visible */
  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]:not(.btn)'));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });

    /* Aparición suave de bloques (el contenido ya es visible sin JS) */
    if (!reduceMotion) {
      var revealSel = ".head > p, .head > .link, .statement, .essence__item:not(.essence__item--dark), .values li, .company, .news__item:not(.news__item--feature), .talent .subtitle, .talent__areas, .talent__actions, .jobs__bar, .job, .form";
      var targets = document.querySelectorAll(revealSel);
      targets.selector = revealSel;
      var revealer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.classList.add("is-visible");
          revealer.unobserve(el);
          // Al terminar, se retira la clase para que el hover use sus propias transiciones
          setTimeout(function () { el.classList.remove("reveal", "is-visible"); el.style.removeProperty("--i"); }, 1000);
        });
      }, { rootMargin: "0px 0px -8% 0px" });
      targets.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) return; // lo que ya está en pantalla no se oculta
        // Escalonado: posición del elemento entre sus hermanos animados (máx. 5)
        var i = 0, sib = el.previousElementSibling;
        while (sib) { if (sib.matches(targets.selector)) i++; sib = sib.previousElementSibling; }
        el.style.setProperty("--i", Math.min(i, 5));
        el.classList.add("reveal");
        revealer.observe(el);
      });
    }

    /* Contadores de cifras clave */
    var counters = document.querySelectorAll("[data-count]");
    function format(n, el) {
      return el.dataset.format === "thousands" ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : String(n);
    }
    function run(el) {
      var end = parseInt(el.dataset.count, 10);
      var pad = parseInt(el.dataset.pad || "0", 10);
      var start = performance.now();
      var dur = 1000;
      function tick(now) {
        var t = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        var v = format(Math.round(end * eased), el);
        el.textContent = pad ? v.padStart(pad, "0") : v;
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    if (!reduceMotion) {
      var counterObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { run(entry.target); counterObs.unobserve(entry.target); }
        });
      }, { threshold: .6 });
      counters.forEach(function (c) { counterObs.observe(c); });
    }
  }

  /* ---------- Dinamismo ---------- */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var progressBar = document.querySelector(".progress span");
  var lastY = window.scrollY, ticking = false;
  var darkZones = Array.prototype.slice.call(document.querySelectorAll(".hero, .band--dark, .footer"));

  // Progreso de lectura y encabezado que se oculta al bajar
  function onFrame() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
    if (!nav.classList.contains("is-open")) {
      if (y > lastY + 6 && y > 420) header.classList.add("is-hidden");
      else if (y < lastY - 6 || y < 420) header.classList.remove("is-hidden");
    }
    // Tono de la barra según la sección que pasa por debajo
    var probe = header.getBoundingClientRect().top + 14 + 38;
    var dark = darkZones.some(function (z) { var r = z.getBoundingClientRect(); return r.top <= probe && r.bottom >= probe; });
    header.classList.toggle("is-dark", dark);
    lastY = y;
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onFrame); }
  }, { passive: true });
  header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });
  onFrame();
  window.addEventListener("resize", onFrame);

  if (!reduceMotion && "IntersectionObserver" in window) {
    // Titulares de sección: se dividen en palabras
    var heads = document.querySelectorAll(".head h2, .split__aside h2, .talent h2, .contact__info h2");
    heads.forEach(function (h) {
      var text = h.textContent.trim();
      h.setAttribute("aria-label", text);
      h.innerHTML = text.split(/\s+/).map(function (word, i) {
        return '<span class="w" aria-hidden="true" style="--w:' + i + '"><span>' + word + "</span></span>";
      }).join(" ");
      h.classList.add("words");
    });

    // Bloques oscuros que se abren como cortina
    var wipes = document.querySelectorAll(".essence__item--dark, .news__item--feature, .contact__info");
    wipes.forEach(function (el) { el.classList.add("wipe"); });

    var inObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-in");
        inObs.unobserve(el);
        // Los titulares dentro de una cortina entran cuando esta se abre
        if (el.classList.contains("wipe")) {
          setTimeout(function () { el.querySelectorAll(".words").forEach(function (h) { h.classList.add("is-in"); }); }, 350);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    heads.forEach(function (h) { if (!h.closest(".wipe")) inObs.observe(h); });
    wipes.forEach(function (w) { inObs.observe(w); });

    // Profundidad del hero: el símbolo responde al scroll y al puntero con un muelle suave
    var hero = document.querySelector(".hero");
    var mTop = document.querySelector(".hero__symbol .m-top");
    var mBottom = document.querySelector(".hero__symbol .m-bottom");
    if (hero && mTop && mBottom && getComputedStyle(document.querySelector(".hero__art")).display !== "none") {
      var target = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, heroVisible = true, raf = null;
      function loop() {
        cur.x += (target.x - cur.x) * 0.08;
        cur.y += (target.y - cur.y) * 0.08;
        var s = Math.min(window.scrollY, hero.offsetHeight);
        // El símbolo se mueve como una sola pieza: sus módulos nunca se separan
        var t = "translate(" + (cur.x * 18) + "px," + (cur.y * 18 - s * 0.12) + "px)";
        mTop.style.transform = t;
        mBottom.style.transform = t;
        var settled = Math.abs(target.x - cur.x) < 0.001 && Math.abs(target.y - cur.y) < 0.001;
        raf = settled ? null : requestAnimationFrame(loop);
      }
      function kick() { if (!raf && heroVisible) raf = requestAnimationFrame(loop); }
      if (finePointer) {
        hero.addEventListener("pointermove", function (e) {
          var r = hero.getBoundingClientRect();
          target.x = (e.clientX - r.left) / r.width - 0.5;
          target.y = (e.clientY - r.top) / r.height - 0.5;
          kick();
        });
        hero.addEventListener("pointerleave", function () { target.x = 0; target.y = 0; kick(); });
      }
      window.addEventListener("scroll", function () { cur.x += 0.0011; kick(); }, { passive: true });
      new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; kick(); }).observe(hero);
    }

    // Luz que sigue al puntero en tarjetas
    if (finePointer) {
      document.querySelectorAll(".company, .job a").forEach(function (card) {
        card.addEventListener("pointermove", function (e) {
          var r = card.getBoundingClientRect();
          card.style.setProperty("--mx", (e.clientX - r.left) + "px");
          card.style.setProperty("--my", (e.clientY - r.top) + "px");
        });
      });
    }
  }

  /* Enlaces con área: preseleccionan el asunto en el formulario */
  var areaSelect = document.getElementById("f-area");
  document.querySelectorAll("[data-area]").forEach(function (a) {
    a.addEventListener("click", function () { areaSelect.value = a.dataset.area; });
  });

  /* Vacantes: filtro por empresa y postulación */
  var chips = document.querySelectorAll(".chip[data-filter]");
  var jobs = Array.prototype.slice.call(document.querySelectorAll(".job"));
  var jobsCount = document.getElementById("jobs-count");
  var jobsEmpty = document.getElementById("jobs-empty");
  function applyFilter(key) {
    var shown = jobs.filter(function (j) { return key === "todas" || j.dataset.company === key; });
    chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.filter === key)); });
    var n = shown.length;
    jobsCount.innerHTML = "<strong>" + n + "</strong> " + (n === 1 ? "vacante" : "vacantes");
    function swap() {
      jobs.forEach(function (j) { j.classList.remove("is-leaving", "is-entering"); j.hidden = shown.indexOf(j) === -1; });
      if (!reduceMotion) shown.forEach(function (j, i) { j.style.setProperty("--i", i); void j.offsetWidth; j.classList.add("is-entering"); });
      jobsEmpty.hidden = n > 0;
    }
    if (reduceMotion) { swap(); return; }
    var leaving = jobs.filter(function (j) { return !j.hidden && shown.indexOf(j) === -1; });
    leaving.forEach(function (j) { j.classList.add("is-leaving"); });
    setTimeout(swap, leaving.length ? 160 : 0);
  }
  chips.forEach(function (c) { c.addEventListener("click", function () { applyFilter(c.dataset.filter); }); });

  // Al elegir una vacante, el formulario queda listo para postular
  document.querySelectorAll("[data-job]").forEach(function (a) {
    a.addEventListener("click", function () {
      var msg = document.getElementById("f-message");
      if (msg && !msg.value.trim()) msg.value = "Me interesa postular a la vacante: " + a.dataset.job + ".\n\n";
    });
  });

  /* Formulario de contacto (validación del lado del cliente) */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  var rules = {
    "f-name": function (v) { return v.trim().length >= 3 ? "" : "Indique su nombre y apellido."; },
    "f-email": function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Indique un correo válido, por ejemplo nombre@empresa.com."; },
    "f-area": function (v) { return v ? "" : "Seleccione el asunto de su consulta."; },
    "f-message": function (v) { return v.trim().length >= 10 ? "" : "Describa su consulta en al menos 10 caracteres."; },
    "f-consent": function (_, el) { return el.checked ? "" : "Para enviar la consulta, acepte el Aviso de Privacidad."; }
  };

  function validate(id) {
    var el = document.getElementById(id);
    var msg = rules[id](el.value, el);
    var err = document.getElementById(id + "-err");
    err.textContent = msg;
    el.closest(".field").classList.toggle("has-error", !!msg);
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    if (msg) el.setAttribute("aria-describedby", id + "-err"); else el.removeAttribute("aria-describedby");
    return !msg;
  }

  Object.keys(rules).forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "blur", function () {
      if (el.closest(".field").classList.contains("has-error") || el.value) validate(id);
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ids = Object.keys(rules);
    var results = ids.map(validate);
    var firstInvalid = ids[results.indexOf(false)];
    if (firstInvalid) {
      status.className = "form__status is-error";
      status.textContent = "Revise los campos marcados para enviar su consulta.";
      document.getElementById(firstInvalid).focus();
      return;
    }
    // TODO: conectar con el backend o servicio de formularios (Formspree, HubSpot, etc.).
    status.className = "form__status is-ok";
    status.textContent = "Gracias. Recibimos su consulta y le responderemos en un día hábil.";
    form.reset();
  });
})();
