const downloadUrl = document.body.dataset.downloadUrl.trim();
const downloadLinks = document.querySelectorAll(".js-download-link");
const copyShareUrlButton = document.querySelector(".js-copy-share-url");
const shareWidget = document.querySelector(".share-widget");
const shareStatus = document.querySelector(".share-widget__status");
const revealItems = document.querySelectorAll(".reveal");
const stickyCta = document.querySelector(".sticky-cta");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const copyShareUrlLabel = copyShareUrlButton?.textContent.trim() || "";
let shareStatusTimeout;

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
