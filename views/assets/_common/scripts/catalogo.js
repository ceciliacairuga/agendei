/* views/assets/_common/scripts/catalogo.js */

(function () {
  "use strict";

  /* ── Detecta contexto (app ou admin) pelo referrer ── */
  const backLink   = document.querySelector("#cat-back-link");
  const ctxBadge  = document.querySelector("#cat-context-badge");
  const referrer  = document.referrer;

  if (backLink && ctxBadge) {
    if (referrer.includes("/admin/")) {
      backLink.href = "../admin/painel.html";
      ctxBadge.textContent = "Área Admin";
      ctxBadge.style.background = "#1C1730";
      ctxBadge.style.color = "#fff";
    } else {
      backLink.href = "../app/dashboard.html";
      ctxBadge.textContent = "Área do Cliente";
    }
  }

  /* ── Filtros de categoria ── */
  const filterBtns = document.querySelectorAll(".cat-filter-btn");
  const cards      = document.querySelectorAll(".cat-card");
  const emptyState = document.querySelector("#cat-empty");
  const searchInput = document.querySelector("#cat-search");

  function applyFilters() {
    const activeCat = document.querySelector(".cat-filter-btn--active");
    const cat   = activeCat ? activeCat.getAttribute("data-cat") : "todos";
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    let visible = 0;

    cards.forEach(function (card) {
      const cardCat  = card.getAttribute("data-cat") || "";
      const cardName = card.getAttribute("data-name") || "";

      const matchCat   = cat === "todos" || cardCat === cat;
      const matchQuery = !query || cardName.includes(query);

      const show = matchCat && matchQuery;
      card.classList.toggle("hidden", !show);
      if (show) visible++;
    });

    if (emptyState) emptyState.hidden = visible > 0;
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) {
        b.classList.remove("cat-filter-btn--active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("cat-filter-btn--active");
      btn.setAttribute("aria-pressed", "true");
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  /* ── Animação de entrada ── */
  const style = document.createElement("style");
  style.textContent = ".cat-revealed { opacity: 1 !important; transform: translateY(0) !important; }";
  document.head.appendChild(style);

  const obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("cat-revealed");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  cards.forEach(function (card, i) {
    card.style.opacity    = "0";
    card.style.transform  = "translateY(18px)";
    card.style.transition = "opacity 0.38s ease " + (i * 0.06) + "s, transform 0.38s ease " + (i * 0.06) + "s";
    obs.observe(card);
  });

})();
