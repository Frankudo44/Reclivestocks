/* ============================================================
   REC — Admin Delivery Zones (CRUD)
   Schema: state, lga, delivery_fee, estimated_days, active,
           special_notes  (one row per state → unique index)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const ADMIN = (win.RECAdmin = win.RECAdmin || {});
  const sb = () => REC.supabaseClient;

  const AdminPage = {
    state: { rows: [] },

    async init() {
      document.title = "Delivery | REC Admin";
      ADMIN.setState();
      const content = document.getElementById("admin-content");
      if (!sb()) return (content.innerHTML = ADMIN.emptyState("No connection", "Connect Supabase first."));

      content.innerHTML =
        '<div class="admin-panel"><div class="ap-head"><div><h3>Delivery Zones</h3>' +
        '<span style="font-size:.8rem;color:var(--muted)">Delivery fees are charged per state at checkout. Untracked states default to pickup/info after confirmation.</span></div>' +
        '<button class="btn btn-sm btn-primary" id="d_add"><svg aria-hidden="true" style="width:16px;height:16px"><use href="../assets/icons/sprite.svg#i-plus"></use></svg> Add Zone</button></div>' +
        '<div class="ap-body" id="d_list">' + ADMIN.skeleton(6) + "</div></div>";

      await this.load();
      document.getElementById("d_add").addEventListener("click", () => this.openForm());
      document.getElementById("d_list").addEventListener("click", (e) => {
        const ed = e.target.closest("[data-edit]");
        if (ed) this.openForm(ed.getAttribute("data-edit"));
        const dl = e.target.closest("[data-del]");
        if (dl) this.remove(dl.getAttribute("data-del"));
      });
    },

    async load() {
      const { data, error } = await sb().from("delivery_zones").select("*").order("state");
      if (error) return ADMIN.toast(error.message, "error");
      this.state.rows = data || [];
      ADMIN.setCount("delivery", Math.ceil(this.state.rows.length / 2));
      this.render();
    },

    render() {
      const host = document.getElementById("d_list");
      if (!this.state.rows.length) {
        host.innerHTML = ADMIN.emptyState("No zones yet", "Add states so customers see delivery fees at checkout.");
        return;
      }
      host.innerHTML =
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>State</th><th>LGA</th><th>Fee</th><th>ETA (days)</th><th>Active</th><th></th></tr></thead><tbody>' +
        this.state.rows
          .map(
            (r) =>
              "<tr>" +
              '<td class="t-strong">' + ADMIN.esc(r.state) + "</td>" +
              "<td>" + ADMIN.esc(r.lga || "All") + "</td>" +
              "<td>" + ADMIN.money(r.delivery_fee) + "</td>" +
              "<td>" + (r.estimated_days != null ? r.estimated_days : "—") + "</td>" +
              '<td><span class="badge ' + (r.active ? "badge-green" : "badge-gray") + '">' + (r.active ? "Active" : "Inactive") + "</span></td>" +
              '<td><div class="t-actions">' +
              '<button class="t-btn" data-edit="' + r.id + '" title="Edit"><svg><use href="../assets/icons/sprite.svg#i-edit"></use></svg></button>' +
              '<button class="t-btn danger" data-del="' + r.id + '" title="Delete"><svg><use href="../assets/icons/sprite.svg#i-trash"></use></svg></button>' +
              "</div></td></tr>"
          )
          .join("") +
        "</tbody></table></div>";
    },

    openForm(id) {
      const r = id ? this.state.rows.find((x) => x.id === id) : null;
      let modal = document.getElementById("d_modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.className = "modal-root";
        modal.id = "d_modal";
        document.body.appendChild(modal);
      }
      const stateOpts =
        '<option value="">All of Nigeria</option>' +
        REC.products.STATES.map(
          (s) => '<option value="' + s + '"' + (r && r.state === s ? " selected" : "") + ">" + s + "</option>"
        ).join("");
      modal.innerHTML =
        '<div class="modal-backdrop" data-close></div>' +
        '<div class="modal-card" role="dialog" aria-modal="true">' +
        '<button class="modal-close" data-close aria-label="Close"><svg><use href="../assets/icons/sprite.svg#i-close"></use></svg></button>' +
        "<h3>" + (r ? "Edit Zone" : "Add Zone") + "</h3>" +
        '<div class="admin-grid-2">' +
        '<div class="field"><label for="df_state">State *</label><select class="select" id="df_state">' + stateOpts + "</select></div>" +
        '<div class="field"><label for="df_lga">LGA (optional)</label><input class="input" id="df_lga" value="' + ADMIN.esc(r ? r.lga || "" : "") + '" placeholder="All"/></div>' +
        '<div class="field"><label for="df_fee">Delivery fee (₦) *</label><input class="input" id="df_fee" type="number" min="0" value="' + (r ? r.delivery_fee : "") + '"/></div>' +
        '<div class="field"><label for="df_days">Estimated days</label><input class="input" id="df_days" type="number" min="0" value="' + (r && r.estimated_days != null ? r.estimated_days : "") + '" placeholder="e.g. 1"/></div>' +
        "</div>" +
        '<div class="field"><label for="df_notes">Special notes</label><input class="input" id="df_notes" value="' + ADMIN.esc(r ? r.special_notes || "" : "") + '" placeholder="e.g. Delivered on Tuesdays & Saturdays"/></div>' +
        '<div class="switch-row"><div><div class="sr-label">Active</div><div class="sr-hint">Use this fee in checkout</div></div>' +
        '<label class="switch"><input type="checkbox" id="df_active"' + (!r || r.active ? " checked" : "") + '><span class="slider"></span></label></div>' +
        '<div class="form-actions"><button class="btn btn-primary" id="df_save">Save</button><button class="btn btn-outline" data-close>Cancel</button></div></div>';
      modal.classList.add("open");
      modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => modal.classList.remove("open")));
      document.getElementById("df_save").addEventListener("click", () => this.save(id));
    },

    async save(id) {
      const state = document.getElementById("df_state").value.trim();
      const fee = Number(document.getElementById("df_fee").value || 0);
      if (!state || fee < 0) return ADMIN.toast("State and a valid fee are required", "error");
      const payload = {
        state,
        lga: document.getElementById("df_lga").value.trim() || null,
        delivery_fee: fee,
        estimated_days: Number(document.getElementById("df_days").value || 0) || null,
        special_notes: document.getElementById("df_notes").value.trim() || null,
        active: document.getElementById("df_active").checked,
      };
      try {
        if (id) {
          const { error } = await sb().from("delivery_zones").update(payload).eq("id", id);
          if (error) throw error;
          ADMIN.toast("Zone updated", "success");
        } else {
          const { error } = await sb().from("delivery_zones").insert(payload);
          if (error) throw error;
          ADMIN.toast("Zone created", "success");
        }
        document.getElementById("d_modal").classList.remove("open");
        await this.load();
      } catch (e) {
        ADMIN.toast(e.message || "Save failed", "error");
      }
    },

    async remove(id) {
      const r = this.state.rows.find((x) => x.id === id);
      if (!confirm('Delete zone for "' + r.state + '"?')) return;
      try {
        const { error } = await sb().from("delivery_zones").delete().eq("id", id);
        if (error) throw error;
        ADMIN.toast("Zone deleted", "success");
        await this.load();
      } catch (e) {
        ADMIN.toast(e.message || "Delete failed", "error");
      }
    },
  };

  win.AdminPage = AdminPage;
})(window);