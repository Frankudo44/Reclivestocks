/* ============================================================
   REC — Admin Product Batches (CRUD)
   Schema: product_id, batch_number, breed, hatch_date,
           total_quantity, available_quantity, status
           (available | preorder | sold_out), notes
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const ADMIN = (win.RECAdmin = win.RECAdmin || {});
  const sb = () => REC.supabaseClient;

  const STATUSES = [
    { value: "available", label: "Available" },
    { value: "preorder", label: "Preorder" },
    { value: "sold_out", label: "Sold out" },
  ];

  const AdminPage = {
    state: { rows: [], products: [] },

    async init() {
      document.title = "Batches | REC Admin";
      ADMIN.setState();
      const content = document.getElementById("admin-content");
      if (!sb()) return (content.innerHTML = ADMIN.emptyState("No connection", "Connect Supabase first."));

      content.innerHTML =
        '<div class="admin-panel"><div class="ap-head"><div><h3>Product Batches</h3>' +
        '<span style="font-size:.8rem;color:var(--muted)">Track farm batches (flock / harvest lot) per product. Preorders and enquiry pages use these to confirm availability.</span></div>' +
        '<button class="btn btn-sm btn-primary" id="bt_add"><svg aria-hidden="true" style="width:16px;height:16px"><use href="../assets/icons/sprite.svg#i-plus"></use></svg> Add Batch</button></div>' +
        '<div class="ap-body" id="bt_list">' + ADMIN.skeleton(6) + "</div></div>";

      await this.loadProducts();
      await this.load();
      document.getElementById("bt_add").addEventListener("click", () => this.openForm());
      document.getElementById("bt_list").addEventListener("click", (e) => {
        const ed = e.target.closest("[data-edit]");
        if (ed) this.openForm(ed.getAttribute("data-edit"));
        const dl = e.target.closest("[data-del]");
        if (dl) this.remove(dl.getAttribute("data-del"));
      });
    },

    async loadProducts() {
      const { data, error } = await sb().from("products").select("id, name").order("name");
      if (error) return ADMIN.toast(error.message, "error");
      this.state.products = data || [];
    },

    async load() {
      const { data, error } = await sb()
        .from("product_batches")
        .select("*, products(name)")
        .order("created_at", { ascending: false });
      if (error) return ADMIN.toast(error.message, "error");
      this.state.rows = (data || []).map((r) => ({ ...r, product_name: r.products ? r.products.name : "" }));
      ADMIN.setCount("batches", this.state.rows.length);
      this.render();
    },

    render() {
      const host = document.getElementById("bt_list");
      if (!this.state.rows.length) {
        host.innerHTML = ADMIN.emptyState("No batches yet", "Add farm batches to track stock per lot.");
        return;
      }
      const fmt = (v) => (v ? String(v).slice(0, 10) : "—");
      host.innerHTML =
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Batch</th><th>Product</th><th>Breed</th><th>Hatch date</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>' +
        this.state.rows
          .map(
            (r) =>
              "<tr>" +
              '<td><div class="t-prod"><div><span class="t-strong">' + ADMIN.esc(r.batch_number || "—") + "</span><br/>" +
              '<span style="font-size:.78rem;color:var(--muted)">' + ADMIN.esc(r.notes || "") + "</span></div></div></td>" +
              "<td>" + ADMIN.esc(r.product_name || "—") + "</td>" +
              "<td>" + ADMIN.esc(r.breed || "—") + "</td>" +
              "<td>" + fmt(r.hatch_date) + "</td>" +
              '<td><span class="t-strong">' + Number(r.available_quantity || 0) + "</span> / " + Number(r.total_quantity || 0) + "</td>" +
              '<td><span class="badge ' + (r.status === "available" ? "badge-green" : r.status === "preorder" ? "badge-gold" : "badge-gray") + '">' + (r.status || "available") + "</span></td>" +
              '<td><div class="t-actions">' +
              '<button class="t-btn" data-edit="' + r.id + '" title="Edit"><svg><use href="../assets/icons/sprite.svg#i-edit"></use></svg></button>' +
              '<button class="t-btn danger" data-del="' + r.id + '" title="Delete"><svg><use href="../assets/icons/sprite.svg#i-trash"></use></svg></button>' +
              "</div></td></tr>"
          )
          .join("") +
        "</tbody></table></div>";
    },

    openForm(id) {
      this.state.editId = id || null;
      const r = id ? this.state.rows.find((x) => x.id === id) : null;
      const prodOpts =
        '<option value="">Select product</option>' +
        this.state.products
          .map((p) => '<option value="' + p.id + '"' + (r && String(r.product_id) === String(p.id) ? " selected" : "") + ">" + ADMIN.esc(p.name) + "</option>")
          .join("");
      const statusOpts =
        '<option value="">Select status</option>' +
        STATUSES.map(
          (s) => '<option value="' + s.value + '"' + (r && r.status === s.value ? " selected" : "") + ">" + s.label + "</option>"
        ).join("");
      let modal = document.getElementById("bt_modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.className = "modal-root";
        modal.id = "bt_modal";
        document.body.appendChild(modal);
      }
      modal.innerHTML =
        '<div class="modal-backdrop" data-close></div>' +
        '<div class="modal-card" role="dialog" aria-modal="true">' +
        '<button class="modal-close" data-close aria-label="Close"><svg><use href="../assets/icons/sprite.svg#i-close"></use></svg></button>' +
        "<h3>" + (r ? "Edit Batch" : "Add Batch") + "</h3>" +
        '<div class="admin-grid-2">' +
        '<div class="field"><label for="btf_product">Product *</label><select class="select" id="btf_product">' + prodOpts + "</select></div>" +
        '<div class="field"><label for="btf_number">Batch number</label><input class="input" id="btf_number" value="' + ADMIN.esc(r ? r.batch_number || "" : "") + '" placeholder="e.g. BT-2026-001"/></div>' +
        '<div class="field"><label for="btf_breed">Breed</label><input class="input" id="btf_breed" value="' + ADMIN.esc(r ? r.breed || "" : "") + '" placeholder="e.g. ISA Brown"/></div>' +
        '<div class="field"><label for="btf_date">Hatch date</label><input class="input" id="btf_date" type="date" value="' + ADMIN.esc(r ? String(r.hatch_date || "").slice(0, 10) : "") + '"/></div>' +
        '<div class="field"><label for="btf_total">Total quantity *</label><input class="input" id="btf_total" type="number" min="0" value="' + (r ? r.total_quantity : "") + '"/></div>' +
        '<div class="field"><label for="btf_avail">Available quantity</label><input class="input" id="btf_avail" type="number" min="0" value="' + (r ? r.available_quantity : "") + '"/></div>' +
        '<div class="field"><label for="btf_status">Status *</label><select class="select" id="btf_status">' + statusOpts + "</select></div>" +
        "</div>" +
        '<div class="field"><label for="btf_notes">Notes</label><input class="input" id="btf_notes" value="' + ADMIN.esc(r ? r.notes || "" : "") + '" placeholder="e.g. Vaccinated, expected harvest August"/></div>' +
        '<div class="form-actions"><button class="btn btn-primary" id="btf_save">Save Batch</button><button class="btn btn-outline" data-close>Cancel</button></div></div>';
      modal.classList.add("open");
      modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => modal.classList.remove("open")));
      document.getElementById("btf_save").addEventListener("click", () => this.save());
    },

    async save() {
      const get = (id) => document.getElementById(id);
      const product_id = get("btf_product").value;
      const status = get("btf_status").value;
      const total = Number(get("btf_total").value || 0);
      const availInput = get("btf_avail").value;
      const available = availInput === "" ? total : Number(availInput);
      if (!product_id || !status) return ADMIN.toast("Product and status are required", "error");
      if (available > total) return ADMIN.toast("Available quantity cannot exceed total", "error");
      const payload = {
        product_id,
        batch_number: get("btf_number").value.trim() || null,
        breed: get("btf_breed").value.trim() || null,
        hatch_date: get("btf_date").value || null,
        total_quantity: total,
        available_quantity: available,
        status,
        notes: get("btf_notes").value.trim() || null,
      };
      try {
        if (this.state.editId) {
          const { error } = await sb().from("product_batches").update(payload).eq("id", this.state.editId);
          if (error) throw error;
          ADMIN.toast("Batch updated", "success");
        } else {
          const { error } = await sb().from("product_batches").insert(payload);
          if (error) throw error;
          ADMIN.toast("Batch created", "success");
        }
        document.getElementById("bt_modal").classList.remove("open");
        await this.load();
      } catch (e) {
        ADMIN.toast(e.message || "Save failed", "error");
      }
    },

    async remove(id) {
      const r = this.state.rows.find((x) => x.id === id);
      if (!confirm('Delete batch "' + (r ? r.batch_number || r.id : id) + '"?')) return;
      try {
        const { error } = await sb().from("product_batches").delete().eq("id", id);
        if (error) throw error;
        ADMIN.toast("Batch deleted", "success");
        await this.load();
      } catch (e) {
        ADMIN.toast(e.message || "Delete failed", "error");
      }
    },
  };

  win.AdminPage = AdminPage;
})(window);