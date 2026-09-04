(() => {
  "use strict";

  const programNav = document.querySelector("[data-program-nav]");

  if (programNav) {
    const hero = document.querySelector(".hero");
    const syncBannerBackground = () => {
      if (!hero) return;
      const heroHeight = hero.getBoundingClientRect().height;
      const bannerHeight = heroHeight + programNav.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--hero-banner-height", `${bannerHeight}px`);
      document.documentElement.style.setProperty("--hero-banner-offset", `${heroHeight}px`);
    };
    syncBannerBackground();
    window.addEventListener("resize", syncBannerBackground);
    if ("ResizeObserver" in window) {
      const bannerObserver = new ResizeObserver(syncBannerBackground);
      if (hero) bannerObserver.observe(hero);
      bannerObserver.observe(programNav);
    }

    const destinations = Array.from(programNav.querySelectorAll('a[href^="#"]'))
      .map((link) => ({
        link,
        section: document.getElementById(link.hash.slice(1)),
      }))
      .filter(({ section }) => section)
      // Registration sits at the far right of the nav, but earlier in the page.
      .sort((a, b) => a.section.compareDocumentPosition(b.section) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    const linkScroller = programNav.querySelector(".program-nav__links");
    let previousCurrent;
    let previousWidth = 0;
    let scheduled = false;

    const updateCurrentSection = () => {
      scheduled = false;
      // Match native anchor positioning, including the space above a heading.
      const anchorOffset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const activationLine = Math.max(programNav.offsetHeight, anchorOffset) + 1;
      let current = destinations[0];

      for (const destination of destinations) {
        if (destination.section.getBoundingClientRect().top <= activationLine) {
          current = destination;
        }
      }

      // The final section may be too short to reach the activation line.
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        current = destinations[destinations.length - 1];
      }

      for (const destination of destinations) {
        if (destination === current) {
          destination.link.setAttribute("aria-current", "location");
        } else {
          destination.link.removeAttribute("aria-current");
        }
      }

      // Keep the active section visible in the mobile ribbon without scrolling the page.
      if (linkScroller && current && (current !== previousCurrent || linkScroller.clientWidth !== previousWidth)) {
        if (current.link.parentElement === linkScroller) {
          const left = current.link.offsetLeft;
          const right = left + current.link.offsetWidth;
          if (left < linkScroller.scrollLeft) {
            linkScroller.scrollLeft = left;
          } else if (right > linkScroller.scrollLeft + linkScroller.clientWidth) {
            linkScroller.scrollLeft = right - linkScroller.clientWidth;
          }
        }
        previousCurrent = current;
        previousWidth = linkScroller.clientWidth;
      }

    };

    const scheduleUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(updateCurrentSection);
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);
    window.addEventListener("load", scheduleUpdate);
    // Recheck positions after disclosures, fonts, or media change the layout.
    if ("ResizeObserver" in window) {
      new ResizeObserver(scheduleUpdate).observe(document.body);
    }
    scheduleUpdate();
  }

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
