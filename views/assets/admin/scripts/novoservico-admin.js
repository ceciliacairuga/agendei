/* views/assets/admin/scripts/servicos.js */

(function () {
  "use strict";

  /* ── Referências ── */
  const rows       = document.querySelectorAll(".st-row");
  const searchInput = document.querySelector("#search-services");
  const filterCat  = document.querySelector("#filter-cat");
  const filterStatus = document.querySelector("#filter-status");
  const countLabel = document.querySelector("#count-label");
  const emptyState = document.querySelector("#empty-state");
  const overlay    = document.querySelector("#modal-overlay");
  const openBtn    = document.querySelector("#open-new-service");
  const closeBtn   = document.querySelector("#modal-close");
  const cancelBtn  = document.querySelector("#modal-cancel");

  /* ── Filtros ── */
  function applyFilters() {
    const query  = searchInput ? searchInput.value.toLowerCase() : "";
    const cat    = filterCat    ? filterCat.value    : "";
    const status = filterStatus ? filterStatus.value : "";

    let visible = 0;

    rows.forEach(function (row) {
      const name      = (row.getAttribute("data-name") || "").toLowerCase();
      const rowCat    = row.getAttribute("data-cat")    || "";
      const rowStatus = row.getAttribute("data-status") || "";

      const matchQuery  = !query  || name.includes(query);
      const matchCat    = !cat    || rowCat === cat;
      const matchStatus = !status || rowStatus === status;

      const show = matchQuery && matchCat && matchStatus;
      row.classList.toggle("hidden", !show);
      if (show) visible++;
    });

    if (countLabel) countLabel.textContent = visible + " serviço" + (visible !== 1 ? "s" : "");
    if (emptyState) emptyState.hidden = visible > 0;
  }

  if (searchInput) searchInput.addEventListener("input",  applyFilters);
  if (filterCat)   filterCat.addEventListener("change",   applyFilters);
  if (filterStatus) filterStatus.addEventListener("change", applyFilters);

  /* ── Toggle ativo/inativo ── */
  rows.forEach(function (row) {
    const toggleBtn = row.querySelector(".btn-toggle");
    if (!toggleBtn) return;

    toggleBtn.addEventListener("click", function () {
      const current = row.getAttribute("data-status");
      const badge   = row.querySelector(".badge");

      if (current === "ativo") {
        row.setAttribute("data-status", "inativo");
        row.classList.add("inactive");
        if (badge) { badge.className = "badge badge--red"; badge.textContent = "Inativo"; }
        toggleBtn.textContent = "Ativar";
        toggleBtn.className   = "btn btn--outline btn--sm btn-toggle";
      } else {
        row.setAttribute("data-status", "ativo");
        row.classList.remove("inactive");
        if (badge) { badge.className = "badge badge--green"; badge.textContent = "Ativo"; }
        toggleBtn.textContent = "Desativar";
        toggleBtn.className   = "btn btn--danger btn--sm btn-toggle";
      }

      applyFilters();
    });
  });

  /* ── Botão editar (estático) ── */
  document.querySelectorAll(".btn-edit").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const row  = btn.closest(".st-row");
      const name = row ? row.getAttribute("data-name") : "serviço";
      alert("Edição de \"" + name + "\" disponível na integração com a API.");
    });
  });

  /* ── Modal de novo serviço ── */
  function openModal() {
    if (!overlay) return;
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const first = overlay.querySelector("input, select, textarea");
    if (first) setTimeout(function () { first.focus(); }, 80);
  }

  function closeModal() {
    if (!overlay) return;
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    resetForm();
  }

  function resetForm() {
    const form = document.querySelector("#new-service-form");
    if (form) form.reset();
    ["svc-name-error","svc-cat-error","svc-price-error","svc-duration-error"].forEach(function (id) {
      const el = document.querySelector("#" + id);
      if (el) { el.hidden = true; el.textContent = ""; }
    });
    const success = document.querySelector("#svc-success");
    const err     = document.querySelector("#svc-error");
    if (success) success.hidden = true;
    if (err)     err.hidden     = true;
    const btn = document.querySelector("#svc-submit");
    if (btn) { btn.disabled = false; btn.textContent = "Adicionar serviço"; }
  }

  if (openBtn)  openBtn.addEventListener("click",  openModal);
  if (closeBtn) closeBtn.addEventListener("click",  closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  if (overlay) {
    overlay.addEventListener("click", function (evt) {
      if (evt.target === overlay) closeModal();
    });
  }

  document.addEventListener("keydown", function (evt) {
    if (evt.key === "Escape" && overlay && !overlay.hidden) closeModal();
  });

  /* ── Submit do formulário de novo serviço ── */
  const form = document.querySelector("#new-service-form");

  function showErr(id, msg) {
    const el = document.querySelector("#" + id);
    if (!el) return;
    el.textContent = msg; el.hidden = false;
    const input = el.previousElementSibling || el.closest(".form-group").querySelector("input,select");
    if (input) input.classList.add("has-error");
  }
  function clearErr(id) {
    const el = document.querySelector("#" + id);
    if (!el) return;
    el.textContent = ""; el.hidden = true;
    const input = el.previousElementSibling || el.closest(".form-group").querySelector("input,select");
    if (input) input.classList.remove("has-error");
  }

  const emojiMap = { cabelo: "✂️", coloracao: "🎨", tratamento: "💆", unhas: "💅" };
  const catLabel = { cabelo: "Cabelo", coloracao: "Coloração", tratamento: "Tratamento", unhas: "Unhas" };
  const catPill  = { cabelo: "cat-pill--cabelo", coloracao: "cat-pill--coloracao", tratamento: "cat-pill--tratamento", unhas: "cat-pill--unhas" };

  if (form) {
    form.addEventListener("submit", function (evt) {
      evt.preventDefault();

      clearErr("svc-name-error"); clearErr("svc-cat-error");
      clearErr("svc-price-error"); clearErr("svc-duration-error");

      const name     = document.querySelector("#svc-name").value.trim();
      const cat      = document.querySelector("#svc-cat").value;
      const price    = document.querySelector("#svc-price").value;
      const duration = document.querySelector("#svc-duration").value;
      const status   = document.querySelector("#svc-status").value;

      const checked = Array.from(document.querySelectorAll("input[name='professionals']:checked"))
        .map(function (cb) { return cb.parentElement.textContent.trim(); });

      let valid = true;
      if (!name)              { showErr("svc-name-error",     "Informe o nome do serviço."); valid = false; }
      if (!cat)               { showErr("svc-cat-error",      "Selecione uma categoria.");   valid = false; }
      if (!price || price<=0) { showErr("svc-price-error",    "Informe um preço válido.");   valid = false; }
      if (!duration || duration<5) { showErr("svc-duration-error", "Informe a duração em minutos (mín. 5)."); valid = false; }
      if (!valid) return;

      const btn = document.querySelector("#svc-submit");
      btn.disabled = true; btn.textContent = "Adicionando...";

      /* Simula POST na API — substituir por HttpClientBase.js */
      setTimeout(function () {
        /* Adiciona nova linha na lista */
        const table  = document.querySelector("#services-table");
        const header = table.querySelector(".st-header");

        const newRow = document.createElement("li");
        newRow.className = "st-row";
        newRow.setAttribute("role", "row");
        newRow.setAttribute("data-cat",    cat);
        newRow.setAttribute("data-status", status);
        newRow.setAttribute("data-name",   name);
        if (status === "inativo") newRow.classList.add("inactive");

        const priceFormatted = "R$ " + parseFloat(price).toFixed(2).replace(".", ",");
        const dur = duration >= 60
          ? Math.floor(duration/60) + "h" + (duration%60 > 0 ? " " + duration%60 + "min" : "")
          : duration + " min";

        newRow.innerHTML =
          '<section class="st-service" role="cell">' +
            '<figure class="st-emoji" aria-hidden="true">' + (emojiMap[cat] || "✂️") + '</figure>' +
            '<section>' +
              '<p class="st-name">' + name + '</p>' +
              '<p class="st-pros">' + (checked.length ? checked.join(" · ") : "—") + '</p>' +
            '</section>' +
          '</section>' +
          '<span class="st-cat" role="cell"><span class="cat-pill ' + catPill[cat] + '">' + catLabel[cat] + '</span></span>' +
          '<span class="st-dur" role="cell">' + dur + '</span>' +
          '<span class="st-price" role="cell">' + priceFormatted + '</span>' +
          '<span role="cell"><span class="badge ' + (status === "ativo" ? "badge--green" : "badge--red") + '">' + (status === "ativo" ? "Ativo" : "Inativo") + '</span></span>' +
          '<section class="st-actions" role="cell">' +
            '<button class="btn btn--ghost btn--sm btn-edit" aria-label="Editar ' + name + '">Editar</button>' +
            '<button class="btn ' + (status === "ativo" ? "btn--danger" : "btn--outline") + ' btn--sm btn-toggle" aria-label="' + (status === "ativo" ? "Desativar" : "Ativar") + ' ' + name + '">' + (status === "ativo" ? "Desativar" : "Ativar") + '</button>' +
          '</section>';

        table.appendChild(newRow);

        /* Re-registra eventos na nova linha */
        const newToggle = newRow.querySelector(".btn-toggle");
        if (newToggle) {
          newToggle.addEventListener("click", function () {
            const cur    = newRow.getAttribute("data-status");
            const badge  = newRow.querySelector(".badge");
            if (cur === "ativo") {
              newRow.setAttribute("data-status", "inativo");
              newRow.classList.add("inactive");
              if (badge) { badge.className = "badge badge--red"; badge.textContent = "Inativo"; }
              newToggle.textContent = "Ativar";
              newToggle.className   = "btn btn--outline btn--sm btn-toggle";
            } else {
              newRow.setAttribute("data-status", "ativo");
              newRow.classList.remove("inactive");
              if (badge) { badge.className = "badge badge--green"; badge.textContent = "Ativo"; }
              newToggle.textContent = "Desativar";
              newToggle.className   = "btn btn--danger btn--sm btn-toggle";
            }
            applyFilters();
          });
        }
        const newEdit = newRow.querySelector(".btn-edit");
        if (newEdit) {
          newEdit.addEventListener("click", function () {
            alert("Edição de \"" + name + "\" disponível na integração com a API.");
          });
        }

        applyFilters();

        const success = document.querySelector("#svc-success");
        if (success) success.hidden = false;

        setTimeout(closeModal, 1800);
      }, 1000);
    });
  }

})();
