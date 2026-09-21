/* Green Plus EXIM — RFQ form behaviour: UTM capture, 2-step progressive UX, no preventDefault */
(function () {
  "use strict";

  /* ---- Persist first-touch UTMs + referrer in sessionStorage ---- */
  function captureUtms() {
    var params = new URLSearchParams(window.location.search);
    var keys = ["utm_source", "utm_medium", "utm_campaign"];
    var stored = {};
    try {
      var existing = sessionStorage.getItem("gp_utms");
      if (existing) stored = JSON.parse(existing);
    } catch (e) {}
    var changed = false;
    keys.forEach(function (k) {
      if (params.get(k) && !stored[k]) {
        stored[k] = params.get(k);
        changed = true;
      }
    });
    if (!stored.referrer && document.referrer) {
      stored.referrer = document.referrer;
      changed = true;
    }
    if (changed) {
      try {
        sessionStorage.setItem("gp_utms", JSON.stringify(stored));
      } catch (e) {}
    }
    return stored;
  }

  var utms = captureUtms();

  /* ---- Fill hidden attribution fields on every form on the page ---- */
  document.querySelectorAll("form.rfq-form, form.quick-quote-form").forEach(function (form) {
    var setVal = function (name, val) {
      var field = form.querySelector('[name="' + name + '"]');
      if (field && !field.value) field.value = val || "";
    };
    setVal("source_page", window.location.pathname);
    setVal("page_language", document.documentElement.lang || "en");
    setVal("utm_source", utms.utm_source);
    setVal("utm_medium", utms.utm_medium);
    setVal("utm_campaign", utms.utm_campaign);
    setVal("referrer", utms.referrer);
  });

  /* ---- Two-step progressive RFQ form ---- */
  document.querySelectorAll(".rfq-form").forEach(function (form) {
    var step1 = form.querySelector('[data-step="1"]');
    var step2 = form.querySelector('[data-step="2"]');
    var nextBtn = form.querySelector("[data-next-step]");
    var backBtn = form.querySelector("[data-prev-step]");
    var progress = form.querySelector(".form-progress");
    var started = false;

    if (!step1 || !step2 || !nextBtn) return; // JS disabled / no-JS fallback shows both steps

    function goToStep(n) {
      if (n === 2) {
        step1.setAttribute("hidden", "");
        step2.removeAttribute("hidden");
        if (progress) progress.textContent = progress.dataset.step2Label || "Step 2 of 2 — almost done";
        var firstField = step2.querySelector("input, select, textarea");
        if (firstField) firstField.focus();
        if (window.gpTrack) window.gpTrack("form_step_2", {});
      } else {
        step2.setAttribute("hidden", "");
        step1.removeAttribute("hidden");
        if (progress) progress.textContent = progress.dataset.step1Label || "Step 1 of 2 — takes 60 seconds";
      }
    }

    form.addEventListener(
      "focusin",
      function () {
        if (!started) {
          started = true;
          if (window.gpTrack) window.gpTrack("form_start", {});
        }
      },
      { once: true }
    );

    nextBtn.addEventListener("click", function () {
      var required = step1.querySelectorAll("[required]");
      var valid = true;
      required.forEach(function (field) {
        if (!field.checkValidity()) {
          valid = false;
          field.reportValidity();
        }
      });
      if (valid) goToStep(2);
    });

    if (backBtn) backBtn.addEventListener("click", function () { goToStep(1); });

    form.addEventListener("submit", function () {
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = form.dataset.sendingLabel || "Sending…";
      }
      /* Plain HTML POST to Netlify — no preventDefault, browser handles navigation */
    });
  });

  /* ---- Quick-quote inline forms just disable-on-submit ---- */
  document.querySelectorAll(".quick-quote-form").forEach(function (form) {
    form.addEventListener("submit", function () {
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = form.dataset.sendingLabel || "Sending…";
      }
    });
  });

  /* ---- Prefill destination_country from data attribute (market pages) ---- */
  document.querySelectorAll("form[data-prefill-country]").forEach(function (form) {
    var field = form.querySelector('[name="destination_country"]');
    if (field) field.value = form.dataset.prefillCountry;
  });
  document.querySelectorAll("form[data-prefill-product]").forEach(function (form) {
    var field = form.querySelector('[name="product_name"]');
    if (field) field.value = form.dataset.prefillProduct;
    var ctx = form.querySelector('[name="product_context"]');
    if (ctx) ctx.value = form.dataset.prefillProduct;
  });
})();
