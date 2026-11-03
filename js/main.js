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
      var targets = document.querySelectorAll(
        ".head, .intro__text, .essence__item, .company, .steps li, .cut, .esg__item, .news__item, .form"
      );
      var revealer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealer.unobserve(entry.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px" });
      targets.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) return; // lo que ya está en pantalla no se oculta
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
      var start = performance.now();
      var dur = 1400;
      function tick(now) {
        var t = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = format(Math.round(end * eased), el);
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

  /* Enlaces con área: preseleccionan el asunto en el formulario */
  var areaSelect = document.getElementById("f-area");
  document.querySelectorAll("[data-area]").forEach(function (a) {
    a.addEventListener("click", function () { areaSelect.value = a.dataset.area; });
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
