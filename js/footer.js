/* ============================================================
   REC — Footer (single source, rendered on every page)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;
  const icon = UI.icon;

  REC.renderer = REC.renderer || {};

  REC.renderer.footer = function () {
    const host = document.getElementById("site-footer");
    if (!host) return;
    const cfg = REC.config;
    const year = new Date().getFullYear();
    const s = REC.siteData || {};

    const personalBase = String(cfg.phone || cfg.phoneRaw).replace(/\D/g, "");
    const waPersonal =
      s.social_whatsapp ||
      "https://wa.me/" + personalBase + "?text=" + encodeURIComponent("Hello REC Livestock & Agro Farms, I would like to make an enquiry.");
    const socials = [
      { href: waPersonal, icon: "i-whatsapp", label: "WhatsApp" },
      { href: s.whatsapp_group, icon: "i-whatsapp", label: "WhatsApp Group" },
      { href: s.social_facebook, icon: "i-facebook", label: "Facebook" },
      { href: s.social_instagram, icon: "i-instagram", label: "Instagram" },
      { href: s.social_tiktok, icon: "i-tiktok", label: "TikTok" },
      { href: s.social_youtube, icon: "i-youtube", label: "YouTube" },
      { href: s.social_telegram || s.telegram_channel, icon: "i-telegram", label: "Telegram" },
    ].filter((x) => !!x.href);

    const websiteHref = s.website || cfg.website;

    host.innerHTML =
      '<div class="container">' +
      '<div class="footer-top">' +
      '<div class="footer-brand">' +
      '<img src="assets/logo/rec-logo.jpg" alt="REC Livestock & Agro Farms logo"/>' +
      '<div class="fb-name">' + UI.esc(cfg.appName) + "</div>" +
      "<p>" +
      UI.esc(cfg.motto) +
      "</p>" +
      "<p>We produce and supply quality poultry, livestock, eggs, fish and farm supplies across Nigeria.</p>" +
      '<div class="social-links">' +
      socials
        .map((x) =>
          '<a href="' + UI.esc(x.href) + '" aria-label="' + UI.esc(x.label) + '" target="_blank" rel="noopener">' + icon(x.icon) + "</a>"
        )
        .join("") +
      "</div>" +
      "</div>" +
      '<div class="footer-col"><h4>Quick Links</h4><ul>' +
      [
        ["Home", "index.html"],
        ["Shop", "shop.html"],
        ["About Us", "about.html"],
        ["Our Farms", "contact.html"],
        ["Blog", "blog.html"],
        ["Contact", "contact.html"],
      ]
        .map(([l, h]) => '<li><a href="' + h + '">' + l + "</a></li>")
        .join("") +
      "</ul></div>" +
      '<div class="footer-col"><h4>Our Products</h4><ul>' +
      [
        "Poultry",
        "Eggs",
        "Livestock",
        "Fish",
        "Farm Supplies",
      ]
        .map((c) => '<li><a href="shop.html?category=' + encodeURIComponent(c.toLowerCase().replace(/\s+/g, "-")) + '">' + c + "</a></li>")
        .join("") +
      "</ul></div>" +
      '<div class="footer-col"><h4>Account</h4><ul>' +
      [
        ["My Cart", "cart.html"],
        ["Track Order", "account.html"],
        ["My Account", "account.html"],
      ]
        .map(([l, h]) => '<li><a href="' + h + '">' + l + "</a></li>")
        .join("") +
      "</ul></div>" +
      '<div class="footer-col"><h4>Contact Us</h4><ul class="footer-contact">' +
      "<li>" + icon("i-map-pin") + "<span>" + UI.esc(cfg.location) + "</span></li>" +
      "<li>" + icon("i-truck") + "<span>Delivery nationwide</span></li>" +
      "<li>" + icon("i-phone") + '<a href="tel:' + UI.esc(cfg.phoneRaw) + '">' + UI.esc(cfg.phone) + "</a></li>" +
      "<li>" + icon("i-mail") + '<a href="mailto:' + UI.esc(cfg.email) + '">' + UI.esc(cfg.email) + "</a></li>" +
      (websiteHref
        ? "<li>" + icon("i-globe") + '<a href="' + UI.esc(websiteHref) + '" target="_blank" rel="noopener">' + UI.esc(websiteHref.replace(/^https?:\/\/(www\.)?/, "")) + "</a></li>"
        : "") +
      "</ul></div>" +
      "</div>" +
      '<div class="footer-bottom container">' +
      "<span>&copy; " + year + " " + UI.esc(cfg.appName) + ". All rights reserved.</span>" +
      '<div class="footer-legal">' +
      '<a href="privacy.html">Privacy Policy</a>' +
      '<a href="terms.html">Terms &amp; Conditions</a>' +
      "</div>" +
      "</div>" +
      "</div>";
  };

  document.addEventListener("DOMContentLoaded", () => {
    REC.renderer.footer();
    if (REC.siteData) return;
    REC.products
      .getSettings()
      .then((s) => {
        if (s && JSON.stringify(s) !== JSON.stringify(REC.siteData || {})) {
          REC.siteData = s;
          REC.renderer.footer();
        }
      })
      .catch(() => {});
  });
})(window);