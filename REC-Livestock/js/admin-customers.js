/* ============================================================
   REC — Admin Customers (list from orders + profiles)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const ADMIN = (win.RECAdmin = win.RECAdmin || {});
  const sb = () => REC.supabaseClient;

  const AdminPage = {
    state: { customers: [] },

    async init() {
      document.title = "Customers | REC Admin";
      ADMIN.setState();
      const content = document.getElementById("admin-content");
      if (!sb()) return (content.innerHTML = ADMIN.emptyState("No connection", "Connect Supabase first."));

      content.innerHTML =
        '<div class="admin-panel"><div class="ap-head"><div><h3>Customers</h3>' +
        '<span style="font-size:.8rem;color:var(--muted)">Everyone who has placed an order or created an account.</span></div>' +
        '<input class="input" id="cu_search" type="search" placeholder="Search..." style="max-width:220px;padding:.55rem .8rem"/></div>' +
        '<div class="ap-body" id="cu_list">' + ADMIN.skeleton(5) + "</div></div>";

      await this.load();
      document.getElementById("cu_search").addEventListener("input", (e) => this.render(e.target.value));
    },

    async load() {
      const [ordersR, profilesR] = await Promise.all([
        sb().from("orders").select("full_name,email,phone,delivery_address,lga,state,id,order_number,created_at,total,status"),
        sb().from("profiles").select("email,full_name,role,created_at"),
      ]);
      const map = {};
      (ordersR.data || []).forEach((o) => {
        const key = (o.email || "").toLowerCase();
        if (!key) return;
        if (!map[key]) {
          map[key] = { name: o.full_name || "", email: o.email || "", phone: o.phone || "", delivery_address: o.delivery_address || "", lga: o.lga || "", state: o.state || "", orders: 0, spent: 0, first: o.created_at };
        }
        map[key].orders += 1;
        if (o.status !== "cancelled") map[key].spent += Number(o.total || 0);
      });
      (profilesR.data || []).forEach((p) => {
        const key = (p.email || "").toLowerCase();
        if (!key) return;
        if (!map[key]) map[key] = { name: p.full_name || "", email: p.email || "", phone: "", delivery_address: "", lga: "", state: "", orders: 0, spent: 0, first: p.created_at, role: "customer" };
        else map[key].role = map[key].role || "customer";
      });
      this.state.customers = Object.values(map);
      ADMIN.setCount("customers", this.state.customers.length);
      this.render();
    },

    render(search) {
      const host = document.getElementById("cu_list");
      let list = this.state.customers;
      const s = (search || "").trim().toLowerCase();
      if (s) list = list.filter((c) => (c.name + "").toLowerCase().includes(s) || (c.email + "").toLowerCase().includes(s) || (c.phone + "").toLowerCase().includes(s));
      if (!list.length) {
        host.innerHTML = ADMIN.emptyState("No customers yet", "Customer details will appear after their first order or signup.");
        return;
      }
      host.innerHTML =
        '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        "<th>Customer</th><th>Location</th><th>Orders</th><th>Spent</th><th>First seen</th>" +
        "</tr></thead><tbody>" +
        list
          .slice()
          .sort((a, b) => b.spent - a.spent)
          .map(
            (c) =>
              "<tr>" +
              '<td class="t-strong">' + ADMIN.esc(c.name || "—") + '<br/><span style="font-size:.78rem;color:var(--muted)">' + ADMIN.esc(c.email) + (c.phone ? " · " + ADMIN.esc(c.phone) : "") + "</span></td>" +
              "<td>" + ADMIN.esc([c.delivery_address, c.lga, c.state].filter(Boolean).join(", ") || "—") + "</td>" +
              "<td>" + c.orders + "</td>" +
              '<td class="t-strong">' + ADMIN.money(c.spent) + "</td>" +
              "<td>" + (c.first ? ADMIN.date(c.first) : "—") + "</td>" +
              "</tr>"
          )
          .join("") +
        "</tbody></table></div>";
    },
  };

  win.AdminPage = AdminPage;
})(window);