/* ============================================================
   REC — Admin Blog (CRUD + storage header upload)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const ADMIN = (win.RECAdmin = win.RECAdmin || {});
  const sb = () => REC.supabaseClient;

  const AdminPage = {
    state: { rows: [] },

    async init() {
      document.title = "Blog | REC Admin";
      ADMIN.setState();
      const content = document.getElementById("admin-content");
      if (!sb()) return (content.innerHTML = ADMIN.emptyState("No connection", "Connect Supabase first."));

      content.innerHTML =
        '<div class="admin-panel"><div class="ap-head"><div><h3>Articles</h3>' +
        '<span style="font-size:.8rem;color:var(--muted)">Write guides and updates to position REC as a trusted source.</span></div>' +
        '<button class="btn btn-sm btn-primary" id="b_add"><svg aria-hidden="true" style="width:16px;height:16px"><use href="../assets/icons/sprite.svg#i-plus"></use></svg> New Article</button></div>' +
        '<div class="ap-body" id="b_list">' + ADMIN.skeleton(4) + "</div></div>";

      await this.load();
      document.getElementById("b_add").addEventListener("click", () => this.openForm());
      document.getElementById("b_list").addEventListener("click", (e) => {
        const ed = e.target.closest("[data-edit]");
        if (ed) this.openForm(ed.getAttribute("data-edit"));
        const dl = e.target.closest("[data-del]");
        if (dl) this.remove(dl.getAttribute("data-del"));
      });
      document.getElementById("b_list").addEventListener("change", (e) => this.toggle(e));
    },

    async load() {
      const { data, error } = await sb().from("blog_posts").select("*").order("published_at", { ascending: false }).limit(200);
      if (error) return ADMIN.toast(error.message, "error");
      this.state.rows = data || [];
      this.render();
    },

    render() {
      const host = document.getElementById("b_list");
      if (!this.state.rows.length) {
        host.innerHTML = ADMIN.emptyState("No articles yet", "Publish your first article from the Blog section of the website.");
        return;
      }
      host.innerHTML =
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Title</th><th>Category</th><th>Published</th><th>Status</th><th></th></tr></thead><tbody>' +
        this.state.rows
          .map(
            (r) =>
              "<tr>" +
              '<td class="t-strong">' + ADMIN.esc(r.title) + "</td>" +
              "<td>" + ADMIN.esc(r.category || "Guides") + "</td>" +
              "<td>" + (r.published_at ? ADMIN.date(r.published_at) : "—") + "</td>" +
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
      let modal = document.getElementById("b_modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.className = "modal-root";
        modal.id = "b_modal";
        document.body.appendChild(modal);
      }
      modal.innerHTML =
        '<div class="modal-backdrop" data-close></div>' +
        '<div class="modal-card modal-lg" role="dialog" aria-modal="true">' +
        '<button class="modal-close" data-close aria-label="Close"><svg><use href="../assets/icons/sprite.svg#i-close"></use></svg></button>' +
        "<h3>" + (r ? "Edit Article" : "New Article") + "</h3>" +
        '<div class="admin-grid-2">' +
        '<div class="field full"><label for="bf_title">Title *</label><input class="input" id="bf_title" value="' + ADMIN.esc(r ? r.title : "") + '"/></div>' +
        '<div class="field"><label for="bf_category">Category</label><input class="input" id="bf_category" value="' + ADMIN.esc(r ? r.category || "Guides" : "Guides") + '"/></div>' +
        '<div class="field"><label for="bf_author">Author</label><input class="input" id="bf_author" value="' + ADMIN.esc(r ? r.author || "" : "REC Farm Team") + '"/></div>' +
        '</div>' +
        '<div class="field"><label for="bf_excerpt">Excerpt</label><textarea class="textarea" id="bf_excerpt" style="min-height:70px">' + ADMIN.esc(r ? r.excerpt || "" : "") + "</textarea></div>" +
        '<div class="field"><label for="bf_content">Content (Markdown)</label><textarea class="textarea mono" id="bf_content" style="min-height:200px">' + ADMIN.esc(r ? r.content : "") + "</textarea>" +
        '<span class="hint">Supports ## headings, bold **text**, lists and links.</span></div>' +
        '<div class="field"><label for="bf_cover">Cover image URL</label>' +
        '<input class="input" id="bf_cover" value="' + ADMIN.esc(r ? r.image || "" : "../assets/images/turkey.png") + '"/>' +
        '<label class="btn btn-sm btn-outline" style="margin-top:.5rem;width:fit-content;cursor:pointer"><svg aria-hidden="true" style="width:16px;height:16px"><use href="../assets/icons/sprite.svg#i-upload"></use></svg> Upload' +
        '<input type="file" id="bf_file" accept="image/*" style="display:none"/></label></div>' +
        '<div class="form-actions">' +
        '<button class="btn btn-primary" id="bf_save">' + (r ? "Save Changes" : "Publish") + "</button>" +
        '<button class="btn btn-outline" data-close>Cancel</button></div></div>';
      modal.classList.add("open");
      modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => modal.classList.remove("open")));
      document.getElementById("bf_save").addEventListener("click", () => this.save(id));

      document.getElementById("bf_file").addEventListener("change", async (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        try {
          const path = "blog/" + Date.now() + "-" + file.name.replace(/\s+/g, "-");
          const { error } = await sb().storage.from(REC.config.storageBucket).upload(path, file, { contentType: file.type });
          if (error) throw error;
          const { data } = sb().storage.from(REC.config.storageBucket).getPublicUrl(path);
          document.getElementById("bf_cover").value = data.publicUrl;
          ADMIN.toast("Cover uploaded", "success");
        } catch (e) {
          ADMIN.toast(e.message || "Upload failed", "error");
        }
      });
    },

    async save(id) {
      const title = document.getElementById("bf_title").value.trim();
      const content = document.getElementById("bf_content").value.trim();
      if (!title || !content) return ADMIN.toast("Title and content are required", "error");
      const payload = {
        title,
        content,
        category: document.getElementById("bf_category").value.trim() || "Guides",
        author: document.getElementById("bf_author").value.trim() || "REC Farm Team",
        excerpt: document.getElementById("bf_excerpt").value.trim() || null,
        image: document.getElementById("bf_cover").value.trim() || null,
        published: true,
        published_at: new Date().toISOString(),
      };
      try {
        if (id) {
          const { error } = await sb().from("blog_posts").update(payload).eq("id", id);
          if (error) throw error;
          ADMIN.toast("Article updated", "success");
        } else {
          const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
          payload.slug = slug;
          const { error } = await sb().from("blog_posts").insert(payload);
          if (error) throw error;
          ADMIN.toast("Article published", "success");
        }
        document.getElementById("b_modal").classList.remove("open");
        await this.load();
      } catch (e) {
        ADMIN.toast(e.message || "Save failed", "error");
      }
    },

    async toggle(e) {
      const chk = e.target.closest("[data-active]");
      if (!chk) return;
      try {
        const { error } = await sb().from("blog_posts").update({ published: chk.checked }).eq("id", chk.getAttribute("data-active"));
        if (error) throw error;
        ADMIN.toast(chk.checked ? "Published" : "Saved as draft", "success");
      } catch (err) {
        ADMIN.toast(err.message || "Update failed", "error");
      }
    },

    async remove(id) {
      if (!confirm("Delete this article?")) return;
      try {
        const { error } = await sb().from("blog_posts").delete().eq("id", id);
        if (error) throw error;
        ADMIN.toast("Article deleted", "success");
        await this.load();
      } catch (e) {
        ADMIN.toast(e.message || "Delete failed", "error");
      }
    },
  };

  win.AdminPage = AdminPage;
})(window);