/* ============================================================
   REC — Admin Categories (CRUD)
   Schema: name, slug, description, image, sort_order
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const ADMIN = (win.RECAdmin = win.RECAdmin || {});
  const sb = () => REC.supabaseClient;

  const slugify = (s) =>
    String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const AdminPage = {
    state: { rows: [] },

    async init() {
      document.title = "Categories | REC Admin";
      ADMIN.setState();
      const content = document.getElementById("admin-content");
      if (!sb()) return (content.innerHTML = ADMIN.emptyState("No connection", "Connect Supabase first."));

      content.innerHTML =
        '<div class="admin-panel"><div class="ap-head"><div><h3>Categories</h3>' +
        '<span style="font-size:.8rem;color:var(--muted)">These drive the navigation tiles on the homepage.</span></div>' +
        '<button class="btn btn-sm btn-primary" id="c_add"><svg aria-hidden="true" style="width:16px;height:16px"><use href="../assets/icons/sprite.svg#i-plus"></use></svg> Add Category</button></div>' +
        '<div class="ap-body" id="c_list">' + ADMIN.skeleton(4) + "</div></div>";

      await this.load();
      document.getElementById("c_add").addEventListener("click", () => this.openForm());
      document.getElementById("c_list").addEventListener("click", (e) => {
        const ed = e.target.closest("[data-edit]");
        if (ed) this.openForm(ed.getAttribute("data-edit"));
        const dl = e.target.closest("[data-del]");
        if (dl) this.remove(dl.getAttribute("data-del"));
      });
    },

    async load() {
      const { data, error } = await sb().from("categories").select("*").order("sort_order");
      if (error) return ADMIN.toast(error.message, "error");
      this.state.rows = data || [];
      ADMIN.setCount("categories", this.state.rows.length);
      this.render();
    },

    render() {
      const host = document.getElementById("c_list");
      if (!host) return;
      if (!this.state.rows.length) {
        host.innerHTML = ADMIN.emptyState("No categories", "Add categories to fill the homepage tiles.");
        return;
      }
      host.innerHTML =
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Category</th><th>Slug</th><th>Image</th><th>Sort</th><th></th></tr></thead><tbody>' +
        this.state.rows
          .map(
            (c) =>
              "<tr>" +
              '<td class="t-strong">' + ADMIN.esc(c.name) + "</td>" +
              "<td><code>" + ADMIN.esc(c.slug) + "</code></td>" +
              '<td><div class="t-prod"><img src="' + ADMIN.esc(c.image || "../assets/images/placeholder-product.svg") + '" alt=""/></div></td>' +
              "<td>" + c.sort_order + "</td>" +
              '<td><div class="t-actions">' +
              '<button class="t-btn" data-edit="' + c.id + '" title="Edit"><svg><use href="../assets/icons/sprite.svg#i-edit"></use></svg></button>' +
              '<button class="t-btn danger" data-del="' + c.id + '" title="Delete"><svg><use href="../assets/icons/sprite.svg#i-trash"></use></svg></button>' +
              "</div></td></tr>"
          )
          .join("") +
        "</tbody></table></div>";
    },

    openForm(id) {
      const c = id ? this.state.rows.find((x) => x.id === id) : null;
      let modal = document.getElementById("c_modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.className = "modal-root";
        modal.id = "c_modal";
        document.body.appendChild(modal);
      }
      modal.innerHTML =
        '<div class="modal-backdrop" data-close></div>' +
        '<div class="modal-card" role="dialog" aria-modal="true">' +
        '<button class="modal-close" data-close aria-label="Close"><svg><use href="../assets/icons/sprite.svg#i-close"></use></svg></button>' +
        "<h3>" + (c ? "Edit Category" : "Add Category") + "</h3>" +
        '<div class="field"><label for="cf_name">Name *</label><input class="input" id="cf_name" value="' + ADMIN.esc(c ? c.name : "") + '"/></div>' +
        '<div class="field"><label for="cf_desc">Description</label><textarea class="textarea" id="cf_desc" style="min-height:70px">' + ADMIN.esc(c ? c.description || "" : "") + "</textarea></div>" +
        '<div class="field"><label for="cf_image">Image URL</label><input class="input" id="cf_image" value="' + ADMIN.esc(c ? c.image || "" : "") + '" placeholder="https://… or assets/images/…"/>' +
        '<label class="btn btn-sm btn-outline" style="margin-top:.5rem;width:fit-content;cursor:pointer"><svg aria-hidden="true" style="width:16px;height:16px"><use href="../assets/icons/sprite.svg#i-upload"></use></svg> Upload' +
        '<input type="file" id="cf_file" accept="image/*" style="display:none"/></label></div>' +
        '<div class="field"><label for="cf_sort">Sort order</label><input class="input" id="cf_sort" type="number" value="' + (c ? c.sort_order : 1) + '"/></div>' +
        '<div class="form-actions"><button class="btn btn-primary" id="cf_save">Save</button><button class="btn btn-outline" data-close>Cancel</button></div></div>';
      modal.classList.add("open");
      modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => modal.classList.remove("open")));
      document.getElementById("cf_save").addEventListener("click", () => this.save(id));

      document.getElementById("cf_file").addEventListener("change", async (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        try {
          const path = "categories/" + Date.now() + "-" + file.name.replace(/\s+/g, "-");
          const { error } = await sb().storage.from(REC.config.storageBucket).upload(path, file, { contentType: file.type });
          if (error) throw error;
          const { data } = sb().storage.from(REC.config.storageBucket).getPublicUrl(path);
          document.getElementById("cf_image").value = data.publicUrl;
          ADMIN.toast("Image uploaded", "success");
        } catch (e) {
          ADMIN.toast(e.message || "Upload failed", "error");
        }
      });
    },

    async save(id) {
      const name = document.getElementById("cf_name").value.trim();
      if (!name) return ADMIN.toast("Name is required", "error");
      const existing = id ? this.state.rows.find((x) => x.id === id) : null;
      const payload = {
        name,
        slug: existing ? existing.slug : slugify(name),
        description: document.getElementById("cf_desc").value.trim() || null,
        image: document.getElementById("cf_image").value.trim() || null,
        sort_order: Number(document.getElementById("cf_sort").value || 1),
      };
      try {
        if (id) {
          const { error } = await sb().from("categories").update(payload).eq("id", id);
          if (error) throw error;
          ADMIN.toast("Category updated", "success");
        } else {
          const { error } = await sb().from("categories").insert(payload);
          if (error) throw error;
          ADMIN.toast("Category created", "success");
        }
        document.getElementById("c_modal").classList.remove("open");
        await this.load();
      } catch (e) {
        ADMIN.toast(e.message || "Save failed", "error");
      }
    },

    async remove(id) {
      const c = this.state.rows.find((x) => x.id === id);
      if (!confirm('Delete "' + c.name + '"? Products keep their category name.')) return;
      try {
        const { error } = await sb().from("categories").delete().eq("id", id);
        if (error) throw error;
        ADMIN.toast("Category deleted", "success");
        await this.load();
      } catch (e) {
        ADMIN.toast(e.message || "Delete failed", "error");
      }
    },
  };

  win.AdminPage = AdminPage;
})(window);