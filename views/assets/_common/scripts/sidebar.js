/* views/assets/_common/scripts/sidebar.js */

(function () {
  "use strict";

  const sidebar  = document.querySelector("#sidebar");
  const toggle   = document.querySelector("#sidebar-toggle");
  const close    = document.querySelector("#sidebar-close");
  const overlay  = document.querySelector("#sidebar-overlay");

  if (!sidebar) return;

  function open() {
    sidebar.classList.add("open");
    if (overlay)  overlay.classList.add("visible");
    if (toggle)   toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    sidebar.classList.remove("open");
    if (overlay)  overlay.classList.remove("visible");
    if (toggle)   toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  if (toggle)  toggle.addEventListener("click", open);
  if (close)   close.addEventListener("click", closeMenu);
  if (overlay) overlay.addEventListener("click", closeMenu);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

})();
