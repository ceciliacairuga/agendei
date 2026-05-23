/* views/assets/admin/scripts/painel.js */

(function () {
  "use strict";

  /* ── Animação de entrada nos cards ── */
  const style = document.createElement("style");
  style.textContent = ".revealed { opacity: 1 !important; transform: translateY(0) !important; }";
  document.head.appendChild(style);

  const items = document.querySelectorAll(".kpi-card, .today-item, .pro-item, .quick-item");

  const obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  items.forEach(function (el, i) {
    el.style.opacity    = "0";
    el.style.transform  = "translateY(16px)";
    el.style.transition = "opacity 0.38s ease " + (i * 0.06) + "s, transform 0.38s ease " + (i * 0.06) + "s";
    obs.observe(el);
  });

  /* ── Botão novo agendamento (estático por ora) ── */
  const newBtn = document.querySelector(".btn--primary");
  if (newBtn) {
    newBtn.addEventListener("click", function () {
      alert("Funcionalidade de novo agendamento disponível na integração com a API.");
    });
  }

})();
