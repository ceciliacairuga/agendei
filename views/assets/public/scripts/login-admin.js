/* views/assets/public/scripts/login-admin.js
 * Login administrativo — validação visual e redirecionamento para o painel.
 * Frontend estático: nenhuma regra de negócio real; apenas comportamento de UI.
 */

const adminForm = document.querySelector("#admin-login-form");
const adminEmail = document.querySelector("#admin-email");
const adminPassword = document.querySelector("#admin-password");
const adminEmailError = document.querySelector("#admin-email-error");
const adminPasswordError = document.querySelector("#admin-password-error");
const adminGlobalError = document.querySelector("#admin-form-error-global");
const adminSubmit = document.querySelector("#admin-submit-btn");
const adminTogglePw = document.querySelector("#admin-toggle-password");

function showError(field, errorEl, message) {
  field.classList.add("has-error");
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearError(field, errorEl) {
  field.classList.remove("has-error");
  errorEl.textContent = "";
  errorEl.hidden = true;
}

adminEmail.addEventListener("input", () => clearError(adminEmail, adminEmailError));
adminPassword.addEventListener("input", () => clearError(adminPassword, adminPasswordError));

adminTogglePw.addEventListener("click", () => {
  const isPassword = adminPassword.type === "password";
  adminPassword.type = isPassword ? "text" : "password";
  adminTogglePw.setAttribute("aria-label", isPassword ? "Ocultar senha" : "Mostrar senha");
});

/*adminSubmit.addEventListener("click", () => {
  adminGlobalError.hidden = true;
  let valid = true;

  if (!adminEmail.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.value)) {
    showError(adminEmail, adminEmailError, "Informe um e-mail administrativo válido.");
    valid = false;
  }
  if (!adminPassword.value || adminPassword.value.length < 6) {
    showError(adminPassword, adminPasswordError, "A senha precisa ter ao menos 6 caracteres.");
    valid = false;
  }

  if (!valid) return;

  // Frontend estático: redireciona para o painel administrativo.
  window.location.href = "../../../painel.html";
}); */

adminSubmit.addEventListener("click", () => {
  window.location.href = "file:///C:/wamp64/www/agendei/painel.html";
});
