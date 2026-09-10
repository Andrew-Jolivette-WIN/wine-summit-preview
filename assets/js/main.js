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

  // Review-only library sizes. Keep each presentation and follow-up in one card.
  const librarySize = document.querySelector("[data-library-size]");
  if (librarySize) {
    const grid = document.querySelector("[data-library-grid]");
    const cards = Array.from(grid.querySelectorAll("[data-replay-card]"));
    const template = document.querySelector("#library-example-card");
    const older = document.querySelector("[data-library-older]");
    const olderList = document.querySelector("[data-library-older-list]");
    const moreButton = document.querySelector("[data-library-more]");
    const count = document.querySelector("[data-library-count]");
    let olderCards = [];
    let olderVisible = 6;

    for (let number = 5; number <= 12; number += 1) {
      const card = template.content.firstElementChild.cloneNode(true);
      card.dataset.previewStage = ["followup", "closed", "open", "upcoming"][(number - 1) % 4];
      const label = String(number).padStart(2, "0");
      card.querySelector("h3").textContent = `Example presentation ${label}`;
      card.querySelector(".replay-art__footer").textContent = `SESSION ${label} · EXAMPLE`;
      card.querySelector("[data-replay-open]").setAttribute("aria-label", `Preview replay: Example presentation ${label}`);
      cards.push(card);
    }

    const renderOlder = () => {
      olderCards.forEach((card, index) => { card.hidden = index >= olderVisible; });
      document.querySelector("[data-library-older-count]").textContent = `Showing ${Math.min(olderVisible, olderCards.length)} of ${olderCards.length} older sessions`;
      moreButton.hidden = olderVisible >= olderCards.length;
    };

    const renderLibrary = () => {
      const total = Number(librarySize.value);
      // Session order is the original presentation order, never the follow-up date.
      const selected = cards.slice(0, total).reverse();
      olderCards = selected.slice(4);
      olderVisible = 6;
      older.open = false;
      older.hidden = olderCards.length === 0;
      grid.dataset.visibleCount = String(Math.min(total, 4));
      cards.forEach((card) => {
        card.hidden = true;
        card.classList.remove("replay-card--featured", "replay-card--older", "replay-card--compact");
        grid.append(card);
      });
      selected.forEach((card, index) => {
        card.hidden = false;
        // Artwork colors belong to display slots, not session numbers.
        const art = card.querySelector(".replay-art");
        art.classList.remove("replay-art--01", "replay-art--02", "replay-art--03", "replay-art--04");
        art.classList.add(`replay-art--0${(index % 4) + 1}`);
        card.classList.toggle("replay-card--featured", index === 0);
        card.classList.toggle("replay-card--compact", total === 2 && index === 1);
        card.classList.toggle("replay-card--older", index >= 4);
        card.querySelector(".replay-card__description").hidden = index !== 0;
        (index < 4 ? grid : olderList).append(card);
      });
      count.textContent = total === 1 ? "1 session in the library" : `${total} sessions · ${total > 4 ? "Latest 4 featured" : "Newest first"}`;
      document.querySelector("[data-library-older-label]").textContent = `View older sessions (${olderCards.length})`;
      renderOlder();
    };
    librarySize.addEventListener("change", renderLibrary);
    moreButton.addEventListener("click", () => {
      const firstNewCard = olderCards[olderVisible];
      olderVisible += 6;
      renderOlder();
      firstNewCard?.querySelector("[data-replay-open]").focus({ preventScroll: true });
    });
    document.querySelector("[data-library-demo]").hidden = false;
    count.hidden = false;
    renderLibrary();
  }

  // Availability is simulated here. Production badges must use published video URLs.
  const badgeTemplate = document.querySelector("#recording-badge-template");
  const renderRecordingBadges = (card, stage) => {
    const group = card.querySelector("[data-recording-badges]");
    group.querySelectorAll("[data-recording]").forEach((badge) => {
      const presentation = badge.dataset.recording === "presentation";
      const available = presentation ? stage !== "upcoming" : stage === "followup";
      const label = presentation ? "Session video" : "Follow-up video";
      const state = available ? "Available" : "Not yet available";
      badge.dataset.available = String(available);
      badge.querySelector("button").setAttribute("aria-label", `${label}: ${state}`);
      badge.querySelector('[role="tooltip"]').textContent = `${label}: ${state.toLowerCase()}`;
      badge.querySelector('[role="tooltip"]').hidden = true;
    });
    group.querySelector("[data-recording-status]").textContent = {
      upcoming: "Coming soon",
      open: "Responses open",
      closed: "Follow-up coming soon",
      followup: "Follow-up available"
    }[stage];
    group.hidden = false;
  };
  if (badgeTemplate) {
    document.querySelectorAll("[data-replay-card]").forEach((card, index) => {
      const group = card.querySelector("[data-recording-badges]");
      ["presentation", "followup"].forEach((kind) => {
        const badge = badgeTemplate.content.firstElementChild.cloneNode(true);
        badge.dataset.recording = kind;
        const trigger = badge.querySelector("button");
        const tooltip = badge.querySelector('[role="tooltip"]');
        const label = kind === "presentation" ? "Session video" : "Follow-up video";
        tooltip.id = `recording-${index}-${kind}`;
        tooltip.textContent = `${label}: available`;
        trigger.setAttribute("aria-label", label);
        trigger.setAttribute("aria-describedby", tooltip.id);
        badge.querySelectorAll("[data-recording-icon]").forEach((icon) => { icon.toggleAttribute("hidden", icon.dataset.recordingIcon !== kind); });
        const show = () => { tooltip.hidden = false; };
        const hide = () => { tooltip.hidden = true; };
        badge.addEventListener("pointerenter", (event) => { if (event.pointerType !== "touch") show(); });
        badge.addEventListener("pointerleave", (event) => { if (event.pointerType !== "touch") hide(); });
        trigger.addEventListener("focus", show);
        trigger.addEventListener("blur", hide);
        trigger.addEventListener("click", show);
        badge.addEventListener("keydown", (event) => { if (event.key === "Escape") { hide(); event.stopPropagation(); } });
        group.append(badge);
      });
      const status = document.createElement("span");
      status.className = "recording-status";
      status.setAttribute("data-recording-status", "");
      group.append(status);
      renderRecordingBadges(card, card.dataset.previewStage || "open");
    });
    document.addEventListener("pointerdown", (event) => {
      document.querySelectorAll('.recording-badge [role="tooltip"]').forEach((tooltip) => {
        if (!tooltip.parentElement.contains(event.target)) tooltip.hidden = true;
      });
    });
  }

  // Preview only: session videos and Slido URLs are not live.
  // Closing responses and publishing a follow-up are separate session states.
  const replayDialog = document.querySelector("[data-replay-dialog]");
  if (replayDialog) {
    const stageSelect = replayDialog.querySelector("[data-replay-stage]");
    const previewStages = new WeakMap();
    let activeCard;
    const selectVideo = (choice) => {
      const followup = choice === "followup" && stageSelect.value === "followup";
      replayDialog.querySelector("[data-player-title]").textContent = followup ? "Follow-up video preview" : "Session video will appear here";
      replayDialog.querySelector("[data-player-note]").textContent = followup ? "A separate recording for this session. No video is loaded in this mockup." : "This is a layout preview. The recording is not yet available.";
      replayDialog.querySelectorAll("[data-video-choice]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.videoChoice === (followup ? "followup" : "presentation")));
      });
    };
    replayDialog.querySelectorAll("[data-video-choice]").forEach((button) => {
      button.addEventListener("click", () => selectVideo(button.dataset.videoChoice));
    });
    replayDialog.querySelector("[data-followup-watch]").addEventListener("click", () => {
      selectVideo("followup");
      const choice = replayDialog.querySelector('[data-video-choice="followup"]');
      choice.focus();
      choice.scrollIntoView({ block: "nearest" });
    });
    const renderStage = () => {
      const stage = stageSelect.value;
      replayDialog.querySelector("[data-participation-panel]").hidden = stage !== "open";
      replayDialog.querySelector("[data-recording-pending]").hidden = stage !== "upcoming";
      replayDialog.querySelector("[data-slido-open]").hidden = stage !== "open";
      replayDialog.querySelector("[data-slido-closed]").hidden = stage !== "closed";
      replayDialog.querySelector("[data-followup-pending]").hidden = stage !== "closed";
      replayDialog.querySelector("[data-followup-section]").hidden = stage !== "followup";
      replayDialog.querySelector("[data-followup-watch]").hidden = stage !== "followup";
      replayDialog.querySelector("[data-video-switch]").hidden = stage !== "followup";
      selectVideo("presentation");
      if (activeCard) {
        previewStages.set(activeCard, stage);
        renderRecordingBadges(activeCard, stage);
      }
    };
    stageSelect.addEventListener("change", renderStage);
    document.querySelectorAll("[data-replay-open]").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest("[data-replay-card]");
        replayDialog.querySelector("#replay-dialog-title").textContent = card.querySelector("h3").textContent;
        replayDialog.querySelector("[data-replay-date]").textContent = card.querySelector(".replay-card__meta").textContent;
        replayDialog.querySelector("[data-replay-speaker]").textContent = card.querySelector(".replay-card__speaker").textContent;
        replayDialog.querySelector("[data-replay-description]").textContent = card.querySelector(".replay-card__description").textContent;
        activeCard = card;
        replayDialog.querySelector("[data-followup-parent]").textContent = card.querySelector("h3").textContent;
        stageSelect.value = previewStages.get(card) || card.dataset.previewStage || "open";
        renderStage();
        replayDialog.querySelector(".replay-preview-settings").open = false;
        replayDialog.querySelector(".replay-session-details").open = false;
        replayDialog.showModal();
      });
    });
    replayDialog.querySelector("[data-replay-close]").addEventListener("click", () => replayDialog.close());
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

  // Separate presenter inquiry prototype; replace its form with Jotform later.
  const presenterDialog = document.querySelector("#presenter-dialog");
  const presenterTrigger = document.querySelector("[data-presenter-open]");
  if (presenterDialog && presenterTrigger) {
    const form = presenterDialog.querySelector("[data-presenter-form]");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      presenterDialog.querySelector("[data-presenter-message]").textContent = "Preview complete. In the live form, your inquiry would be sent to the series team. Nothing has been sent or saved.";
    });
    form.querySelector("fieldset").disabled = false;
    presenterTrigger.addEventListener("click", () => presenterDialog.showModal());
    presenterDialog.querySelector("[data-presenter-close]").addEventListener("click", () => presenterDialog.close());
    presenterDialog.addEventListener("close", () => {
      form.reset();
      presenterDialog.querySelector("[data-presenter-message]").textContent = "";
      presenterTrigger.focus({ preventScroll: true });
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
