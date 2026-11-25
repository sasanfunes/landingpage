/* Asistente virtual de Grupo STF
 * Widget de chat sin dependencias. Habla con la Edge Function «chat» de Supabase.
 * Configuración en index.html, en la etiqueta <script id="stf-chat" ...>:
 *   data-endpoint   URL de la función, p. ej. https://XXXX.supabase.co/functions/v1/chat
 *   data-anon-key   (opcional) clave anon pública, solo si la función exige JWT
 */
(function () {
  "use strict";

  var script = document.getElementById("stf-chat") || document.currentScript;
  var endpoint = script && script.dataset.endpoint ? script.dataset.endpoint.trim() : "";
  var anonKey = script && script.dataset.anonKey ? script.dataset.anonKey.trim() : "";
  var configured = /^https:\/\/.+/.test(endpoint) && endpoint.indexOf("TU-PROYECTO") === -1;

  var STORE = "stf-chat-v1";
  var GREETING = "Hola. Soy el asistente virtual de Grupo STF. ¿En qué le puedo ayudar?";
  var SUGGESTIONS = ["¿Qué hace Grupo STF?", "¿Qué empresas forman el Grupo?", "¿Qué vacantes tienen abiertas?", "¿Cómo solicito una cotización?"];
  var MAX_LEN = 1000;

  var history = [];
  try { history = JSON.parse(sessionStorage.getItem(STORE) || "[]"); } catch (e) { history = []; }
  function save() { try { sessionStorage.setItem(STORE, JSON.stringify(history.slice(-30))); } catch (e) { /* sin almacenamiento */ } }

  var icon = {
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    send: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
  };

  /* ---------- Estructura ---------- */
  var root = document.createElement("div");
  root.className = "chat";
  root.innerHTML =
    '<button class="chat__launcher" type="button" aria-expanded="false" aria-controls="chat-panel">' +
      '<span class="chat__launcher-icon chat__launcher-icon--open">' + icon.chat + '</span>' +
      '<span class="chat__launcher-icon chat__launcher-icon--close">' + icon.close + '</span>' +
      '<span class="chat__launcher-label">¿Tiene dudas?</span>' +
    '</button>' +
    '<section class="chat__panel tone-dark" id="chat-panel" role="dialog" aria-modal="false" aria-labelledby="chat-title" hidden>' +
      '<header class="chat__head">' +
        '<div><p class="chat__over">Grupo STF</p><h2 class="chat__title" id="chat-title">Asistente virtual</h2></div>' +
        '<button class="chat__close" type="button" aria-label="Cerrar chat">' + icon.close + '</button>' +
      '</header>' +
      '<div class="chat__log" role="log" aria-live="polite" aria-relevant="additions"></div>' +
      '<div class="chat__suggest" role="group" aria-label="Preguntas sugeridas"></div>' +
      '<form class="chat__form" novalidate>' +
        '<label class="sr-only" for="chat-input">Escriba su pregunta</label>' +
        '<textarea id="chat-input" class="chat__input" rows="1" maxlength="' + MAX_LEN + '" placeholder="Escriba su pregunta…" autocomplete="off"></textarea>' +
        '<button class="chat__send" type="submit" aria-label="Enviar">' + icon.send + '</button>' +
      '</form>' +
      '<p class="chat__note">Respuestas generadas por IA. Para trámites formales, use el <a href="#contacto">formulario de contacto</a>.</p>' +
    '</section>';
  document.body.appendChild(root);

  var launcher = root.querySelector(".chat__launcher");
  var panel = root.querySelector(".chat__panel");
  var closeBtn = root.querySelector(".chat__close");
  var log = root.querySelector(".chat__log");
  var suggest = root.querySelector(".chat__suggest");
  var form = root.querySelector(".chat__form");
  var input = root.querySelector(".chat__input");
  var sendBtn = root.querySelector(".chat__send");
  var busy = false;

  /* ---------- Mensajes ---------- */
  function bubble(role, text, extraClass) {
    var el = document.createElement("div");
    el.className = "chat__msg chat__msg--" + role + (extraClass ? " " + extraClass : "");
    el.textContent = text; // siempre texto plano: nunca se inyecta HTML de la respuesta
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function renderAll() {
    log.innerHTML = "";
    bubble("assistant", GREETING);
    history.forEach(function (m) { bubble(m.role, m.content); });
    suggest.hidden = history.length > 0;
  }

  SUGGESTIONS.forEach(function (q) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chat__chip";
    b.textContent = q;
    b.addEventListener("click", function () { send(q); });
    suggest.appendChild(b);
  });

  function typing() {
    var el = bubble("assistant", "", "chat__msg--typing");
    el.setAttribute("aria-label", "El asistente está escribiendo");
    el.innerHTML = "<span></span><span></span><span></span>";
    return el;
  }

  function setBusy(v) {
    busy = v;
    sendBtn.disabled = v;
    input.setAttribute("aria-busy", String(v));
  }

  function send(text) {
    text = (text || "").trim().slice(0, MAX_LEN);
    if (!text || busy) return;
    suggest.hidden = true;
    history.push({ role: "user", content: text });
    save();
    bubble("user", text);
    input.value = "";
    autosize();

    if (!configured) {
      bubble("assistant", "El asistente aún no está conectado. Mientras tanto, puede escribirnos por el formulario de contacto.", "chat__msg--error");
      return;
    }

    setBusy(true);
    var dots = typing();
    var headers = { "Content-Type": "application/json" };
    if (anonKey) { headers.Authorization = "Bearer " + anonKey; headers.apikey = anonKey; }

    fetch(endpoint, { method: "POST", headers: headers, body: JSON.stringify({ messages: history.slice(-16) }) })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok || !data.reply) throw new Error(data.error || "No pudimos obtener una respuesta. Intente de nuevo.");
          return data.reply;
        });
      })
      .then(function (reply) {
        dots.remove();
        history.push({ role: "assistant", content: reply });
        save();
        bubble("assistant", reply);
      })
      .catch(function (err) {
        dots.remove();
        // El mensaje fallido se retira del historial para poder reintentarlo
        history.pop();
        save();
        var msg = err && err.message && err.message !== "Failed to fetch" ? err.message : "No hay conexión con el asistente. Intente de nuevo.";
        bubble("assistant", msg, "chat__msg--error");
        input.value = text;
        autosize();
      })
      .then(function () { setBusy(false); input.focus(); });
  }

  /* ---------- Interacción ---------- */
  function autosize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  }

  function setOpen(open) {
    panel.hidden = !open;
    root.classList.toggle("is-open", open);
    launcher.setAttribute("aria-expanded", String(open));
    launcher.setAttribute("aria-label", open ? "Cerrar asistente virtual" : "Abrir asistente virtual");
    if (open) {
      log.scrollTop = log.scrollHeight;
      if (window.matchMedia("(hover: hover)").matches) input.focus();
    }
  }

  launcher.addEventListener("click", function () { setOpen(panel.hidden); });
  closeBtn.addEventListener("click", function () { setOpen(false); launcher.focus(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) { setOpen(false); launcher.focus(); }
  });
  panel.querySelector(".chat__note a").addEventListener("click", function () { setOpen(false); });

  form.addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });
  input.addEventListener("input", autosize);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(input.value); }
  });

  launcher.setAttribute("aria-label", "Abrir asistente virtual");
  renderAll();
})();
