/* views/assets/app/scripts/dashboard.js */

(function () {
  "use strict";

  /* ── Service tiles feedback ── */
  const tiles = document.querySelectorAll(".service-tile");

  tiles.forEach(function (tile) {
    tile.addEventListener("click", function () {
      const name = tile.querySelector("p");
      if (name) {
        window.location.href = "agendamentos.html";
      }
    });
  });

  /* ── Animação de entrada ── */
  const style = document.createElement("style");
  style.textContent = ".revealed { opacity: 1 !important; transform: translateY(0) !important; }";
  document.head.appendChild(style);

  const items = document.querySelectorAll(".metric-card, .appt-item, .service-tile, .next-appt-card");
  const obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  items.forEach(function (el, i) {
    el.style.opacity   = "0";
    el.style.transform = "translateY(18px)";
    el.style.transition = "opacity 0.4s ease " + (i * 0.07) + "s, transform 0.4s ease " + (i * 0.07) + "s";
    obs.observe(el);
  });

})();
