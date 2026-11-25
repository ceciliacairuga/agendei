/* views/assets/public/scripts/cadastro.js */
import Users from "../../_common/classes/Users.js";

(function () {
  "use strict";

  const usersApi = new Users();

  /* ── Helpers ── */
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
  function markError(input) { input.classList.add("has-error"); }
  function clearMark(input) { input.classList.remove("has-error"); }
  function validEmail(v)    { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  /* ── Toggle senha ── */
  function setupToggle(btnId, inputId) {
    const btn   = document.querySelector("#" + btnId);
    const input = document.querySelector("#" + inputId);
    if (!btn || !input) return;

    btn.addEventListener("click", function () {
      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      btn.querySelector(".icon-eye").hidden    = hidden;
      btn.querySelector(".icon-eye-off").hidden = !hidden;
      btn.setAttribute("aria-label", hidden ? "Ocultar senha" : "Mostrar senha");
    });
  }

  setupToggle("toggle-password", "password");
  setupToggle("toggle-confirm",  "password-confirm");

  /* ── Indicador de força da senha ── */
  const passwordInput = document.querySelector("#password");
  const bars          = [
    document.querySelector("#bar-1"),
    document.querySelector("#bar-2"),
    document.querySelector("#bar-3"),
    document.querySelector("#bar-4"),
  ];
  const strengthLabel = document.querySelector("#strength-label");

  function calcStrength(val) {
    let score = 0;
    if (val.length >= 8)              score++;
    if (/[A-Z]/.test(val))            score++;
    if (/[0-9]/.test(val))            score++;
    if (/[^A-Za-z0-9]/.test(val))     score++;
    return score;
  }

  const strengthLabels = ["", "Fraca", "Razoável", "Boa", "Forte"];
  const strengthColors = ["", "active-1", "active-2", "active-3", "active-4"];

  if (passwordInput) {
    passwordInput.addEventListener("input", function () {
      const score = calcStrength(passwordInput.value);

      bars.forEach(function (bar, i) {
        bar.className = "strength-bar";
        if (i < score) bar.classList.add(strengthColors[score]);
      });

      if (strengthLabel) {
        strengthLabel.textContent = passwordInput.value ? strengthLabels[score] : "";
      }
    });
  }

  /* ── Validação do formulário ── */
  const form          = document.querySelector("#register-form");
  const firstNameInput = document.querySelector("#first-name");
  const lastNameInput  = document.querySelector("#last-name");
  const emailInput     = document.querySelector("#email");
  const confirmInput   = document.querySelector("#password-confirm");
  const termsInput     = document.querySelector("#terms");
  const submitBtn      = document.querySelector("#submit-btn");
  const successMsg     = document.querySelector("#form-success");
  const globalError    = document.querySelector("#form-error-global");

  if (!form) return;

  form.addEventListener("submit", function (evt) {
    evt.preventDefault();

    /* Limpar feedbacks */
    ["first-name-error", "last-name-error", "email-error",
     "password-error", "confirm-error", "terms-error"].forEach(function (id) {
      clearError(document.querySelector("#" + id));
    });
    if (successMsg)  successMsg.hidden  = true;
    if (globalError) globalError.hidden = true;

    let valid = true;

    /* Nome */
    if (!firstNameInput.value.trim()) {
      showError(document.querySelector("#first-name-error"), "Informe seu nome.");
      markError(firstNameInput);
      valid = false;
    } else { clearMark(firstNameInput); }

    /* Sobrenome */
    if (!lastNameInput.value.trim()) {
      showError(document.querySelector("#last-name-error"), "Informe seu sobrenome.");
      markError(lastNameInput);
      valid = false;
    } else { clearMark(lastNameInput); }

    /* E-mail */
    if (!emailInput.value.trim() || !validEmail(emailInput.value.trim())) {
      showError(document.querySelector("#email-error"), "Informe um e-mail válido.");
      markError(emailInput);
      valid = false;
    } else { clearMark(emailInput); }

    /* Senha */
    if (passwordInput.value.length < 8) {
      showError(document.querySelector("#password-error"), "A senha deve ter pelo menos 8 caracteres.");
      markError(passwordInput);
      valid = false;
    } else { clearMark(passwordInput); }

    /* Confirmar senha */
    if (confirmInput.value !== passwordInput.value) {
      showError(document.querySelector("#confirm-error"), "As senhas não coincidem.");
      markError(confirmInput);
      valid = false;
    } else { clearMark(confirmInput); }

    /* Termos */
    if (!termsInput.checked) {
      showError(document.querySelector("#terms-error"), "Você precisa aceitar os termos para continuar.");
      valid = false;
    }

    if (!valid) return;

    /* Estado de carregamento */
    submitBtn.disabled    = true;
    submitBtn.textContent = "Criando conta...";

    const fullName = (firstNameInput.value.trim() + " " + lastNameInput.value.trim()).trim();

    /* Nunca mantenha a senha em variáveis além do necessário para o envio;
       nunca logue ou reexiba o valor. */
    const payload = {
      name: fullName,
      email: emailInput.value.trim(),
      password: passwordInput.value,
    };

    usersApi.register(payload)
      .then(function (result) {
        if (!result || result.type !== "success") {
          const message = (result && result.message) || "Não foi possível criar sua conta.";
          throw new Error(message);
        }

        if (successMsg) successMsg.hidden = false;

        setTimeout(function () {
          /* O cadastro não autentica automaticamente; o fluxo exige um
             login explícito em seguida (Cadastro → resposta da API → Login). */
          window.location.href = "/agendei/views/assets/public/login.html";
        }, 1500);
      })
      .catch(function (err) {
        showError(globalError, err.message || "Serviço indisponível no momento. Tente novamente em instantes.");
      })
      .finally(function () {
        submitBtn.disabled    = false;
        submitBtn.textContent = "Criar minha conta grátis";
      });
  });

})();
