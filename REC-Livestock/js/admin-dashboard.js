/* ============================================================
   REC — Admin Dashboard (real data from Supabase)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const ADMIN = (win.RECAdmin = win.RECAdmin || {});
  const sb = () => REC.supabaseClient;

  const AdminPage = {
    async init() {
      document.title = "Dashboard | REC Admin";
      ADMIN.setState();
      const content = document.getElementById("admin-content");
      if (!content) return;

      if (!sb()) {
        content.innerHTML = ADMIN.emptyState("No connection", "Connect Supabase to view your dashboard.");
        return;
      }

      content.innerHTML =
        '<div class="stat-grid" id="stat_grid">' +
        Array.from({ length: 6 }, () =>
          '<div class="stat-card"><div class="skeleton" style="height:14px;width:50%"></div><div class="skeleton" style="height:26px;width:60%;margin-top:8px"></div></div>'
        ).join("") +
        "</div>" +
        '<div class="chart-grid">' +
        '<div class="admin-panel"><div class="ap-head"><h3>Revenue (last 7 days)</h3></div><div class="ap-body chart-box" id="revenue_chart"><div class="skeleton" style="height:180px"></div></div></div>' +
        '<div class="admin-panel"><div class="ap-head"><h3>Order Status</h3></div><div class="ap-body chart-box" id="status_chart"><div class="skeleton" style="height:180px"></div></div></div>' +
        "</div>" +
        '<div class="chart-grid">' +
        '<div class="admin-panel"><div class="ap-head"><h3>Recent Orders</h3></div><div class="ap-body" id="recent_orders"><div class="skeleton" style="height:120px"></div></div></div>' +
        '<div class="admin-panel"><div class="ap-head"><h3>Top Products</h3></div><div class="ap-body" id="top_products"><div class="skeleton" style="height:120px"></div></div></div>' +
        "</div>";

      try {
        const [orders, products, customers, statusAgg] = await Promise.all([
          sb().from("orders").select("id,order_number,status,total,state,created_at,full_name").order("created_at", { ascending: false }).limit(200),
          sb().from("products").select("id,name,stock_quantity,price,category_id"),
          sb().from("customers").select("id").limit(1000),
          sb().from("orders").select("status"),
        ]);

        const ordersArr = orders.data || [];
        const productsArr = products.data || [];
        const customersCount = (customers.data || []).length;

        renderStats(ordersArr, productsArr, customersCount, statusAgg.data || []);
        renderRecent(ordersArr);
        renderTopProducts(productsArr);
        renderRevenue(ordersArr);
        renderStatus(statusAgg.data || []);
      } catch (err) {
        content.innerHTML = ADMIN.emptyState("Could not load dashboard", err.message || "Check your connection and retry.");
      }
    },

    renderStats(orders, products, customersCount) {
      const pending = orders.filter((o) => o.status === "pending").length;
      const completed = orders.filter((o) => o.status === "completed").length;
      const revenue = orders
        .filter((o) => o.status !== "cancelled")
        .reduce((s, o) => s + Number(o.total || 0), 0);
      const lowStock = products.filter((p) => Number(p.stock_quantity) <= 5).length;
      const cards = [
        { label: "Total Orders", value: orders.length },
        { label: "Pending Orders", value: pending },
        { label: "Completed Orders", value: completed },
        { label: "Total Customers", value: customersCount },
        { label: "Products", value: products.length },
        { label: "Low Stock Items", value: lowStock, warn: lowStock > 0 },
      ];
      const el = document.getElementById("stat_grid");
      el.innerHTML = cards
        .map(
          (c) =>
            '<div class="stat-card"><div class="sc-label">' + c.label + "</div>" +
            '<div class="sc-value">' + c.value + "</div>" +
            (c.label === "Low Stock Items"
              ? '<div class="sc-sub ' + (c.warn ? "down" : "up") + '">' + (c.warn ? "Review inventory" : "All healthy") + "</div>"
              : "") +
            "</div>"
        )
        .join("");
    },

    renderRecent(orders) {
      const host = document.getElementById("recent_orders");
      if (!orders.length) {
        host.innerHTML = ADMIN.emptyState("No orders yet", "Orders placed on the website will appear here.");
        return;
      }
      const statusLabels = {
        pending: ["badge-gold", "Pending"], confirmed: ["badge-green", "Confirmed"],
        processing: ["badge-gold", "Processing"], ready: ["badge-green", "Ready"],
        "out for delivery": ["badge-green", "Out for Delivery"],
        completed: ["badge-green", "Completed"], cancelled: ["badge-red", "Cancelled"],
      };
      host.innerHTML =
        '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        "<th>Reference</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody>" +
        orders
          .slice(0, 6)
          .map((o) => {
            const [cls, label] = statusLabels[o.status] || ["badge-gray", o.status || "Pending"];
            return (
              "<tr><td class=\"t-strong\">" + ADMIN.esc(o.order_number) + "</td><td>" + ADMIN.esc(o.full_name) + "</td>" +
              '<td>' + ADMIN.money(o.total) + "</td><td><span class=\"badge " + cls + "\">" + label + "</span></td>" +
              "<td>" + ADMIN.date(o.created_at) + "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>";
    },

    renderStatus(statuses) {
      const host = document.getElementById("status_chart");
      if (!host) return;
      const counts = {};
      statuses.forEach((o) => {
        counts[o.status || "pending"] = (counts[o.status || "pending"] || 0) + 1;
      });
      const order = ["pending", "confirmed", "processing", "ready", "out for delivery", "completed", "cancelled"];
      const labels = {
        pending: ["Pending", "#d9a441"], confirmed: ["Confirmed", "#2f9e4f"],
        processing: ["Processing", "#5bb98a"], ready: ["Ready", "#2e8b5c"],
        "out for delivery": ["Out for Delivery", "#1d5d3f"], completed: ["Completed", "#3E8137"], cancelled: ["Cancelled", "#c14b3a"],
      };
      const colors = [];
      const parts = [];
      let total = 0;
      order.forEach((k) => {
        const n = counts[k] || 0;
        if (n > 0 && labels[k]) {
          parts.push([k, n]);
          colors.push(labels[k][1]);
          total += n;
        }
      });
      if (!total) {
        host.innerHTML = ADMIN.emptyState("No status data", "Orders will drive this chart.");
        return;
      }
      const palette = ["#2f9e4f", "#d9a441", "#5bb98a", "#1d5d3f", "#3E8137", "#7fae55", "#c14b3a"];
      const deg = parts.length === 1 ? 360 : 359.9;
      let from = 0;
      const stops = parts
        .map((p, i) => {
          const c = palette[(colors.length > 1 ? i : 0) % palette.length];
          const pct = (p[1] / total) * deg;
          const seg = c + " " + from.toFixed(1) + "% " + (from + pct).toFixed(1) + "%";
          from += pct;
          return seg;
        })
        .join(", ");
      const legend = parts
        .map((p, i) => {
          const c = palette[(colors.length > 1 ? i : 0) % palette.length];
          return "<li><span class=\"dot\" style=\"background:" + c + "\"></span>" +
            (labels[p[0]] ? labels[p[0]][0] : p[0]) + " — " + p[1] + "</li>";
        })
        .join("");
      host.innerHTML =
        '<div class="donut">' +
        '<div class="donut-ring" style="background:conic-gradient(' + stops + ')">' +
        '<div class="ring-inner">' + total + "<br/>orders</div></div>" +
        '<ul class="donut-legend">' + legend + "</ul></div>";
    },

    renderRevenue(orders) {
      const host = document.getElementById("revenue_chart");
      if (!host) return;
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const key = d.toDateString();
        const label = d.toLocaleDateString("en-NG", { weekday: "short" });
        const sum = orders
          .filter((o) => o.status !== "cancelled" && new Date(o.created_at).toDateString() === key)
          .reduce((s, o) => s + Number(o.total || 0), 0);
        days.push({ label, sum });
      }
      const max = Math.max.apply(null, days.map((d) => d.sum)) || 1;
      host.innerHTML =
        '<div class="bars">' +
        days
          .map(
            (d) =>
              '<div class="bar-col"><div class="bar" style="height:' + (d.sum ? Math.max(4, (d.sum / max) * 100) : 2) + '%"></div>' +
              "<span>" + d.label + "</span></div>"
          )
          .join("") +
        "</div>" +
        '<p class="hint">Total revenue per day (last 7 days), excluding cancelled orders.</p>';
    },

    renderTopProducts(products) {
      const host = document.getElementById("top_products");
      const sorted = products.slice().sort((a, b) => Number(b.stock_quantity) - Number(a.stock_quantity)).slice(0, 5);
      const low = products.filter((p) => p.stock_quantity <= 5).length;
      host.innerHTML =
        '<div class="pd-meta-grid" style="grid-template-columns:1fr">' +
        sorted
          .map(
            (p) =>
              '<div class="pd-meta"><svg aria-hidden="true"><use href="../assets/icons/sprite.svg#i-box"></use></svg>' +
              "<div><strong>" + ADMIN.esc(p.name) + "</strong>" + p.stock_quantity + " in stock</div></div>"
          )
          .join("") +
        "</div>" +
        '<p class="admin-login-note" style="margin-top:1rem">' + low + " product" + (low === 1 ? "" : "s") + " at or below minimum stock.</p>";
    },
  };

  win.AdminPage = AdminPage;
})(window);