/* ============================================================
   REC — UI helpers (icons, toast, format, whatsapp, reveal)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});

  const inAdmin = (window.location.pathname || "").includes("/rule/");
  const SPRITE = inAdmin ? "../assets/icons/sprite.svg" : "assets/icons/sprite.svg";

  const UI = {
    icon(id, cls) {
      const c = cls ? ' class="' + cls + '"' : "";
      return (
        '<svg' + c + ' aria-hidden="true"><use href="' + SPRITE + "#" + id + '"></use></svg>'
      );
    },

    money(n) {
      const v = Number(n || 0);
      return (
        "\u20A6" +
        v.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      );
    },

    esc(str) {
      return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]);
    },

    formatDate(iso, withTime) {
      if (!iso) return "—";
      const d = new Date(iso);
      if (isNaN(d)) return "—";
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      });
    },

    /** Toast notifications */
    toast(message, type) {
      let root = document.querySelector(".toast-root");
      if (!root) {
        root = document.createElement("div");
        root.className = "toast-root";
        root.setAttribute("aria-live", "polite");
        document.body.appendChild(root);
      }
      const icons = {
        success: "i-check-circle",
        error: "i-alert",
        warning: "i-info",
        info: "i-info",
      };
      const el = document.createElement("div");
      el.className = "toast " + (type || "info");
      el.setAttribute("role", "status");
      el.innerHTML =
        '<span class="t-icon">' +
        UI.icon(icons[type] || "i-info") +
        "</span><span></span>";
      el.querySelector("span:last-child").textContent = message;
      root.appendChild(el);
      setTimeout(() => {
        el.style.opacity = "0";
        el.style.transform = "translateY(-8px)";
        setTimeout(() => el.remove(), 300);
      }, 4200);
    },

    /** Reveal-on-scroll */
    initReveal() {
      const items = document.querySelectorAll(".reveal:not(.in)");
      if (!items.length) return;
      if (win.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        items.forEach((el) => el.classList.add("in"));
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("in");
              io.unobserve(en.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      items.forEach((el) => io.observe(el));
    },

    /** WhatsApp deep links (business number from config) */
    waLink(message) {
      const base =
        REC.config.phoneRaw || REC.config.phone.replace(/\D/g, "");
      const text = encodeURIComponent((message || "").replace(/\n/g, " "));
      return "https://wa.me/" + base + (text ? "?text=" + text : "");
    },

    waProductMessage(productName) {
      return (
        "Hello REC Livestock & Agro Farms,\n" +
        "I am interested in " +
        (productName || "your products") +
        ".\nPlease provide more information."
      );
    },

    initWhatsApp() {
      document.querySelectorAll("[data-wa-general]").forEach((a) => {
        a.href = UI.waLink("Hello REC Livestock & Agro Farms, I would like to make an enquiry.");
      });
      document.querySelectorAll("[data-wa-product]").forEach((a) => {
        const p = a.getAttribute("data-wa-product");
        a.href = UI.waLink(UI.waProductMessage(p));
      });
      const float = document.getElementById("wa-float");
      if (float) {
        const pulse = document.createElement("span");
        pulse.className = "pulse";
        float.appendChild(pulse);
        const personal = String(REC.config.phone || REC.config.phoneRaw).replace(/\D/g, "");
        const msg = "Hello REC Livestock & Agro Farms, I would like to make an enquiry.";
        float.href = "https://wa.me/" + personal + "?text=" + encodeURIComponent(msg);
      }
    },

    /** Skeleton grid for product loading */
    skeletonGrid(count, type) {
      const n = count || 6;
      let out = "";
      for (let i = 0; i < n; i++) {
        if (type === "product") {
          out +=
            '<div class="product-card" aria-hidden="true">' +
            '<div class="p-media"><div class="skeleton" style="width:100%;height:100%"></div></div>' +
            '<div class="p-body">' +
            '<div class="skeleton" style="height:12px;width:40%"></div>' +
            '<div class="skeleton" style="height:18px;width:75%;margin-top:8px"></div>' +
            '<div class="skeleton" style="height:14px;width:55%;margin-top:8px"></div>' +
            '<div class="skeleton" style="height:16px;width:50%;margin-top:14px"></div>' +
            "</div>" +
            "</div>";
        } else if (type === "category") {
          out +=
            '<div class="category-card" aria-hidden="true">' +
            '<div class="cat-media"><div class="skeleton" style="width:100%;height:100%"></div></div>' +
            '<div class="cat-body">' +
            '<div class="skeleton" style="height:16px;width:55%"></div>' +
            '<div class="skeleton" style="height:12px;width:80%;margin-top:8px"></div>' +
            "</div>" +
            "</div>";
        }
      }
      return out;
    },

    emptyState(title, message, actionHtml) {
      return (
        '<div class="empty-state">' +
        '<div class="e-icon">' + UI.icon("i-store") + "</div>" +
        "<h4>" + UI.esc(title) + "</h4>" +
        "<p>" + UI.esc(message) + "</p>" +
        (actionHtml || "") +
        "</div>"
      );
    },

    /** Avatar initials */
    initials(name) {
      return String(name || "R")
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    },

    qs(params) {
      return new URLSearchParams(window.location.search);
    },
  };

  /* Show/hide password toggles (buttons with .pw-toggle[data-target]) */
  win.addEventListener("click", function (e) {
    const btn = e.target.closest(".pw-toggle");
    if (!btn) return;
    const input = document.getElementById(btn.getAttribute("data-target"));
    if (!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.setAttribute("aria-pressed", show ? "true" : "false");
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    const use = btn.querySelector("use");
    if (use) {
      const base = (use.getAttribute("href") || "").split("#")[0];
      use.setAttribute("href", base + "#" + (show ? "i-eye-off" : "i-eye"));
    }
    input.focus();
  });

  REC.ui = UI;
  win.REC = REC;
})(window);