/* Green Plus EXIM — fires generate_lead on /thank-you/ using sessionStorage attribution */
(function () {
  "use strict";
  function fire() {
    var params = new URLSearchParams(window.location.search);
    var utms = {};
    try {
      utms = JSON.parse(sessionStorage.getItem("gp_utms") || "{}");
    } catch (e) {}
    var payload = {
      form_name: params.get("form-name") || "export-inquiry",
      product: params.get("product") || "",
      country: params.get("country") || "",
      utm_source: utms.utm_source || "",
      utm_medium: utms.utm_medium || "",
      utm_campaign: utms.utm_campaign || "",
    };
    if (window.gpTrack) window.gpTrack("generate_lead", payload);
    else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "generate_lead", ...payload });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fire);
  } else {
    fire();
  }
})();
