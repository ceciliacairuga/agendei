/* views/assets/app/scripts/perfil.js */

(function () {
  "use strict";

  /* ── Utilitários ── */
  function showError(id, msg) {
    const el = document.querySelector("#" + id);
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    const input = el.closest(".form-group") && el.closest(".form-group").querySelector("input, select");
    if (input) input.classList.add("has-error");
  }

  function clearError(id) {
    const el = document.querySelector("#" + id);
    if (!el) return;
    el.textContent = "";
    el.hidden = true;
    const input = el.closest(".form-group") && el.closest(".form-group").querySelector("input, select");
    if (input) input.classList.remove("has-error");
  }

  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  /* ── Toggle mostrar/ocultar senha ── */
  document.querySelectorAll(".toggle-pwd").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const input = document.querySelector("#" + btn.getAttribute("data-target"));
      if (!input) return;
      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      btn.querySelector(".icon-eye").hidden     = hidden;
      btn.querySelector(".icon-eye-off").hidden = !hidden;
      btn.setAttribute("aria-label", hidden ? "Ocultar senha" : "Mostrar senha");
    });
  });

  /* ── Editar dados pessoais ── */
  const togglePersonalBtn = document.querySelector("#toggle-edit-personal");
  const personalView      = document.querySelector("#personal-view");
  const personalForm      = document.querySelector("#personal-form");
  const cancelPersonalBtn = document.querySelector("#cancel-edit-personal");

  function openPersonalEdit() {
    personalView.hidden = true;
    personalForm.hidden = false;
    togglePersonalBtn.setAttribute("aria-expanded", "true");
    document.querySelector("#edit-firstname").focus();
  }

  function closePersonalEdit() {
    personalView.hidden = false;
    personalForm.hidden = true;
    togglePersonalBtn.setAttribute("aria-expanded", "false");
    const success = document.querySelector("#personal-success");
    if (success) success.hidden = true;
  }

  if (togglePersonalBtn) togglePersonalBtn.addEventListener("click", openPersonalEdit);
  if (cancelPersonalBtn) cancelPersonalBtn.addEventListener("click", closePersonalEdit);

  if (personalForm) {
    personalForm.addEventListener("submit", function (evt) {
      evt.preventDefault();

      clearError("err-firstname");
      clearError("err-lastname");
      clearError("err-email");

      const first = document.querySelector("#edit-firstname").value.trim();
      const last  = document.querySelector("#edit-lastname").value.trim();
      const email = document.querySelector("#edit-email").value.trim();
      const phone = document.querySelector("#edit-phone").value.trim();
      const birth = document.querySelector("#edit-birthdate").value;

      let valid = true;
      if (!first)                    { showError("err-firstname", "Informe seu nome."); valid = false; }
      if (!last)                     { showError("err-lastname",  "Informe seu sobrenome."); valid = false; }
      if (!email || !validEmail(email)) { showError("err-email", "Informe um e-mail válido."); valid = false; }
      if (!valid) return;

      const btn = document.querySelector("#save-personal");
      btn.disabled    = true;
      btn.textContent = "Salvando...";

      /* Integração futura: usar HttpClientBase.js para PATCH na API */
      setTimeout(function () {
        btn.disabled    = false;
        btn.textContent = "Salvar alterações";

        /* Atualiza a visualização */
        document.querySelector("#view-name").textContent  = first + " " + last;
        document.querySelector("#view-email").textContent = email;
        if (phone) document.querySelector("#view-phone").textContent = phone;
        if (birth) {
          const d = new Date(birth + "T00:00:00");
          document.querySelector("#view-birthdate").textContent =
            d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
        }

        /* Atualiza initials no sidebar, topbar e hero */
        const initials = (first[0] + (last[0] || "")).toUpperCase();
        document.querySelectorAll(".user-avatar, .topbar-avatar, .profile-avatar-lg").forEach(function (el) {
          el.textContent = initials;
        });
        const sidebarName = document.querySelector(".user-name-text");
        if (sidebarName) sidebarName.textContent = first + " " + last;
        const heroName = document.querySelector(".profile-name");
        if (heroName) heroName.textContent = first + " " + last;

        const success = document.querySelector("#personal-success");
        if (success) success.hidden = false;

        setTimeout(closePersonalEdit, 1800);
      }, 900);
    });
  }

  /* ── Alterar senha ── */
  const togglePasswordBtn   = document.querySelector("#toggle-edit-password");
  const passwordPlaceholder = document.querySelector("#password-placeholder");
  const passwordForm        = document.querySelector("#password-form");
  const cancelPasswordBtn   = document.querySelector("#cancel-edit-password");

  function openPasswordEdit() {
    passwordPlaceholder.hidden = true;
    passwordForm.hidden        = false;
    togglePasswordBtn.setAttribute("aria-expanded", "true");
    document.querySelector("#current-password").focus();
  }

  function closePasswordEdit() {
    passwordPlaceholder.hidden = false;
    passwordForm.hidden        = true;
    togglePasswordBtn.setAttribute("aria-expanded", "false");
    passwordForm.reset();
    ["err-current-pwd", "err-new-pwd", "err-confirm-pwd"].forEach(clearError);
    const success = document.querySelector("#password-success");
    if (success) success.hidden = true;
  }

  if (togglePasswordBtn) togglePasswordBtn.addEventListener("click", openPasswordEdit);
  if (cancelPasswordBtn) cancelPasswordBtn.addEventListener("click", closePasswordEdit);

  if (passwordForm) {
    passwordForm.addEventListener("submit", function (evt) {
      evt.preventDefault();

      clearError("err-current-pwd");
      clearError("err-new-pwd");
      clearError("err-confirm-pwd");

      const current = document.querySelector("#current-password").value;
      const newPwd  = document.querySelector("#new-password").value;
      const confirm = document.querySelector("#confirm-password").value;

      let valid = true;
      if (!current)           { showError("err-current-pwd", "Informe sua senha atual."); valid = false; }
      if (newPwd.length < 8)  { showError("err-new-pwd",     "A nova senha deve ter pelo menos 8 caracteres."); valid = false; }
      if (newPwd !== confirm) { showError("err-confirm-pwd", "As senhas não coincidem."); valid = false; }
      if (!valid) return;

      const btn = document.querySelector("#save-password");
      btn.disabled    = true;
      btn.textContent = "Salvando...";

      /* Integração futura: usar HttpClientBase.js para PATCH na API */
      setTimeout(function () {
        btn.disabled    = false;
        btn.textContent = "Salvar senha";
        const success = document.querySelector("#password-success");
        if (success) success.hidden = false;
        setTimeout(closePasswordEdit, 1800);
      }, 900);
    });
  }

})();
