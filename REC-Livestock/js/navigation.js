/* ============================================================
   REC — Navigation (header, mobile drawer, search, cart count)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;

  const NAV_LINKS = [
    { href: "index.html", label: "Home" },
    { href: "shop.html", label: "Shop" },
    { href: "about.html", label: "About Us" },
    { href: "contact.html", label: "Our Farms" },
    { href: "blog.html", label: "Blog" },
    { href: "contact.html", label: "Contact" },
  ];

  const ICON = (id) => UI.icon(id);

  function brandHtml() {
    return (
      '<a class="brand" href="index.html" aria-label="REC Livestock & Agro Farms home">' +
      '<img src="assets/logo/rec-logo.jpg" alt="REC Livestock & Agro Farms logo"/>' +
      '<span class="b-text">REC<br/><span>Livestock &amp; Agro</span></span>' +
      "</a>"
    );
  }

  function highlightActive() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".main-nav a, .mm-nav a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href === path) a.classList.add("active");
      else a.classList.remove("active");
    });
  }

  function setCartCount() {
    const items = REC.cart ? REC.cart.items() : [];
    const n = items.reduce((s, i) => s + i.quantity, 0);
    document.querySelectorAll(".cart-count").forEach((el) => {
      el.textContent = n;
      el.style.display = "grid";
    });
  }

  REC.navigation = {
    renderHeader() {
      const header = document.getElementById("site-header");
      if (!header) return;
      header.innerHTML =
        '<div class="container header-inner">' +
        brandHtml() +
        '<nav class="main-nav" aria-label="Primary">' +
        "<ul>" +
        NAV_LINKS.map(
          (l) => '<li><a href="' + l.href + '">' + l.label + "</a></li>"
        ).join("") +
        "</ul>" +
        "</nav>" +
        '<div class="header-actions">' +
        '<button type="button" class="icon-btn mobile-search-toggle" data-open-search aria-label="Search">' +
        ICON("i-search") +
        "</button>" +
        '<a class="icon-btn ic-search" href="shop.html" aria-label="Search products" title="Search products">' +
        ICON("i-search") +
        "</a>" +
        '<a class="icon-btn ic-cart" href="cart.html" aria-label="Cart">' +
        ICON("i-cart") +
        '<span class="count cart-count">0</span>' +
        "</a>" +
        '<a class="icon-btn ic-user" href="account.html" aria-label="Account" title="Account">' +
        ICON("i-user") +
        "</a>" +
        '<a class="btn btn-primary header-cta" href="shop.html">Shop Now</a>' +
        '<button type="button" class="hamburger" data-menu-toggle aria-label="Open menu" aria-expanded="false">' +
        "<span></span><span></span><span></span>" +
        "</button>" +
        "</div>" +
        "</div>";
    },

    renderMobileMenu() {
      const host = document.getElementById("mobile-menu");
      if (!host) return;
      host.innerHTML =
        '<div class="mm-backdrop" data-menu-close></div>' +
        '<div class="mm-panel" role="dialog" aria-modal="true" aria-label="Mobile navigation">' +
        '<div class="mm-head">' +
        '<a class="brand" href="index.html">' +
        '<img src="assets/logo/rec-logo.jpg" alt="REC logo"/>' +
        "</a>" +
        '<button type="button" class="mm-close" data-menu-close aria-label="Close menu">' +
        ICON("i-close") +
        "</button>" +
        "</div>" +
        '<div class="mm-search">' +
        '<form class="mm-search-form" data-mm-search>' +
        '<div class="field" style="margin-bottom:0">' +
        '<label class="sr-only" for="mm-q">Search products</label>' +
        '<input class="input" id="mm-q" type="search" placeholder="Search products..."/>' +
        "</div>" +
        "</form>" +
        "</div>" +
        '<nav class="mm-nav" aria-label="Mobile">' +
        NAV_LINKS.map(
          (l) =>
            '<a href="' +
            l.href +
            '">' +
            l.label +
            ICON("i-chevron-right") +
            "</a>"
        ).join("") +
        '<a href="cart.html">Cart<span class="count cart-count">0</span>' + ICON("i-chevron-right") + "</a>" +
        '<a href="account.html">My Account' + ICON("i-chevron-right") + "</a>" +
        "</nav>" +
        '<div class="mm-foot">' +
        '<a class="btn btn-primary btn-block" href="shop.html">Shop Now</a>' +
        '<a class="btn btn-whatsapp btn-block" href="#" data-wa-general target="_blank" rel="noopener">' +
        ICON("i-whatsapp") +
        "Chat With Us</a>" +
        '<p class="text-center" style="font-size:.78rem;color:var(--muted)">' +
        REC.config.phone +
        "</p>" +
        "</div>" +
        "</div>";
    },
  };

  function initMobileMenu() {
    const menu = document.getElementById("mobile-menu");
    const toggle = document.querySelector("[data-menu-toggle]");
    if (!menu || !toggle) return;
    const open = () => {
      menu.classList.add("open");
      toggle.classList.add("active");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      menu.classList.remove("open");
      toggle.classList.remove("active");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    };
    toggle.addEventListener("click", () =>
      menu.classList.contains("open") ? close() : open()
    );
    menu.querySelectorAll("[data-menu-close]").forEach((el) =>
      el.addEventListener("click", close)
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  function initSearch() {
    const mmForm = document.querySelector("[data-mm-search]");
    if (mmForm) {
      mmForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = (mmForm.querySelector("input").value || "").trim();
        location.href = "shop.html" + (q ? "?q=" + encodeURIComponent(q) : "");
      });
    }
    document.querySelectorAll("[data-open-search]").forEach((btn) => {
      btn.addEventListener("click", () => {
        location.href = "shop.html";
      });
    });
  }

  function initScroll() {
    const header = document.getElementById("site-header");
    if (!header) return;
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    REC.navigation.renderHeader();
    REC.navigation.renderMobileMenu();
    initMobileMenu();
    initSearch();
    initScroll();
    highlightActive();
    if (REC.cart) {
      setCartCount();
      document.addEventListener("rec:cartchange", setCartCount);
      window.addEventListener("storage", (e) => {
        if (e.key === "rec_cart") setCartCount();
      });
    }
    REC.ui.initWhatsApp();
    REC.ui.initReveal();
  });

  win.REC = REC;
})(window);