/* ============================================================
   REC — Admin Testimonials (CRUD)
   Schema: name, location, message, photo_url, rating,
           sample, published
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const ADMIN = (win.RECAdmin = win.RECAdmin || {});
  const sb = () => REC.supabaseClient;

  const AdminPage = {
    state: { rows: [] },

    async init() {
      document.title = "Testimonials | REC Admin";
      ADMIN.setState();
      const content = document.getElementById("admin-content");
      if (!sb()) return (content.innerHTML = ADMIN.emptyState("No connection", "Connect Supabase first."));

      content.innerHTML =
        '<div class="admin-panel"><div class="ap-head"><div><h3>Customer Reviews</h3>' +
        '<span style="font-size:.8rem;color:var(--muted)">Shown in the homepage trust section.</span></div>' +
        '<button class="btn btn-sm btn-primary" id="t_add"><svg aria-hidden="true" style="width:16px;height:16px"><use href="../assets/icons/sprite.svg#i-plus"></use></svg> Add Review</button></div>' +
        '<div class="ap-body" id="t_list">' + ADMIN.skeleton(4) + "</div></div>";

      await this.load();
      document.getElementById("t_add").addEventListener("click", () => this.openForm());
      document.getElementById("t_list").addEventListener("click", (e) => {
        const ed = e.target.closest("[data-edit]");
        if (ed) this.openForm(ed.getAttribute("data-edit"));
        const dl = e.target.closest("[data-del]");
        if (dl) this.remove(dl.getAttribute("data-del"));
      });
      document.getElementById("t_list").addEventListener("change", (e) => this.toggle(e));
    },

    async load() {
      const { data, error } = await sb().from("testimonials").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) return ADMIN.toast(error.message, "error");
      this.state.rows = data || [];
      this.render();
    },

    render() {
      const host = document.getElementById("t_list");
      if (!this.state.rows.length) {
        host.innerHTML = ADMIN.emptyState("No reviews yet", "Add testimonials to build trust on the homepage.");
        return;
      }
      const stars = (n) => "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
      host.innerHTML =
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Customer</th><th>Location</th><th>Rating</th><th>Review</th><th>Published</th><th></th></tr></thead><tbody>' +
        this.state.rows
          .map(
            (r) =>
              "<tr>" +
              '<td class="t-strong">' + ADMIN.esc(r.name) + (r.sample ? ' <span class="badge badge-gold">Sample</span>' : "") + "</td>" +
              "<td>" + ADMIN.esc(r.location || "") + "</td>" +
              '<td style="color:var(--rec-gold)">' + stars(Math.min(5, r.rating || 5)) + "</td>" +
              '<td style="max-width:340px">' + ADMIN.esc(r.message && r.message.length > 90 ? r.message.slice(0, 90) + "…" : r.message || "") + "</td>" +
              '<td><label class="switch"><input type="checkbox" data-active="' + r.id + '"' + (r.published ? " checked" : "") + '><span class="slider"></span></label></td>' +
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
      let modal = document.getElementById("t_modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.className = "modal-root";
        modal.id = "t_modal";
        document.body.appendChild(modal);
      }
      modal.innerHTML =
        '<div class="modal-backdrop" data-close></div>' +
        '<div class="modal-card" role="dialog" aria-modal="true">' +
        '<button class="modal-close" data-close aria-label="Close"><svg><use href="../assets/icons/sprite.svg#i-close"></use></svg></button>' +
        "<h3>" + (r ? "Edit Review" : "Add Review") + "</h3>" +
        '<div class="admin-grid-2">' +
        '<div class="field"><label for="tf_name">Customer name *</label><input class="input" id="tf_name" value="' + ADMIN.esc(r ? r.name : "") + '"/></div>' +
        '<div class="field"><label for="tf_location">Location</label><input class="input" id="tf_location" value="' + ADMIN.esc(r ? r.location || "" : "") + '" placeholder="Umuahia, Abia"/></div>' +
        '<div class="field"><label for="tf_rating">Rating</label><select class="select" id="tf_rating">' +
        [1, 2, 3, 4, 5].map((n) => '<option value="' + n + '"' + (r && r.rating === n ? " selected" : "") + ">" + n + " stars</option>").join("") +
        "</select></div>" +
        '<div class="field"><label for="tf_photo">Photo URL</label><input class="input" id="tf_photo" value="' + ADMIN.esc(r ? r.photo_url || "" : "") + '" placeholder="https://…"/></div>' +
        "</div>" +
        '<div class="field"><label for="tf_content">Review *</label><textarea class="textarea" id="tf_content" style="min-height:110px">' + ADMIN.esc(r ? r.message : "") + "</textarea></div>" +
        '<div class="switch-row"><div><div class="sr-label">Published</div><div class="sr-hint">Visible on the website</div></div>' +
        '<label class="switch"><input type="checkbox" id="tf_published"' + (r && r.published ? " checked" : "") + '><span class="slider"></span></label></div>' +
        '<div class="switch-row"><div><div class="sr-label">Sample</div><div class="sr-hint">Tag as placeholder review</div></div>' +
        '<label class="switch"><input type="checkbox" id="tf_sample"' + (r && r.sample ? " checked" : "") + '><span class="slider"></span></label></div>' +
        '<div class="form-actions"><button class="btn btn-primary" id="tf_save">Save</button><button class="btn btn-outline" data-close>Cancel</button></div></div>';
      modal.classList.add("open");
      modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => modal.classList.remove("open")));
      document.getElementById("tf_save").addEventListener("click", () => this.save(id));
    },

    async save(id) {
      const name = document.getElementById("tf_name").value.trim();
      const message = document.getElementById("tf_content").value.trim();
      if (!name || !message) return ADMIN.toast("Name and review are required", "error");
      const payload = {
        name,
        message,
        location: document.getElementById("tf_location").value.trim() || null,
        photo_url: document.getElementById("tf_photo").value.trim() || null,
        rating: Number(document.getElementById("tf_rating").value) || 5,
        published: document.getElementById("tf_published").checked,
        sample: document.getElementById("tf_sample").checked,
      };
      try {
        if (id) {
          const { error } = await sb().from("testimonials").update(payload).eq("id", id);
          if (error) throw error;
          ADMIN.toast("Review updated", "success");
        } else {
          const { error } = await sb().from("testimonials").insert(payload);
          if (error) throw error;
          ADMIN.toast("Review added", "success");
        }
        document.getElementById("t_modal").classList.remove("open");
        await this.load();
      } catch (e) {
        ADMIN.toast(e.message || "Save failed", "error");
      }
    },

    async toggle(e) {
      const chk = e.target.closest("[data-active]");
      if (!chk) return;
      try {
        const { error } = await sb().from("testimonials").update({ published: chk.checked }).eq("id", chk.getAttribute("data-active"));
        if (error) throw error;
        ADMIN.toast("Updated", "success");
      } catch (err) {
        chk.checked = !chk.checked;
        ADMIN.toast(err.message || "Update failed", "error");
      }
    },

    async remove(id) {
      if (!confirm("Delete this review?")) return;
      try {
        const { error } = await sb().from("testimonials").delete().eq("id", id);
        if (error) throw error;
        ADMIN.toast("Review deleted", "success");
        await this.load();
      } catch (e) {
        ADMIN.toast(e.message || "Delete failed", "error");
      }
    },
  };

  win.AdminPage = AdminPage;
})(window);