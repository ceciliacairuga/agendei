/* views/assets/public/scripts/home.js */

(function () {
  "use strict";

  /* ── Header scroll shadow ── */
  const header = document.querySelector("#site-header");

  function handleScroll() {
    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", handleScroll, { passive: true });

  /* ── Mobile hamburger menu ── */
  const hamburger = document.querySelector("#nav-hamburger");
  const navLinks  = document.querySelector("#nav-links");
  const navActions = document.querySelector(".nav-actions");

  function toggleMenu() {
    const isOpen = hamburger.getAttribute("aria-expanded") === "true";
    const nextState = String(!isOpen);

    hamburger.setAttribute("aria-expanded", nextState);
    navLinks.classList.toggle("open", !isOpen);

    if (navActions) {
      navActions.style.display = !isOpen ? "flex" : "";
    }
  }

  function closeMenu() {
    hamburger.setAttribute("aria-expanded", "false");
    navLinks.classList.remove("open");
    if (navActions) navActions.style.display = "";
  }

  if (hamburger) {
    hamburger.addEventListener("click", toggleMenu);
  }

  /* close when a link is tapped on mobile */
  navLinks.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  /* close when clicking outside */
  document.addEventListener("click", function (evt) {
    const insideNav = header.contains(evt.target);
    if (!insideNav) closeMenu();
  });

  /* ── Slot selection ── */
  const slotBtns = document.querySelectorAll(".slot-btn:not(.slot-busy)");

  slotBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      slotBtns.forEach(function (b) {
        b.classList.remove("slot-selected");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("slot-selected");
      btn.setAttribute("aria-pressed", "true");
    });
  });

  /* ── Smooth anchor scroll with header offset ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (evt) {
      const targetId = anchor.getAttribute("href").slice(1);
      const target = document.getElementById(targetId);

      if (target) {
        evt.preventDefault();
        const offset = header ? header.offsetHeight + 16 : 80;
        const top    = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: "smooth" });
      }
    });
  });

  /* ── Fade-in on scroll (Intersection Observer) ── */
  const observerOptions = {
    threshold: 0.12,
    rootMargin: "0px 0px -40px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll(
    ".feature-card, .service-card, .testimonial-card"
  ).forEach(function (el, i) {
    el.style.opacity    = "0";
    el.style.transform  = "translateY(24px)";
    el.style.transition = "opacity 0.5s ease " + i * 0.07 + "s, transform 0.5s ease " + i * 0.07 + "s";
    observer.observe(el);
  });

  document.addEventListener("animationend", function () {}, { once: true });

  /* inject .visible rule */
  const styleTag = document.createElement("style");
  styleTag.textContent = ".visible { opacity: 1 !important; transform: translateY(0) !important; }";
  document.head.appendChild(styleTag);

})();


/* ── FAQs (carregadas do banco de dados via API) ── */
(function () {
  "use strict";

  const API_BASE = "http://localhost/agendei/api";
  const listFaqsEl = document.querySelector("#list-faqs");

  if (!listFaqsEl) return;

  function renderLoading() {
    listFaqsEl.innerHTML = `
      <div class="faq-loading">
        <span class="faq-spinner" aria-hidden="true"></span>
        <span>Carregando perguntas frequentes...</span>
      </div>
    `;
  }

  function renderError() {
    listFaqsEl.innerHTML = `
      <div class="faq-error">
        <span>Não foi possível carregar as perguntas frequentes no momento.</span>
        <button type="button" class="faq-retry-btn" id="faq-retry-btn">Tentar novamente</button>
      </div>
    `;
    const retryBtn = document.querySelector("#faq-retry-btn");
    if (retryBtn) retryBtn.addEventListener("click", loadFAQs);
  }

  function renderEmpty() {
    listFaqsEl.innerHTML = `
      <div class="faq-error">
        <span>Ainda não há perguntas frequentes cadastradas. Seja o primeiro a sugerir uma!</span>
      </div>
    `;
  }

  function createFaqItem(question, answer) {
    const item = document.createElement("div");
    item.className = "faq-item";

    item.innerHTML = `
      <button type="button" class="faq-question" aria-expanded="false">
        <span>${question}</span>
        <span class="faq-icon" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </span>
      </button>
      <div class="faq-answer">
        <p>${answer}</p>
      </div>
    `;

    const question_btn = item.querySelector(".faq-question");
    question_btn.addEventListener("click", function () {
      const isOpen = item.classList.toggle("open");
      question_btn.setAttribute("aria-expanded", String(isOpen));
    });

    return item;
  }

  function renderFAQs(faqs, categories) {
    listFaqsEl.innerHTML = "";

    if (!faqs || faqs.length === 0) {
      renderEmpty();
      return;
    }

    const categoryMap = {};
    (categories || []).forEach(function (cat) {
      categoryMap[cat.id] = cat.name;
    });

    // Agrupa as FAQs por categoria (na ordem em que aparecem)
    const groups = [];
    const groupIndexByCategory = {};

    faqs.forEach(function (faq) {
      const categoryId = faq.faqs_category_id;
      const categoryName = categoryMap[categoryId] || "Outras dúvidas";

      if (!(categoryId in groupIndexByCategory)) {
        groupIndexByCategory[categoryId] = groups.length;
        groups.push({ name: categoryName, items: [] });
      }
      groups[groupIndexByCategory[categoryId]].items.push(faq);
    });

    const wrapper = document.createElement("div");
    wrapper.className = "faq-list";

    const showGroupTitles = groups.length > 1;

    groups.forEach(function (group) {
      if (showGroupTitles) {
        const title = document.createElement("h3");
        title.className = "faq-group-title";
        title.textContent = group.name;
        wrapper.appendChild(title);
      }

      group.items.forEach(function (faq) {
        wrapper.appendChild(createFaqItem(faq.question, faq.answer));
      });
    });

    listFaqsEl.appendChild(wrapper);
  }

  async function loadFAQs() {
    renderLoading();
    try {
      const [faqsRes, categoriesRes] = await Promise.all([
        fetch(API_BASE + "/faqs/list"),
        fetch(API_BASE + "/faqs-categories/list"),
      ]);

      if (!faqsRes.ok) throw new Error("Falha ao buscar FAQs.");

      const faqsJson = await faqsRes.json();
      const categoriesJson = categoriesRes.ok ? await categoriesRes.json() : { data: [] };

      renderFAQs(faqsJson.data, categoriesJson.data);
    } catch (err) {
      console.error("Erro ao carregar FAQs:", err);
      renderError();
    }
  }

  loadFAQs();
})();