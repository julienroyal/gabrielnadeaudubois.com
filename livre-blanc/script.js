const pageShell = document.querySelector(".page-shell");
const passwordGate = document.querySelector(".password-gate");
const passwordGateForm = document.querySelector(".password-gate__form");
const passwordGateInput = document.querySelector(".password-gate__input");
const passwordGateStatus = document.querySelector(".password-gate__status");
const downloadUrl = document.body.dataset.downloadUrl.trim();
const gatePassword = (document.body.dataset.gatePassword || "").trim();
const gateUntil = (document.body.dataset.gateUntil || "").trim();
const downloadLinks = document.querySelectorAll(".js-download-link");
const copyShareUrlButton = document.querySelector(".js-copy-share-url");
const shareWidget = document.querySelector(".share-widget");
const shareStatus = document.querySelector(".share-widget__status");
const revealItems = document.querySelectorAll(".reveal");
const stickyCta = document.querySelector(".sticky-cta");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const copyShareUrlLabel = copyShareUrlButton?.textContent.trim() || "";
const gateStorageKey = "livre-blanc-password-gate";
const gateUnlockTimestamp = gateUntil ? Date.parse(gateUntil) : Number.NaN;
const gatedRegions = [pageShell, stickyCta].filter(Boolean);
let shareStatusTimeout;

const setPasswordGateStatus = (message) => {
  if (passwordGateStatus) {
    passwordGateStatus.textContent = message;
  }
};

const normalizeGateValue = (value) => value.trim().normalize("NFC").toLocaleLowerCase("fr-CA");

const setProtectedContentState = (locked) => {
  document.body.classList.toggle("is-password-locked", locked);
  document.body.classList.toggle("is-password-unlocked", !locked);

  if (passwordGate) {
    passwordGate.toggleAttribute("hidden", !locked);
  }

  gatedRegions.forEach((region) => {
    if (locked) {
      region.setAttribute("inert", "");
      region.setAttribute("aria-hidden", "true");
      return;
    }

    region.removeAttribute("inert");
    region.removeAttribute("aria-hidden");
  });

  if (locked) {
    passwordGateInput?.focus();
  }
};

const clearPasswordGateMemory = () => {
  try {
    window.localStorage.removeItem(gateStorageKey);
  } catch {
    // Ignore storage access issues for this lightweight client-side gate.
  }
};

const rememberPasswordGateAccess = () => {
  try {
    window.localStorage.setItem(
      gateStorageKey,
      JSON.stringify({
        unlocked: true,
        gateUntil,
      })
    );
  } catch {
    // Ignore storage access issues for this lightweight client-side gate.
  }
};

const hasRememberedPasswordGateAccess = () => {
  try {
    const storedValue = window.localStorage.getItem(gateStorageKey);

    if (!storedValue) {
      return false;
    }

    const parsedValue = JSON.parse(storedValue);
    return parsedValue?.unlocked === true && parsedValue?.gateUntil === gateUntil;
  } catch {
    return false;
  }
};

const passwordGateExpired = !gatePassword || !Number.isFinite(gateUnlockTimestamp) || Date.now() >= gateUnlockTimestamp;

if (passwordGateExpired || !passwordGate || !passwordGateForm || !passwordGateInput) {
  clearPasswordGateMemory();
  setProtectedContentState(false);
} else {
  setProtectedContentState(!hasRememberedPasswordGateAccess());

  passwordGateForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const submittedPassword = normalizeGateValue(passwordGateInput.value);

    if (submittedPassword === normalizeGateValue(gatePassword)) {
      rememberPasswordGateAccess();
      setPasswordGateStatus("");
      passwordGateForm.reset();
      setProtectedContentState(false);
      return;
    }

    setPasswordGateStatus("Mot de passe incorrect.");
    passwordGateInput.select();
  });

  const millisecondsUntilGateLift = gateUnlockTimestamp - Date.now();

  if (millisecondsUntilGateLift > 0) {
    window.setTimeout(() => {
      clearPasswordGateMemory();
      setProtectedContentState(false);
    }, millisecondsUntilGateLift);
  }
}

downloadLinks.forEach((link) => {
  if (downloadUrl) {
    link.href = downloadUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return;
  }

  link.href = link.dataset.downloadFallback || "#top";
});

const setShareStatus = (message) => {
  if (shareStatus) {
    shareStatus.textContent = message;
  }
};

const copyTextToClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.append(tempInput);
  tempInput.select();
  tempInput.setSelectionRange(0, tempInput.value.length);

  const copied = document.execCommand("copy");
  tempInput.remove();
  return copied;
};

if (copyShareUrlButton && shareWidget) {
  copyShareUrlButton.addEventListener("click", async () => {
    const shareUrl = shareWidget.dataset.shareUrl || "";

    try {
      const copied = await copyTextToClipboard(shareUrl);

      if (!copied) {
        throw new Error("copy failed");
      }

      shareWidget.classList.add("is-copied");
      copyShareUrlButton.classList.add("is-copied");
      copyShareUrlButton.textContent = "Copié";
      setShareStatus("URL copiée");

      clearTimeout(shareStatusTimeout);
      shareStatusTimeout = window.setTimeout(() => {
        shareWidget.classList.remove("is-copied");
        copyShareUrlButton.classList.remove("is-copied");
        copyShareUrlButton.textContent = copyShareUrlLabel;
        setShareStatus("");
      }, 2200);
    } catch {
      setShareStatus("Impossible de copier l’URL automatiquement");
    }
  });
}

if (reducedMotionQuery.matches) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

if (stickyCta) {
  const updateStickyVisibility = () => {
    stickyCta.classList.toggle("is-visible", window.scrollY > 16);
  };

  updateStickyVisibility();
  window.addEventListener("scroll", updateStickyVisibility, { passive: true });
}
