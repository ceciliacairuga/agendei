/* views/assets/app/scripts/agendamentos.js */

(function () {
  "use strict";

  const tabs      = document.querySelectorAll(".filter-tab");
  const cards     = document.querySelectorAll(".appt-card");
  const emptyState = document.querySelector("#empty-state");

  function applyFilter(filter) {
    let visible = 0;

    cards.forEach(function (card) {
      const status = card.getAttribute("data-status");
      const show   = filter === "todos" || status === filter;
      card.classList.toggle("hidden", !show);
      if (show) visible++;
    });

    if (emptyState) emptyState.hidden = visible > 0;
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        t.classList.remove("filter-tab--active");
        t.setAttribute("aria-pressed", "false");
      });
      tab.classList.add("filter-tab--active");
      tab.setAttribute("aria-pressed", "true");
      applyFilter(tab.getAttribute("data-filter"));
    });
  });

  /* ── Botões de ação estáticos ── */
  document.querySelectorAll(".appt-card-actions .btn--danger").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const card  = btn.closest(".appt-card");
      const title = card.querySelector(".appt-card-title");
      const name  = title ? title.textContent : "agendamento";
      if (confirm("Deseja cancelar o agendamento de " + name + "?")) {
        card.setAttribute("data-status", "cancelado");
        const badge = card.querySelector(".badge");
        if (badge) {
          badge.className  = "badge badge--red";
          badge.textContent = "Cancelado";
        }
        btn.remove();
        const body = card.querySelector(".appt-card-body");
        if (body) body.classList.add("appt-card-body--cancelled");
      }
    });
  });

  /* ── Animação de entrada ── */
  const style = document.createElement("style");
  style.textContent = ".revealed { opacity: 1 !important; transform: translateY(0) !important; }";
  document.head.appendChild(style);

  const obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("revealed"); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });

  cards.forEach(function (el, i) {
    el.style.opacity    = "0";
    el.style.transform  = "translateY(16px)";
    el.style.transition = "opacity 0.35s ease " + (i * 0.08) + "s, transform 0.35s ease " + (i * 0.08) + "s";
    obs.observe(el);
  });

  const btnNovoAgendamento = document.querySelector("#new-appt-btn");
  btnNovoAgendamento.addEventListener("click", function () {
  window.location.href = "novo-agendamento.html";
});


})();
