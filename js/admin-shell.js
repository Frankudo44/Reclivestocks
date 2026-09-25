/* ============================================================
   REC — Admin shell (shared): guard, sidebar, helpers
   NOTE: Authorization is enforced by Supabase RLS. This UI only
   improves UX; it never replaces database-level security.
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;

  const NAV = [
    { key: "dashboard", label: "Dashboard", icon: "i-grid", href: "index.html" },
    { key: "orders", label: "Orders", icon: "i-clipboard", href: "orders.html", count: true },
    { key: "products", label: "Products", icon: "i-box", href: "products.html" },
    { key: "categories", label: "Categories", icon: "i-layers", href: "categories.html" },
    { key: "inventory", label: "Inventory", icon: "i-database", href: "inventory.html" },
    { key: "batches", label: "Batches", icon: "i-layers", href: "batches.html" },
    { key: "customers", label: "Customers", icon: "i-users", href: "customers.html" },
    { key: "delivery", label: "Delivery", icon: "i-truck", href: "delivery.html" },
    { key: "pickups", label: "Pickups", icon: "i-map-pin", href: "pickups.html" },
    { key: "testimonials", label: "Testimonials", icon: "i-quote", href: "testimonials.html" },
    { key: "reviews", label: "Reviews", icon: "i-star", href: "reviews.html", count: true },
    { key: "blog", label: "Blog", icon: "i-file", href: "blog.html" },
    { key: "messages", label: "Messages", icon: "i-message", href: "messages.html", count: true },
    { key: "settings", label: "Settings", icon: "i-settings", href: "settings.html" },
  ];

  const ADMIN = (win.RECAdmin = win.RECAdmin || {});

  ADMIN.sb = function () {
    REC.initSupabase();
    return REC.supabaseClient;
  };

  ADMIN.guard = async function () {
    REC.initSupabase();
    if (!REC.isSupabaseConfigured() || !REC.supabaseClient) {
      showSetupNotice();
      return false;
    }
    try {
      const { data } = await REC.supabaseClient.auth.getSession();
      if (!data.session) {
        location.href = "login.html";
        return false;
      }
      const profile = await REC.auth.getProfile(data.session.user.id);
      if (!profile || profile.role !== "admin") {
        location.href = "login.html";
        return false;
      }
      REC.auth.cacheUser(data.session.user, profile);
      return true;
    } catch (e) {
      location.href = "login.html";
      return false;
    }
  };

  function showSetupNotice() {
    const main = document.getElementById("admin-main") || document.getElementById("admin-shell");
    if (!main) return;
    main.innerHTML =
      '<div class="empty-state" style="padding:4rem 1.5rem">' +
      '<div class="e-icon"><svg style="width:32px;height:32px"><use href="../assets/icons/sprite.svg#i-lock"></use></svg></div>' +
      "<h4>Supabase is not connected yet</h4>" +
      "<p>Add your public Supabase URL and anon key in <code>js/config.js</code>, then run the SQL in <code>supabase/schema.sql</code> and create an admin account.</p>" +
      '<a class="btn btn-primary" style="margin-top:1rem" href="login.html">Go to Admin Login</a>' +
      "</div>";
  }

  ADMIN.render = function (activeKey, userLabel) {
    const shell = document.getElementById("admin-shell");
    const main = document.getElementById("admin-main");
    if (!shell || !main) return;

    let items = NAV.map((n) => {
      const badge = n.count ? '<span class="nav-count" id="nav-count-' + n.key + '"></span>' : "";
      const activeCls = n.key === activeKey ? ' class="active"' : "";
      return (
        '<a href="' +
        n.href +
        '"' +
        activeCls +
        '><svg aria-hidden="true"><use href="../assets/icons/sprite.svg#' +
        n.icon +
        '"></use></svg><span>' +
        n.label +
        "</span>" +
        badge +
        "</a>"
      );
    }).join("");

    const user = REC.auth.currentUser();
    const name = user && user.profile ? user.profile.full_name : userLabel || "";
    const initials = UI.initials(name) || "R";

    shell.innerHTML =
      '<aside class="admin-sidebar" id="admin-sidebar">' +
      '<div class="as-brand">' +
      '<img src="../assets/logo/rec-logo.jpg" alt="REC logo"/>' +
      "<div><b>REC Admin</b><span>Dashboard</span></div>" +
      "</div>" +
      '<nav class="admin-nav" aria-label="Admin">' +
      '<span class="nav-label">Main</span>' +
      items.slice(0, 2).join("") +
      '<span class="nav-label">Catalogs</span>' +
      items.slice(2, 6).join("") +
      '<span class="nav-label">Content</span>' +
      items.slice(6).join("") +
      "</nav>" +
      '<div class="as-foot">' +
      '<div class="as-user">' +
      '<span class="avatar">' + initials + "</span>" +
      "<div><b>" + UI.esc(name) + "</b><small>Administrator</small></div>" +
      "</div>" +
      '<a href="#" class="admin-nav-a" data-logout style="display:flex;align-items:center;gap:.6rem;font-size:.86rem;font-weight:700;color:#d7e6da">' +
      '<svg aria-hidden="true" style="width:18px;height:18px"><use href="../assets/icons/sprite.svg#i-logout"></use></svg> Sign Out</a>' +
      "</div>" +
      "</aside>" +
      '<div class="admin-backdrop" id="admin-backdrop"></div>' +
      '<div class="admin-main" id="admin-main">' +
      '<div class="admin-topbar">' +
      '<button type="button" class="btn btn-outline mb-toggle" id="mb-toggle" aria-label="Open menu">' +
      '<svg aria-hidden="true" style="width:20px;height:20px"><use href="../assets/icons/sprite.svg#i-menu"></use></svg></button>' +
      "<h1 id=\"page-title\"></h1>" +
      '<a class="btn btn-sm btn-outline" href="../index.html" target="_blank">View Website</a>' +
      "</div>" +
      '<div id="admin-content"></div>' +
      "</div>";

    document.querySelector("[data-logout]").addEventListener("click", async (e) => {
      e.preventDefault();
      await REC.auth.signOut();
      location.href = "login.html";
    });

    const toggle = document.getElementById("mb-toggle");
    const sidebar = document.getElementById("admin-sidebar");
    const backdrop = document.getElementById("admin-backdrop");
    if (toggle) {
      toggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        if (backdrop) backdrop.classList.toggle("show", sidebar.classList.contains("open"));
      });
      backdrop.addEventListener("click", () => {
        sidebar.classList.remove("open");
        backdrop.classList.remove("show");
      });
    }
  };

  ADMIN.setState = function () {
    document.getElementById("page-title").textContent = document.title.replace("| REC Admin", "").trim();
  };

  ADMIN.setCount = function (key, n) {
    const el = document.getElementById("nav-count-" + key);
    if (el) {
      el.textContent = n;
      el.style.display = n > 0 ? "inline-block" : "none";
    }
  };

  ADMIN.skeleton = function (rows) {
    let tds = "";
    for (let i = 0; i < rows; i++) {
      tds +=
        "<tr>" +
        Array.from({ length: 5 }, () => '<td><div class="skeleton" style="height:16px"></div></td>').join("") +
        "</tr>";
    }
    return '<div class="table-wrap"><table class="data-table">' + tds + "</table></div>";
  };

  ADMIN.escapeXml = UI.esc;
  ADMIN.money = UI.money;
  ADMIN.date = UI.formatDate;
  ADMIN.toast = UI.toast;
  ADMIN.emptyState = UI.emptyState;
  ADMIN.icon = UI.icon;
  ADMIN.esc = UI.esc;

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("admin-shell");
    if (root) {
      ADMIN.guard().then((ok) => {
        if (!ok) return;
        const active = root.getAttribute("data-page") || "dashboard";
        ADMIN.render(active);
        if (win.AdminPage && win.AdminPage.init) win.AdminPage.init();
      });
    }
    const loginCard = document.getElementById("admin-login-card");
    if (loginCard && win.AdminLogin) win.AdminLogin.init();
  });
})(window);