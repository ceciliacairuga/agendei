/* views/assets/public/scripts/login-admin.js
 * Login administrativo — integra com POST /users/login-admin.
 * Usa um escopo de sessão próprio ("admin"), separado da sessão do cliente.
 */
import Users from "../../_common/classes/Users.js";
import SessionStorage from "../../_common/scripts/storage.js";

const usersApi = new Users();
const storage  = new SessionStorage("admin");

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

function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

adminEmail.addEventListener("input", () => clearError(adminEmail, adminEmailError));
adminPassword.addEventListener("input", () => clearError(adminPassword, adminPasswordError));

adminTogglePw.addEventListener("click", () => {
  const isPassword = adminPassword.type === "password";
  adminPassword.type = isPassword ? "text" : "password";
  adminTogglePw.setAttribute("aria-label", isPassword ? "Ocultar senha" : "Mostrar senha");
});

/* Já autenticado como admin? Vai direto para o painel. */
if (storage.isAuthenticated()) {
  window.location.href = "/agendei/painel.html";
}

adminForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  adminGlobalError.hidden = true;
  let valid = true;

  if (!adminEmail.value.trim() || !validEmail(adminEmail.value.trim())) {
    showError(adminEmail, adminEmailError, "Informe um e-mail administrativo válido.");
    valid = false;
  }
  if (!adminPassword.value) {
    showError(adminPassword, adminPasswordError, "Informe sua senha.");
    valid = false;
  }

  if (!valid) return;

  adminSubmit.disabled = true;
  adminSubmit.textContent = "Entrando...";

  usersApi.loginAdminFromForm(adminForm)
    .then((result) => {
      if (!result || result.type !== "success") {
        const message = (result && result.message) || "Credenciais administrativas inválidas.";
        throw new Error(message);
      }

      const token = result.data && result.data.token;
      if (!token) {
        throw new Error("O servidor não retornou uma sessão válida.");
      }

      storage.saveSession(token, result.data);
      window.location.href = "/agendei/painel.html";
    })
    .catch((err) => {
      adminGlobalError.textContent = err.message || "Serviço indisponível no momento. Tente novamente em instantes.";
      adminGlobalError.hidden = false;
    })
    .finally(() => {
      adminSubmit.disabled = false;
      adminSubmit.textContent = "Acessar painel administrativo";
    });
});
