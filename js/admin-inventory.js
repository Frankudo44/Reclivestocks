/* ============================================================
   REC — Admin Inventory (stock levels + adjustments)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const ADMIN = (win.RECAdmin = win.RECAdmin || {});
  const sb = () => REC.supabaseClient;

  const AdminPage = {
    state: { rows: [], filter: "all", search: "" },

    async init() {
      document.title = "Inventory | REC Admin";
      ADMIN.setState();
      const content = document.getElementById("admin-content");
      if (!sb()) return (content.innerHTML = ADMIN.emptyState("No connection", "Connect Supabase first."));

      content.innerHTML =
        '<div class="admin-panel"><div class="ap-head"><div><h3>Inventory</h3>' +
        '<span style="font-size:.8rem;color:var(--muted)">Track stock levels. Low stock highlights items needing attention.</span></div>' +
        '<div style="display:flex;gap:.6rem;flex-wrap:wrap">' +
        '<select class="select" id="inv_filter" style="max-width:180px">' +
        '<option value="all">All items</option><option value="low">Low stock only</option><option value="out">Out of stock</option></select>' +
        '<input class="input" id="inv_search" type="search" placeholder="Search..." style="max-width:200px;padding:.55rem .8rem"/>' +
        "</div></div>" +
        '<div class="ap-body" id="inv_list">' + ADMIN.skeleton(6) + "</div></div>";

      await this.load();
      document.getElementById("inv_filter").addEventListener("change", (e) => { this.state.filter = e.target.value; this.render(); });
      document.getElementById("inv_search").addEventListener("input", (e) => { this.state.search = e.target.value; this.render(); });
      document.getElementById("inv_list").addEventListener("input", (e) => this.onQty(e));
    },

    async load() {
      const { data, error } = await sb().from("products").select("id,name,stock_quantity,price,unit,active").order("name");
      if (error) return ADMIN.toast(error.message, "error");
      this.state.rows = data || [];
      this.render();
    },

    render() {
      const host = document.getElementById("inv_list");
      let list = this.state.rows;
      if (this.state.filter === "low") list = list.filter((r) => r.stock_quantity <= 5 && r.stock_quantity > 0);
      if (this.state.filter === "out") list = list.filter((r) => r.stock_quantity <= 0);
      const s = this.state.search.trim().toLowerCase();
      if (s) list = list.filter((r) => r.name.toLowerCase().includes(s));

      if (!list.length) {
        host.innerHTML = ADMIN.emptyState("No items found", "Adjust the filter or search.");
        return;
      }
      host.innerHTML =
        '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        "<th>Product</th><th>Unit</th><th>In Stock</th><th>Status</th><th>Adjustment</th>" +
        "</tr></thead><tbody>" +
        list
          .map((r) => {
            const st = r.stock_quantity <= 0 ? ['badge-red', "Out of stock"] : r.stock_quantity <= 5 ? ['badge-gold', "Low stock"] : ['badge-green', "In stock"];
            return (
              "<tr>" +
              '<td class="t-strong">' + ADMIN.esc(r.name) + "</td>" +
              "<td>" + ADMIN.esc(r.unit || "each") + "</td>" +
              '<td class="t-strong">' + r.stock_quantity + "</td>" +
              '<td><span class="badge ' + st[0] + '">' + st[1] + "</span></td>" +
              "<td><div style=\"display:flex;gap:.3rem;align-items:center\">" +
              '<input class="input" id="inv_qty_' + r.id + '" type="number" value="' + r.stock_quantity + '" style="width:70px;padding:.4rem .5rem"/>' +
              '<button class="btn btn-sm btn-primary" data-save="' + r.id + '">Save</button>' +
              "</div></td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>";
    },

    async onQty(e) {
      const btn = e.target.closest("[data-save]");
      if (!btn) return;
      const id = btn.getAttribute("data-save");
      const qty = Number(document.getElementById("inv_qty_" + id).value);
      if (isNaN(qty) || qty < 0) return ADMIN.toast("Enter a valid quantity", "error");
      try {
        const { error } = await sb().from("products").update({ stock_quantity: qty }).eq("id", id);
        if (error) throw error;
        ADMIN.toast("Stock updated", "success");
        await this.load();
      } catch (err) {
        ADMIN.toast(err.message || "Update failed", "error");
      }
    },
  };

  win.AdminPage = AdminPage;
})(window);