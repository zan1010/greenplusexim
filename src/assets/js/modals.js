/* Green Plus EXIM — exit-intent (desktop) + scroll-depth (mobile) quick-quote modal, max once per 7 days */
(function () {
  "use strict";
  var STORAGE_KEY = "gp_modal_seen_at";
  var SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  var modal = document.getElementById("quick-quote-modal");
  if (!modal) return;

  function recentlySeen() {
    try {
      var ts = localStorage.getItem(STORAGE_KEY);
      return ts && Date.now() - Number(ts) < SEVEN_DAYS;
    } catch (e) {
      return false;
    }
  }

  function markSeen() {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch (e) {}
  }

  var shown = false;
  function openModal() {
    if (shown || recentlySeen()) return;
    shown = true;
    markSeen();
    modal.removeAttribute("hidden");
    var closeBtn = modal.querySelector(".modal-close");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    modal.setAttribute("hidden", "");
  }

  modal.addEventListener("click", function (e) {
    if (e.target === modal || e.target.closest(".modal-close")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hasAttribute("hidden")) closeModal();
  });

  var isDesktop = window.matchMedia("(min-width: 1024px)").matches;

  if (isDesktop) {
    document.addEventListener("mouseout", function (e) {
      if (!e.relatedTarget && e.clientY < 10) openModal();
    });
  } else {
    var triggered = false;
    window.addEventListener(
      "scroll",
      function () {
        if (triggered) return;
        var scrolled = window.scrollY + window.innerHeight;
        var total = document.documentElement.scrollHeight;
        if (total > 0 && scrolled / total >= 0.7) {
          triggered = true;
          openModal();
        }
      },
      { passive: true }
    );
  }
})();
