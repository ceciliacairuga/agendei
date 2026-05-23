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
