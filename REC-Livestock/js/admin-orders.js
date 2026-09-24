/* ============================================================
   REC — Admin Orders (list, status update, details)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const ADMIN = (win.RECAdmin = win.RECAdmin || {});
  const sb = () => REC.supabaseClient;

  const STATUS = [
    ["pending", "Pending"],
    ["confirmed", "Confirmed"],
    ["processing", "Processing"],
    ["ready", "Ready"],
    ["out for delivery", "Out for Delivery"],
    ["completed", "Completed"],
    ["cancelled", "Cancelled"],
  ];
  const BADGE = {
    pending: "badge-gold", confirmed: "badge-green", processing: "badge-gold",
    ready: "badge-green", "out for delivery": "badge-green",
    completed: "badge-green", cancelled: "badge-red",
  };

  const AdminPage = {
    state: { orders: [], filter: "all", search: "" },

    async init() {
      document.title = "Orders | REC Admin";
      ADMIN.setState();
      const content = document.getElementById("admin-content");
      if (!sb()) return (content.innerHTML = ADMIN.emptyState("No connection", "Connect Supabase first."));

      content.innerHTML =
        '<div class="admin-panel"><div class="ap-head"><div><h3>Orders</h3>' +
        '<span style="font-size:.8rem;color:var(--muted)">Update fulfilment status to keep customers informed.</span></div>' +
        '<div style="display:flex;gap:.6rem;flex-wrap:wrap">' +
        '<select class="select" id="o_filter" style="max-width:180px"></select>' +
        '<input class="input" id="o_search" type="search" placeholder="Reference / name..." style="max-width:220px;padding:.55rem .8rem"/>' +
        "</div></div>" +
        '<div class="ap-body" id="o_list">' + ADMIN.skeleton(6) + "</div></div>";

      const sel = document.getElementById("o_filter");
      sel.innerHTML = '<option value="all">All statuses</option>' + STATUS.map(([k, v]) => '<option value="' + k + '">' + v + "</option>").join("");

      await this.load();
      sel.addEventListener("change", () => { this.state.filter = sel.value; this.render(); });
      document.getElementById("o_search").addEventListener("input", (e) => { this.state.search = e.target.value; this.render(); });
      document.getElementById("o_list").addEventListener("change", (e) => this.onStatus(e));
      document.getElementById("o_list").addEventListener("click", (e) => this.onDetail(e));
    },

    async load() {
      const { data, error } = await sb()
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) return ADMIN.toast(error.message, "error");
      this.state.orders = data || [];
      ADMIN.setCount(
        "orders",
        this.state.orders.filter((o) => o.status === "pending").length
      );
      this.render();
    },

    render() {
      const host = document.getElementById("o_list");
      let list = this.state.orders;
      if (this.state.filter !== "all") list = list.filter((o) => o.status === this.state.filter);
      const s = this.state.search.trim().toLowerCase();
      if (s) list = list.filter((o) => (o.order_number || "").toLowerCase().includes(s) || (o.full_name || "").toLowerCase().includes(s) || (o.phone || "").toLowerCase().includes(s));

      if (!list.length) {
        host.innerHTML = ADMIN.emptyState("No orders", "Orders placed on the checkout page appear here.");
        return;
      }
      const optAll = STATUS.map(([k, v]) => '<option value="' + k + '">' + v + "</option>").join("");
      host.innerHTML =
        '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        "<th>Reference</th><th>Customer</th><th>Items</th><th>Total</th><th>Date</th><th>Status</th>" +
        "</tr></thead><tbody>" +
        list
          .map(
            (o) => {
              const items = o.items ? (Array.isArray(o.items) ? o.items.length : 0) : 0;
              return (
                "<tr>" +
                '<td class="t-strong"><button class="t-link" data-id="' + o.id + '">' + ADMIN.esc(o.order_number) + "</button></td>" +
                "<td>" + ADMIN.esc(o.full_name) + '<br/><span style="font-size:.78rem;color:var(--muted)">' + ADMIN.esc(o.phone || "") + "</span></td>" +
                "<td>" + items + "</td>" +
                '<td class="t-strong">' + ADMIN.money(o.total) + "</td>" +
                "<td>" + ADMIN.date(o.created_at) + "</td>" +
                '<td><select class="select o-status" style="padding:.35rem .5rem;font-size:.8rem" data-id="' + o.id + '">' +
                optAll.replace('<option value="' + ADMIN.esc(o.status) + '">', '<option value="' + ADMIN.esc(o.status) + '" selected>') +
                "</select></td>" +
                "</tr>"
              );
            }
          )
          .join("") +
        "</tbody></table></div>";
    },

    async onStatus(e) {
      const sel = e.target.closest(".o-status");
      if (!sel) return;
      const id = sel.getAttribute("data-id");
      const prev = this.state.orders.find((o) => o.id === id);
      const next = sel.value;
      if (!prev || prev.status === next) return;
      try {
        const { error } = await sb().from("orders").update({ status: next }).eq("id", id);
        if (error) throw error;
        prev.status = next;
        ADMIN.toast("Order marked " + next.replace(/\b\w/g, (c) => c.toUpperCase()), "success");
      } catch (err) {
        sel.value = prev.status;
        ADMIN.toast(err.message || "Update failed", "error");
      }
    },

    onDetail(e) {
      const btn = e.target.closest(".t-link");
      if (!btn) return;
      const order = this.state.orders.find((o) => o.id === btn.getAttribute("data-id"));
      if (!order) return;

      const items = order.items || [];
      let modal = document.getElementById("o_modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.className = "modal-root";
        modal.id = "o_modal";
        document.body.appendChild(modal);
      }
      const isPickup = order.fulfillment_method === "pickup";
      const meta = [
        ["Customer", order.full_name],
        ["Phone", order.phone],
        ["Email", order.email],
        ["Fulfillment", isPickup ? "Pickup at a station" : "Delivery"],
      ];
      if (isPickup) {
        meta.push(
          ["Pickup station", order.pickup_station_name || "—"],
          ["Station address", order.pickup_station_address || "—"]
        );
      } else {
        meta.push(
          ["Delivery address", order.delivery_address || "—"],
          ["State / LGA", [order.state, order.lga].filter(Boolean).join(", ")]
        );
      }
      meta.push(["Payment", order.payment_status || "unpaid"], ["Notes", order.notes || "—"]);
      const [cls, label] = [BADGE[order.status] || "badge-gray", order.status || "Pending"];
      modal.innerHTML =
        '<div class="modal-backdrop" data-close></div>' +
        '<div class="modal-card" role="dialog" aria-modal="true">' +
        '<button class="modal-close" data-close aria-label="Close"><svg><use href="../assets/icons/sprite.svg#i-close"></use></svg></button>' +
        "<h3>Order " + ADMIN.esc(order.order_number) + '</h3>' +
        '<span class="badge ' + cls + '">' + label + "</span>" +
        '<div class="modal-sec">' +
        meta.map(([k, v]) => "<p><strong>" + k + ":</strong> " + ADMIN.esc(v || "—") + "</p>").join("") +
        "</div>" +
        '<div class="modal-sec"><h4>Items</h4>' +
        "<div class=\"table-wrap\"><table class=\"data-table\"><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead><tbody>" +
        items
          .map(
            (i) =>
              "<tr><td>" + ADMIN.esc(i.name) + "</td><td>" + i.quantity + "</td><td>" + ADMIN.money(i.price) + "</td><td>" + ADMIN.money(i.price * i.quantity) + "</td></tr>"
          )
          .join("") +
        "</tbody></table></div>" +
        '<p style="margin-top:.8rem;font-weight:800">Subtotal: ' + ADMIN.money(order.subtotal) + "<br/>Delivery: " + ADMIN.money(order.delivery_fee) + '</p>' +
        '<p class="t-strong" style="font-size:1.1rem">Total: ' + ADMIN.money(order.total) + "</p></div>" +
        '<button class="btn btn-outline btn-block" data-close>Close</button></div>';
      modal.classList.add("open");
      modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => modal.classList.remove("open")));
    },
  };

  win.AdminPage = AdminPage;
})(window);