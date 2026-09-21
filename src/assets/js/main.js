/* Green Plus EXIM — core UI behaviour (header, mega menu, mobile drawer, FAQ, reveal) */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Sticky header shrink ---- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Desktop mega menu / dropdown: hover-intent with a close delay ----
     Plain CSS `:hover` has no memory — if the panel is wider than its trigger (true for
     every mega-menu here), a natural diagonal mouse path from the trigger toward a link on
     the far side of the panel can momentarily leave both the trigger's and the panel's hit
     boxes, and CSS slams the menu shut mid-transit before the click ever lands. Driving the
     open/close through a JS `.is-open` class with a short cancellable close delay gives the
     cursor room to reach the panel even if it briefly strays outside both boxes, which is
     the standard fix for this class of bug. Click/keyboard behaviour is unchanged. */
  document.querySelectorAll(".nav-item").forEach(function (item) {
    var trigger = item.querySelector(".nav-link");
    var panel = item.querySelector(".mega-menu, .dropdown");
    if (!trigger || !panel) return;
    trigger.setAttribute("aria-expanded", "false");
    var closeTimer = null;

    function open() {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      panel.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    }
    function scheduleClose() {
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(function () {
        panel.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        closeTimer = null;
      }, 300);
    }

    item.addEventListener("mouseenter", open);
    item.addEventListener("mouseleave", scheduleClose);

    trigger.addEventListener("click", function (e) {
      if (panel.classList.contains("mega-menu") || panel.classList.contains("dropdown")) {
        e.preventDefault();
        if (panel.classList.contains("is-open")) {
          if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
          panel.classList.remove("is-open");
          trigger.setAttribute("aria-expanded", "false");
        } else {
          open();
        }
      }
    });
    item.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
        panel.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
      }
    });
  });
  document.addEventListener("click", function (e) {
    document.querySelectorAll(".mega-menu.is-open, .dropdown.is-open").forEach(function (panel) {
      if (!panel.parentElement.contains(e.target)) {
        panel.classList.remove("is-open");
        var t = panel.parentElement.querySelector(".nav-link");
        if (t) t.setAttribute("aria-expanded", "false");
      }
    });
  });

  /* ---- Mobile drawer ---- */
  var hamburger = document.querySelector(".hamburger");
  var drawer = document.querySelector(".mobile-drawer");
  var drawerClose = document.querySelector(".mobile-drawer-close");

  function trapFocus(container, e) {
    var focusable = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add("is-open");
    drawer.removeAttribute("hidden");
    hamburger.setAttribute("aria-expanded", "true");
    document.body.classList.add("drawer-open");
    var firstFocusable = drawer.querySelector("a, button");
    if (firstFocusable) firstFocusable.focus();
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("drawer-open");
    setTimeout(function () {
      if (!drawer.classList.contains("is-open")) drawer.setAttribute("hidden", "");
    }, 260);
    hamburger.focus();
  }

  if (hamburger && drawer) {
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.addEventListener("click", function () {
      if (drawer.classList.contains("is-open")) closeDrawer();
      else openDrawer();
    });
    if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
    drawer.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
      if (e.key === "Tab") trapFocus(drawer, e);
    });
    drawer.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeDrawer);
    });
  }

  /* ---- Mobile accordion ---- */
  document.querySelectorAll(".mobile-accordion button").forEach(function (btn) {
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", function () {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      var isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!isOpen));
      if (panel) panel.style.maxHeight = isOpen ? null : panel.scrollHeight + "px";
    });
  });

  /* ---- FAQ accordions ---- */
  document.querySelectorAll(".faq-item button").forEach(function (btn) {
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", function () {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      var isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!isOpen));
      if (panel) panel.style.maxHeight = isOpen ? null : panel.scrollHeight + "px";
    });
  });

  /* ---- Scroll reveal ---- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      io.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---- WhatsApp link message + click tracking ---- */
  document.querySelectorAll("a[data-whatsapp]").forEach(function (link) {
    var msg = "Hi Green Plus EXIM, I'd like to enquire about: " + document.title;
    link.href = "https://wa.me/918767180960?text=" + encodeURIComponent(msg);
    link.addEventListener("click", function () {
      if (window.gpTrack) window.gpTrack("whatsapp_click", {});
    });
  });
  document.querySelectorAll("a[href^='mailto:']").forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.gpTrack) window.gpTrack("email_click", {});
    });
  });
  document.querySelectorAll("a[href^='tel:']").forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.gpTrack) window.gpTrack("phone_click", {});
    });
  });
  document.querySelectorAll("[data-quote-cta]").forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.gpTrack) window.gpTrack("quote_cta_click", { label: link.dataset.quoteCta || "" });
    });
  });
})();
