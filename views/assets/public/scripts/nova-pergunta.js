/* views/assets/public/scripts/nova-pergunta.js
 * Página "Sugerir uma pergunta" — carrega categorias e envia o novo FAQ para a API.
 */

(function () {
  "use strict";

  const API_BASE = "http://localhost/agendei/api";

  const form          = document.querySelector("#faq-form");
  const categorySelect = document.querySelector("#faq-category");
  const questionInput  = document.querySelector("#faq-question");
  const answerInput    = document.querySelector("#faq-answer");
  const submitBtn      = document.querySelector("#faq-submit-btn");
  const successMsg     = document.querySelector("#form-success");
  const globalError    = document.querySelector("#form-error-global");

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
  function markError(input) { input.classList.add("has-error"); }
  function clearMark(input) { input.classList.remove("has-error"); }

  /* ── Carrega as categorias de FAQ para o select ── */
  async function loadCategories() {
    try {
      const res = await fetch(API_BASE + "/faqs-categories/list");
      const json = await res.json();
      const categories = json.data || [];

      categories.forEach(function (cat) {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
      });

      if (categories.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Nenhuma categoria cadastrada";
        option.disabled = true;
        categorySelect.appendChild(option);
      }
    } catch (err) {
      console.error("Erro ao carregar categorias de FAQ:", err);
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Não foi possível carregar as categorias";
      option.disabled = true;
      categorySelect.appendChild(option);
    }
  }

  loadCategories();

  /* ── Envio do formulário ── */
  form.addEventListener("submit", async function (evt) {
    evt.preventDefault();

    ["faq-category-error", "faq-question-error", "faq-answer-error"].forEach(function (id) {
      clearError(document.querySelector("#" + id));
    });
    if (successMsg)  successMsg.hidden  = true;
    if (globalError) globalError.hidden = true;

    let valid = true;

    if (!categorySelect.value) {
      showError(document.querySelector("#faq-category-error"), "Selecione uma categoria.");
      markError(categorySelect);
      valid = false;
    } else {
      clearMark(categorySelect);
    }

    if (!questionInput.value.trim()) {
      showError(document.querySelector("#faq-question-error"), "Informe a pergunta.");
      markError(questionInput);
      valid = false;
    } else {
      clearMark(questionInput);
    }

    if (!answerInput.value.trim()) {
      showError(document.querySelector("#faq-answer-error"), "Informe a resposta sugerida.");
      markError(answerInput);
      valid = false;
    } else {
      clearMark(answerInput);
    }

    if (!valid) return;

    submitBtn.disabled    = true;
    submitBtn.textContent = "Enviando...";

    try {
      // Endpoint público: qualquer visitante pode sugerir uma pergunta,
      // sem precisar estar logado ou ser administrador.
      const response = await fetch(API_BASE + "/faqs/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faqs_category_id: categorySelect.value,
          question: questionInput.value.trim(),
          answer: answerInput.value.trim(),
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Não foi possível enviar sua pergunta.");
      }

      successMsg.hidden = false;
      form.reset();

      setTimeout(function () {
        window.location.href = "../../index.html#faq";
      }, 1500);
    } catch (err) {
      console.error("Erro ao enviar FAQ:", err);
      showError(globalError, err.message);
      globalError.hidden = false;
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = "Enviar pergunta";
    }
  });

})();
