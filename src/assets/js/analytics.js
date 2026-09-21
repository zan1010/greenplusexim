/* Green Plus EXIM — GA4 (Consent Mode v2) + Clarity loader + event helper */
(function () {
  "use strict";

  var GA4_ID = document.documentElement.dataset.ga4Id || "";
  var CLARITY_ID = document.documentElement.dataset.clarityId || "";
  var EU_LANGS = ["es", "fr", "de", "nl", "pt"]; // EU/UK-facing localized pages default to consent-denied
  var lang = document.documentElement.lang || "en";
  var isEuPage = EU_LANGS.indexOf(lang) !== -1;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("consent", "default", {
    ad_storage: isEuPage ? "denied" : "granted",
    analytics_storage: isEuPage ? "denied" : "granted",
    ad_user_data: isEuPage ? "denied" : "granted",
    ad_personalization: isEuPage ? "denied" : "granted",
    wait_for_update: isEuPage ? 500 : 0,
  });

  function loadGa4() {
    if (!GA4_ID || GA4_ID.indexOf("TODO") === 0) return;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA4_ID, { anonymize_ip: true });
  }

  function loadClarity() {
    if (!CLARITY_ID || CLARITY_ID.indexOf("TODO") === 0) return;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }

  if (!isEuPage) {
    loadGa4();
    loadClarity();
  }

  /* ---- Consent banner (EU/UK language pages only) ---- */
  if (isEuPage) {
    var CONSENT_KEY = "gp_consent";
    var existing = null;
    try {
      existing = localStorage.getItem(CONSENT_KEY);
    } catch (e) {}

    if (existing === "granted") {
      gtag("consent", "update", {
        ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "granted",
      });
      loadGa4();
      loadClarity();
    } else if (!existing) {
      document.addEventListener("DOMContentLoaded", function () {
        var banner = document.createElement("div");
        banner.className = "consent-banner";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-label", "Cookie consent");
        banner.innerHTML =
          '<p>We use cookies to analyse traffic and improve this site. See our <a href="/privacy-policy/">Privacy Policy</a>.</p>' +
          '<div class="consent-actions"><button type="button" data-consent="deny" class="btn btn-secondary">Decline</button>' +
          '<button type="button" data-consent="accept" class="btn btn-primary">Accept</button></div>';
        document.body.appendChild(banner);
        banner.addEventListener("click", function (e) {
          var action = e.target.getAttribute("data-consent");
          if (!action) return;
          try {
            localStorage.setItem(CONSENT_KEY, action === "accept" ? "granted" : "denied");
          } catch (err) {}
          if (action === "accept") {
            gtag("consent", "update", {
              ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "granted",
            });
            loadGa4();
            loadClarity();
          }
          banner.remove();
        });
      });
    }
  }

  /* ---- gpTrack: unified event helper ---- */
  window.gpTrack = function (eventName, params) {
    gtag("event", eventName, params || {});
  };
})();
