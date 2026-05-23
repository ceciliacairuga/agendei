/* views/assets/app/scripts/perfil.js */

(function () {
  "use strict";

  /* ================================================================
     MODAL DE NOVO AGENDAMENTO
  ================================================================ */
  const modal    = document.querySelector("#modal-overlay");
  const openBtn  = document.querySelector("#open-booking-btn");
  const closeBtn = document.querySelector("#modal-close");
  const cancelBtn = document.querySelector("#modal-cancel");

  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(function () {
      const first = modal.querySelector("select, input");
      if (first) first.focus();
    }, 80);
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    resetBookingForm();
  }
  
  function resetBookingForm() {
    const form = document.querySelector("#booking-form");
    if (form) form.reset();
    ["appt-service-error","appt-professional-error","appt-date-error","appt-time-error"].forEach(clearError);
    const success = document.querySelector("#appt-success");
    const errGlobal = document.querySelector("#appt-error-global");
    if (success)   success.hidden   = true;
    if (errGlobal) errGlobal.hidden = true;
    const btn = document.querySelector("#appt-submit");
    if (btn) { btn.disabled = false; btn.textContent = "Confirmar agendamento"; }
  }

  if (openBtn)   openBtn.addEventListener("click",   openModal);
  if (closeBtn)  closeBtn.addEventListener("click",  closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  if (modal) {
    modal.addEventListener("click", function (evt) {
      if (evt.target === modal) closeModal();
    });
  }

  document.addEventListener("keydown", function (evt) {
    if (evt.key === "Escape" && modal && !modal.hidden) closeModal();
  });

  /* Data mínima = hoje */
  const dateInput = document.querySelector("#appt-date");
  if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

  /* Submit booking */
  const bookingForm = document.querySelector("#booking-form");
  if (bookingForm) {
    bookingForm.addEventListener("submit", function (evt) {
      evt.preventDefault();

      clearError("appt-service-error"); clearError("appt-professional-error");
      clearError("appt-date-error");    clearError("appt-time-error");

      const service  = document.querySelector("#appt-service").value;
      const pro      = document.querySelector("#appt-professional").value;
      const date     = document.querySelector("#appt-date").value;
      const time     = document.querySelector("#appt-time").value;

      let valid = true;
      if (!service) { showError("appt-service-error",      "Selecione um serviço.");         valid = false; }
      if (!pro)     { showError("appt-professional-error", "Selecione uma profissional.");    valid = false; }
      if (!date)    { showError("appt-date-error",         "Selecione uma data.");            valid = false; }
      if (!time)    { showError("appt-time-error",         "Selecione um horário.");          valid = false; }
      if (!valid) return;

      const btn = document.querySelector("#appt-submit");
      btn.disabled = true; btn.textContent = "Confirmando...";

      /* Integração futura: usar HttpClientBase.js */
      setTimeout(function () {
        btn.disabled = false; btn.textContent = "Confirmar agendamento";
        const success = document.querySelector("#appt-success");
        if (success) success.hidden = false;
        setTimeout(function () {
          closeModal();
          window.location.href = "agendamentos.html";
        }, 1800);
      }, 900);
    });
  }

})();
