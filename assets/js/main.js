(() => {
  "use strict";

  const accordion = document.querySelector("[data-accordion]");

  if (accordion) {
    accordion.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;

      const item = button.closest(".accordion__item");
      const panel = item?.querySelector(".accordion__panel");
      if (!panel) return;

      const isOpen = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isOpen));
      panel.hidden = isOpen;
    });
  }

  const prototypeForm = document.querySelector("[data-prototype-form]");

  if (prototypeForm) {
    prototypeForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = prototypeForm.querySelector(".form-message");
      if (message) {
        message.textContent = "Prototype only. This area will be replaced by the live Jotform embed.";
      }
    });
  }
})();
