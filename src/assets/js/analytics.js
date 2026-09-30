/* Green Plus EXIM — GA4 (Consent Mode v2) + Clarity loader + event helper */
(function () {
  "use strict";

  var GA4_ID = document.documentElement.dataset.ga4Id || "";
  var CLARITY_ID = document.documentElement.dataset.clarityId || "";
  // Consent Mode v2 (advanced): gtag.js always loads, but in the EEA/UK/CH it runs cookieless
  // (consent "denied") until the visitor accepts the banner. Google resolves `region` from the
  // visitor's IP, so EEA visitors are covered on every page, not just EU-language ones.
  var CONSENT_REGIONS = [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IE",
    "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
    "GB", "CH",
  ];
  var EU_LANGS = ["es", "fr", "de", "nl", "pt"]; // EU/UK-facing localized pages
  var CONSENT_KEY = "gp_consent";
  var lang = document.documentElement.lang || "en";

  // We can't see the visitor's IP client-side, so the banner is shown when the visitor is
  // likely in Europe (browser timezone) or is on an EU-language page. Anyone shown the banner
  // is also denied by default until they choose, wherever Google places them.
  function likelyInEurope() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      return tz.indexOf("Europe/") === 0 || /^Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)$/.test(tz);
    } catch (e) {
      return false;
    }
  }
  var needsBanner = EU_LANGS.indexOf(lang) !== -1 || likelyInEurope();

  function consentState(value) {
    return { ad_storage: value, analytics_storage: value, ad_user_data: value, ad_personalization: value };
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  var regionDefault = consentState("denied");
  regionDefault.region = CONSENT_REGIONS;
  regionDefault.wait_for_update = 500;
  gtag("consent", "default", regionDefault);
  gtag("consent", "default", consentState(needsBanner ? "denied" : "granted"));

  var stored = null;
  try {
    stored = localStorage.getItem(CONSENT_KEY);
  } catch (e) {}
  if (stored === "granted" || stored === "denied") gtag("consent", "update", consentState(stored));

  function loadGa4() {
    if (!GA4_ID || GA4_ID.indexOf("TODO") === 0) return;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA4_ID);
  }

  // Clarity has no cookieless mode here, so it only loads once analytics consent is effective.
  var clarityLoaded = false;
  function loadClarity() {
    if (clarityLoaded || !CLARITY_ID || CLARITY_ID.indexOf("TODO") === 0) return;
    clarityLoaded = true;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }

  loadGa4();
  if (stored === "granted" || (!needsBanner && stored !== "denied")) loadClarity();

  /* ---- Consent banner ---- */
  function saveChoice(choice) {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch (err) {}
    gtag("consent", "update", consentState(choice));
    if (choice === "granted") loadClarity();
  }

  function showBanner() {
    if (document.querySelector(".consent-banner")) return;
    var banner = document.createElement("div");
    banner.className = "consent-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.innerHTML =
      '<p>We use cookies to analyse traffic and improve this site. See our <a href="/privacy-policy/">Privacy Policy</a>.</p>' +
      '<div class="consent-actions"><button type="button" data-consent="denied" class="btn btn-secondary">Decline</button>' +
      '<button type="button" data-consent="granted" class="btn btn-primary">Accept</button></div>';
    document.body.appendChild(banner);
    banner.addEventListener("click", function (e) {
      var choice = e.target.getAttribute("data-consent");
      if (!choice) return;
      saveChoice(choice);
      banner.remove();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (needsBanner && !stored) showBanner();
    // "Cookie settings" link in the footer: lets anyone change or withdraw their choice.
    document.addEventListener("click", function (e) {
      var trigger = e.target.closest && e.target.closest("[data-open-consent]");
      if (!trigger) return;
      e.preventDefault();
      showBanner();
    });
  });

  /* ---- gpTrack: unified event helper ---- */
  window.gpTrack = function (eventName, params) {
    gtag("event", eventName, params || {});
  };
})();
