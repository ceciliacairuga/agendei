/* views/assets/public/scripts/login.js
 * Login do cliente (área /users/login). Em caso de sucesso, salva a sessão
 * (token + dados do usuário) e redireciona para a área protegida.
 */
import Users from "../../_common/classes/Users.js";
import SessionStorage from "../../_common/scripts/storage.js";

(function () {
  "use strict";

  const usersApi = new Users();
  const storage  = new SessionStorage("default");

  const form         = document.querySelector("#login-form");
  const emailInput   = document.querySelector("#email");
  const passwordInput = document.querySelector("#password");
  const emailError   = document.querySelector("#email-error");
  const passwordError = document.querySelector("#password-error");
  const globalError  = document.querySelector("#form-error-global");
  const successMsg   = document.querySelector("#form-success");
  const submitBtn    = document.querySelector("#submit-btn");
  const togglePw     = document.querySelector("#toggle-password");

  if (!form) return;

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
  }
  function clearError(el) {
    if (!el) return;
    el.textContent = "";
    el.hidden = true;
  }
  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  if (togglePw) {
    togglePw.addEventListener("click", function () {
      const hidden = passwordInput.type === "password";
      passwordInput.type = hidden ? "text" : "password";
      togglePw.setAttribute("aria-label", hidden ? "Ocultar senha" : "Mostrar senha");
    });
  }

  /* Já autenticado? Não faz sentido mostrar a tela de login de novo. */
  if (storage.isAuthenticated()) {
    window.location.href = "/agendei/dashboard.html";
    return;
  }

  form.addEventListener("submit", function (evt) {
    evt.preventDefault();

    clearError(emailError);
    clearError(passwordError);
    if (globalError) globalError.hidden = true;
    if (successMsg)  successMsg.hidden  = true;

    let valid = true;

    if (!emailInput.value.trim() || !validEmail(emailInput.value.trim())) {
      showError(emailError, "Informe um e-mail válido.");
      valid = false;
    }

    if (!passwordInput.value) {
      showError(passwordError, "Informe sua senha.");
      valid = false;
    }

    if (!valid) return;

    submitBtn.disabled    = true;
    submitBtn.textContent = "Entrando...";

    usersApi.loginFromForm(form)
      .then(function (result) {
        if (!result || result.type !== "success") {
          const message = (result && result.message) || "Não foi possível entrar. Verifique suas credenciais.";
          throw new Error(message);
        }

        const token = result.data && result.data.token;
        if (!token) {
          throw new Error("O servidor não retornou uma sessão válida.");
        }

        storage.saveSession(token, result.data);

        if (successMsg) successMsg.hidden = false;

        setTimeout(function () {
          window.location.href = "/agendei/dashboard.html";
        }, 800);
      })
      .catch(function (err) {
        showError(globalError, err.message || "Serviço indisponível no momento. Tente novamente em instantes.");
        if (globalError) globalError.hidden = false;
      })
      .finally(function () {
        submitBtn.disabled    = false;
        submitBtn.textContent = "Entrar na minha conta";
      });
  });

})();
