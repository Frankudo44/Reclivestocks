/* ============================================================
   REC — Admin Pickup Stations (CRUD)
   Schema: name, state, city, address, contact_phone,
           operating_hours, notes, active, sort_order
   Shown to customers at checkout and on the order confirmation.
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const ADMIN = (win.RECAdmin = win.RECAdmin || {});
  const sb = () => REC.supabaseClient;

  const AdminPage = {
    state: { rows: [] },

    async init() {
      document.title = "Pickup Stations | REC Admin";
      ADMIN.setState();
      const content = document.getElementById("admin-content");
      if (!sb()) return (content.innerHTML = ADMIN.emptyState("No connection", "Connect Supabase first."));

      content.innerHTML =
        '<div class="admin-panel"><div class="ap-head"><div><h3>Pickup Stations</h3>' +
        '<span style="font-size:.8rem;color:var(--muted)">Customers can choose one of these at checkout instead of delivery. Active stations show on the website; inactive ones are hidden.</span></div>' +
        '<button class="btn btn-sm btn-primary" id="ps_add"><svg aria-hidden="true" style="width:16px;height:16px"><use href="../assets/icons/sprite.svg#i-plus"></use></svg> Add Station</button></div>' +
        '<div class="ap-body" id="ps_list">' + ADMIN.skeleton(6) + "</div></div>";

      await this.load();
      document.getElementById("ps_add").addEventListener("click", () => this.openForm());
      document.getElementById("ps_list").addEventListener("click", (e) => {
        const ed = e.target.closest("[data-edit]");
        if (ed) this.openForm(ed.getAttribute("data-edit"));
        const dl = e.target.closest("[data-del]");
        if (dl) this.remove(dl.getAttribute("data-del"));
      });
    },

    async load() {
      const { data, error } = await sb().from("pickup_stations").select("*").order("sort_order").order("name");
      if (error) return ADMIN.toast(error.message, "error");
      this.state.rows = data || [];
      ADMIN.setCount("pickups", this.state.rows.length);
      this.render();
    },

    render() {
      const host = document.getElementById("ps_list");
      if (!this.state.rows.length) {
        host.innerHTML = ADMIN.emptyState("No pickup stations yet", "Add stations so customers can pick up their orders near them.");
        return;
      }
      host.innerHTML =
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Station</th><th>State</th><th>Address</th><th>Status</th><th></th></tr></thead><tbody>' +
        this.state.rows
          .map(
            (r) =>
              "<tr>" +
              '<td><div class="t-prod"><div><span class="t-strong">' + ADMIN.esc(r.name) + "</span><br/>" +
              '<span style="font-size:.78rem;color:var(--muted)">' + ADMIN.esc([r.city, r.operating_hours].filter(Boolean).join(" · ") || "") + "</span></div></div></td>" +
              "<td>" + ADMIN.esc(r.state) + "</td>" +
              '<td style="max-width:280px">' + ADMIN.esc(r.address) + "</td>" +
              '<td><span class="badge ' + (r.active ? "badge-green" : "badge-gray") + '">' + (r.active ? "Active" : "Hidden") + "</span></td>" +
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
      let modal = document.getElementById("ps_modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.className = "modal-root";
        modal.id = "ps_modal";
        document.body.appendChild(modal);
      }
      const stateOpts =
        '<option value="">Select state</option>' +
        REC.products.STATES.map(
          (s) => '<option value="' + s + '"' + (r && r.state === s ? " selected" : "") + ">" + s + "</option>"
        ).join("");
      modal.innerHTML =
        '<div class="modal-backdrop" data-close></div>' +
        '<div class="modal-card" role="dialog" aria-modal="true">' +
        '<button class="modal-close" data-close aria-label="Close"><svg><use href="../assets/icons/sprite.svg#i-close"></use></svg></button>' +
        "<h3>" + (r ? "Edit Station" : "Add Station") + "</h3>" +
        '<div class="admin-grid-2">' +
        '<div class="field"><label for="psf_name">Station name *</label><input class="input" id="psf_name" value="' + ADMIN.esc(r ? r.name : "") + '" placeholder="e.g. Umuahia Head Office"/></div>' +
        '<div class="field"><label for="psf_city">City / Area</label><input class="input" id="psf_city" value="' + ADMIN.esc(r ? r.city || "" : "") + '" placeholder="e.g. Umuahia"/></div>' +
        '<div class="field"><label for="psf_state">State *</label><select class="select" id="psf_state">' + stateOpts + "</select></div>" +
        '<div class="field"><label for="psf_phone">Contact phone</label><input class="input" id="psf_phone" value="' + ADMIN.esc(r ? r.contact_phone || "" : "") + '" placeholder="e.g. +2348135042997"/></div>' +
        "</div>" +
        '<div class="field"><label for="psf_address">Address / pickup point *</label><textarea class="textarea" id="psf_address" rows="2">' + ADMIN.esc(r ? r.address || "" : "") + '</textarea></div>' +
        '<div class="admin-grid-2">' +
        '<div class="field"><label for="psf_hours">Operating hours</label><input class="input" id="psf_hours" value="' + ADMIN.esc(r ? r.operating_hours || "" : "") + '" placeholder="e.g. Mon–Sat, 8am – 6pm"/></div>' +
        '<div class="field"><label for="psf_fee">Pickup fee (₦) *</label><input class="input" id="psf_fee" type="number" min="0" step="0.01" value="' + (r ? r.pickup_fee : 0) + '"/></div>' +
        '<div class="field"><label for="psf_sort">Sort order</label><input class="input" id="psf_sort" type="number" min="0" value="' + (r ? r.sort_order : 0) + '"/></div>' +
        "</div>" +
        '<div class="field"><label for="psf_notes">Notes for customers</label><input class="input" id="psf_notes" value="' + ADMIN.esc(r ? r.notes || "" : "") + '" placeholder="e.g. Call ahead to confirm your order is ready"/></div>' +
        '<div class="switch-row"><div><div class="sr-label">Active</div><div class="sr-hint">Show this station on the website</div></div>' +
        '<label class="switch"><input type="checkbox" id="psf_active"' + (!r || r.active ? " checked" : "") + '><span class="slider"></span></label></div>' +
        '<div class="form-actions"><button class="btn btn-primary" id="psf_save">Save</button><button class="btn btn-outline" data-close>Cancel</button></div></div>';
      modal.classList.add("open");
      modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => modal.classList.remove("open")));
      document.getElementById("psf_save").addEventListener("click", () => this.save());
    },

    async save() {
      const name = document.getElementById("psf_name").value.trim();
      const state = document.getElementById("psf_state").value.trim();
      const address = document.getElementById("psf_address").value.trim();
      if (!name || !state || !address) return ADMIN.toast("Name, state and address are required", "error");
      const payload = {
        name,
        state,
        address,
        city: document.getElementById("psf_city").value.trim() || null,
        contact_phone: document.getElementById("psf_phone").value.trim() || null,
        operating_hours: document.getElementById("psf_hours").value.trim() || null,
        notes: document.getElementById("psf_notes").value.trim() || null,
        sort_order: Number(document.getElementById("psf_sort").value || 0),
        active: document.getElementById("psf_active").checked,
      };
      try {
        if (this.state.editId) {
          const { error } = await sb().from("pickup_stations").update(payload).eq("id", this.state.editId);
          if (error) throw error;
          ADMIN.toast("Station updated", "success");
        } else {
          const { error } = await sb().from("pickup_stations").insert(payload);
          if (error) throw error;
          ADMIN.toast("Station created", "success");
        }
        document.getElementById("ps_modal").classList.remove("open");
        await this.load();
      } catch (e) {
        ADMIN.toast(e.message || "Save failed", "error");
      }
    },

    async remove(id) {
      const r = this.state.rows.find((x) => x.id === id);
      if (!confirm('Delete pickup station "' + r.name + '"?')) return;
      try {
        const { error } = await sb().from("pickup_stations").delete().eq("id", id);
        if (error) throw error;
        ADMIN.toast("Station deleted", "success");
        await this.load();
      } catch (e) {
        ADMIN.toast(e.message || "Delete failed", "error");
      }
    },
  };

  win.AdminPage = AdminPage;
})(window);