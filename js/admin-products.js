/* ============================================================
   REC — Admin Products (CRUD + image upload)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const ADMIN = (win.RECAdmin = win.RECAdmin || {});
  const sb = () => REC.supabaseClient;

  const AdminPage = {
    state: { products: [], categories: [], editId: null, search: "" },

    async init() {
      document.title = "Products | REC Admin";
      ADMIN.setState();
      const content = document.getElementById("admin-content");
      if (!sb()) return (content.innerHTML = ADMIN.emptyState("No connection", "Connect Supabase first."));

      content.innerHTML =
        '<div class="admin-panel"><div class="ap-head">' +
        '<div><h3>Products</h3><span style="font-size:.8rem;color:var(--muted)">Manage your catalogue — everything updates live on the website.</span></div>' +
        '<div style="display:flex;gap:.6rem;flex-wrap:wrap">' +
        '<input class="input" id="p_search" type="search" placeholder="Search..." style="max-width:200px;padding:.55rem .8rem"/>' +
        '<button class="btn btn-sm btn-primary" id="p_add"><svg aria-hidden="true" style="width:16px;height:16px"><use href="../assets/icons/sprite.svg#i-plus"></use></svg> Add Product</button>' +
        "</div></div>" +
        '<div class="ap-body" id="p_list">' +
        ADMIN.skeleton(6) +
        "</div></div>";

      await this.load();
      this.bind();
    },

    async load() {
      const [p, c] = await Promise.all([
        sb().from("products").select("*").order("created_at", { ascending: false }),
        sb().from("categories").select("*").order("sort_order"),
      ]);
      this.state.products = p.data || [];
      this.state.categories = c.data || [];
      ADMIN.setCount("products", this.state.products.length);
      this.render();
    },

    render() {
      const host = document.getElementById("p_list");
      if (!host) return;
      let list = this.state.products;
      const s = this.state.search.trim().toLowerCase();
      if (s) list = list.filter((x) => x.name.toLowerCase().includes(s));
      if (!list.length) {
        host.innerHTML = ADMIN.emptyState(
          "No products yet",
          "Add your first product to make it visible in the shop."
        );
        return;
      }
      const catName = (id) => {
        const c = this.state.categories.find((x) => x.id === id);
        return c ? c.name : "—";
      };
      host.innerHTML =
        '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        "<th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Online Orderable</th><th>Status</th><th></th>" +
        "</tr></thead><tbody>" +
        list
          .map(
            (p) =>
              "<tr>" +
              '<td><div class="t-prod"><img src="' + ADMIN.esc(p.image_url || "../assets/images/placeholder-product.svg") + '" alt=""/>' +
              '<div><span class="t-strong">' + ADMIN.esc(p.name) + "</span><br/>" +
              '<span style="font-size:.78rem;color:var(--muted)">' + ADMIN.esc(p.unit || "") + "</span></div></div></td>" +
              "<td>" + ADMIN.esc(catName(p.category_id)) + "</td>" +
              "<td class=\"t-strong\">" + ADMIN.money(p.price) + "</td>" +
              "<td>" + (p.stock_quantity > 0 ? p.stock_quantity : '<span style="color:var(--danger);font-weight:700">0</span>') + "</td>" +
              "<td><span class=\"badge " + (p.online_orderable ? "badge-green" : "badge-red") + '">' + (p.online_orderable ? "Yes" : "Visit Farm") + "</span></td>" +
              "<td><span class=\"badge " + (p.active ? "badge-green" : "badge-gray") + '">' + (p.active ? "Active" : "Hidden") + "</span>" +
              (p.featured ? ' <span class="badge badge-gold">F</span>' : "") + "</td>" +
              '<td><div class="t-actions">' +
              '<button class="t-btn" data-edit="' + p.id + '" title="Edit"><svg><use href="../assets/icons/sprite.svg#i-edit"></use></svg></button>' +
              '<button class="t-btn danger" data-del="' + p.id + '" title="Delete"><svg><use href="../assets/icons/sprite.svg#i-trash"></use></svg></button>' +
              "</div></td></tr>"
          )
          .join("") +
        "</tbody></table></div>";
    },

    bind() {
      const search = document.getElementById("p_search");
      if (search) {
        search.addEventListener("input", () => {
          this.state.search = search.value;
          this.render();
        });
      }
      document.getElementById("p_add").addEventListener("click", () => this.openForm());
      document.addEventListener("click", (e) => {
        const ed = e.target.closest("[data-edit]");
        if (ed) this.openForm(ed.getAttribute("data-edit"));
        const dl = e.target.closest("[data-del]");
        if (dl) this.remove(dl.getAttribute("data-del"));
      });
    },

    openForm(id) {
      this.state.editId = id || null;
      const p = id ? this.state.products.find((x) => x.id === id) : null;
      const cats = this.state.categories;
      let modal = document.getElementById("p_modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.className = "modal-root";
        modal.id = "p_modal";
        document.body.appendChild(modal);
      }
      modal.innerHTML =
        '<div class="modal-backdrop" data-close></div>' +
        '<div class="modal-card" role="dialog" aria-modal="true">' +
        '<button class="modal-close" data-close aria-label="Close"><svg><use href="../assets/icons/sprite.svg#i-close"></use></svg></button>' +
        "<h3>" + (p ? "Edit Product" : "Add Product") + "</h3>" +
        '<div class="admin-grid-2">' +
        '<div class="field"><label for="pf_name">Name *</label><input class="input" id="pf_name" value="' + ADMIN.esc(p ? p.name : "") + '"/></div>' +
        '<div class="field"><label for="pf_unit">Unit</label><input class="input" id="pf_unit" value="' + ADMIN.esc(p ? p.unit || "" : "per item") + '"/></div>' +
        '<div class="field"><label for="pf_price">Price (₦) *</label><input class="input" id="pf_price" type="number" min="0" step="0.01" value="' + (p ? p.price : "") + '"/></div>' +
        '<div class="field"><label for="pf_stock">Stock quantity</label><input class="input" id="pf_stock" type="number" min="0" value="' + (p ? p.stock_quantity : 0) + '"/></div>' +
        '<div class="field"><label for="pf_cat">Category</label><select class="select" id="pf_cat">' +
        cats
          .map((c) => '<option value="' + c.id + '"' + (p && p.category_id === c.id ? " selected" : "") + ">" + ADMIN.esc(c.name) + "</option>")
          .join("") +
        "</select></div>" +
        '<div class="field"><label for="pf_moq">Minimum order qty</label><input class="input" id="pf_moq" type="number" min="1" value="' + (p ? p.minimum_order_quantity : 1) + '"/></div>' +
        '<div class="field full"><label for="pf_desc">Description</label><textarea class="textarea" id="pf_desc" style="min-height:90px">' + ADMIN.esc(p ? p.description || "" : "") + "</textarea></div>" +
        '<div class="field"><label for="pf_breed">Breed / Type</label><input class="input" id="pf_breed" value="' + ADMIN.esc(p ? p.breed || "" : "") + '"/></div>' +
        '<div class="field"><label for="pf_age">Age</label><input class="input" id="pf_age" value="' + ADMIN.esc(p ? p.age || "" : "") + '"/></div>' +
        '<div class="field"><label for="pf_sex">Sex</label><input class="input" id="pf_sex" value="' + ADMIN.esc(p ? p.sex || "" : "") + '"/></div>' +
        '<div class="field"><label for="pf_weight">Weight</label><input class="input" id="pf_weight" value="' + ADMIN.esc(p ? p.weight || "" : "") + '"/></div>' +
        '<div class="field full"><label for="pf_delivery">Delivery info</label><input class="input" id="pf_delivery" value="' + ADMIN.esc(p ? p.delivery_info || "" : "") + '"/></div>' +
        '<div class="field full"><label for="pf_image">Image URL (or upload)</label>' +
        '<input class="input" id="pf_image" value="' + ADMIN.esc(p ? p.image_url || "" : "") + '" placeholder="https://... or upload a file"/>' +
        '<label class="btn btn-sm btn-outline" style="margin-top:.5rem;width:fit-content;cursor:pointer">' +
        '<svg aria-hidden="true" style="width:16px;height:16px"><use href="../assets/icons/sprite.svg#i-upload"></use></svg> Upload Image' +
        '<input type="file" id="pf_file" accept="image/*" style="display:none"/></label>' +
        '<span class="hint" id="pf_upload_hint"></span></div>' +
        '<div class="field full"><label>Gallery images</label>' +
        '<div id="pf_gallery_list"></div>' +
        '<button type="button" class="btn btn-sm btn-outline" id="pf_gallery_add" style="margin-top:.2rem">' +
        '<svg aria-hidden="true" style="width:16px;height:16px"><use href="../assets/icons/sprite.svg#i-plus"></use></svg> Add another image</button>' +
        '<span class="hint">Extra images shown in the product gallery. The image above is used as the cover.</span></div>' +
        "</div>" +
        '<div class="switch-row"><div><div class="sr-label">Active</div><div class="sr-hint">Visible in shop</div></div>' +
        '<label class="switch"><input type="checkbox" id="pf_active"' + (!p || p.active ? " checked" : "") + '><span class="slider"></span></label></div>' +
        '<div class="switch-row"><div><div class="sr-label">Featured</div><div class="sr-hint">Show in Featured Products</div></div>' +
        '<label class="switch"><input type="checkbox" id="pf_featured"' + (p && p.featured ? " checked" : "") + '><span class="slider"></span></label></div>' +
        '<div class="switch-row"><div><div class="sr-label">Online orderable</div><div class="sr-hint">Turn off to show “Visit Farm to Purchase”</div></div>' +
        '<label class="switch"><input type="checkbox" id="pf_online"' + (!p || p.online_orderable ? " checked" : "") + '><span class="slider"></span></label></div>' +
        '<div class="form-actions">' +
        '<button class="btn btn-primary" id="pf_save">Save Product</button>' +
        '<button class="btn btn-outline" data-close>Cancel</button>' +
        "</div></div>";

      modal.classList.add("open");
      modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => modal.classList.remove("open")));
      document.getElementById("pf_save").addEventListener("click", () => this.save());

      const gallery = p && Array.isArray(p.gallery) ? p.gallery.filter((u) => u && u !== (p.image_url || "")) : [];
      gallery.forEach((u) => this.appendGalleryRow(u));
      const listEl = document.getElementById("pf_gallery_list");
      if (!listEl.querySelector(".pf-g-row")) this.appendGalleryRow("");
      document.getElementById("pf_gallery_add").addEventListener("click", () => this.appendGalleryRow(""));
      listEl.addEventListener("click", (ev) => {
        const del = ev.target.closest(".pf-g-del");
        if (del) del.closest(".pf-g-row").remove();
      });
      listEl.addEventListener("change", (ev) => {
        const file = ev.target.closest(".pf-g-file");
        if (!file || !file.files[0]) return;
        this.uploadTo(file, file.closest(".pf-g-row").querySelector(".pf-g-img"));
      });

      document.getElementById("pf_file").addEventListener("change", (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        this.uploadTo(ev.target, document.getElementById("pf_image"), document.getElementById("pf_upload_hint"));
      });
    },

    appendGalleryRow(url) {
      const list = document.getElementById("pf_gallery_list");
      if (!list) return;
      const row = document.createElement("div");
      row.className = "pf-g-row";
      row.style.cssText = "display:flex;gap:.4rem;margin-bottom:.4rem;align-items:center";
      row.innerHTML =
        '<input class="input pf-g-img" value="' +
        ADMIN.esc(url || "") +
        '" placeholder="https://... image URL or upload"/>' +
        '<label class="btn btn-sm btn-outline" style="margin:0;cursor:pointer;white-space:nowrap;flex:0 0 auto">Upload' +
        '<input type="file" class="pf-g-file" accept="image/*" style="display:none"/></label>' +
        '<button type="button" class="t-btn danger pf-g-del" title="Remove image"><svg><use href="../assets/icons/sprite.svg#i-trash"></use></svg></button>';
      list.appendChild(row);
    },

    async uploadTo(fileInput, urlInput, hint) {
      const file = fileInput.files[0];
      if (!file) return;
      const original = urlInput.value;
      if (hint) hint.textContent = "Uploading…";
      else urlInput.value = "Uploading…";
      try {
        const path = "products/" + Date.now() + "-" + file.name.replace(/\s+/g, "-");
        const { error } = await sb().storage.from(REC.config.storageBucket).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
        if (error) throw error;
        const { data } = sb().storage.from(REC.config.storageBucket).getPublicUrl(path);
        urlInput.value = data.publicUrl;
        if (hint) hint.textContent = "Uploaded ✓";
      } catch (e) {
        if (hint) hint.textContent = "Upload failed: " + e.message;
        else ADMIN.toast("Upload failed: " + e.message, "error");
      }
    },

    galleryUrls() {
      const list = document.getElementById("pf_gallery_list");
      if (!list) return [];
      return Array.from(list.querySelectorAll(".pf-g-img"))
        .map((i) => i.value.trim())
        .filter(Boolean);
    },

    async save() {
      const get = (id) => document.getElementById(id);
      const name = get("pf_name").value.trim();
      const price = Number(get("pf_price").value || 0);
      if (!name || price < 0) return ADMIN.toast("Name and price are required", "error");

      const btn = get("pf_save");
      btn.disabled = true;
      btn.textContent = "Saving…";

      const gallery = [get("pf_image").value.trim(), ...this.galleryUrls()].filter(Boolean);
      const finalGallery = Array.from(new Set(gallery));

      const payload = {
        name,
        unit: get("pf_unit").value.trim() || "each",
        price,
        stock_quantity: Number(get("pf_stock").value || 0),
        category_id: Number(get("pf_cat").value) || null,
        minimum_order_quantity: Number(get("pf_moq").value || 1),
        description: get("pf_desc").value.trim(),
        breed: get("pf_breed").value.trim() || null,
        age: get("pf_age").value.trim() || null,
        sex: get("pf_sex").value.trim() || null,
        weight: get("pf_weight").value.trim() || null,
        delivery_info: get("pf_delivery").value.trim() || null,
        image_url: finalGallery[0] || null,
        gallery: finalGallery.length ? finalGallery : null,
        active: get("pf_active").checked,
        featured: get("pf_featured").checked,
        online_orderable: get("pf_online").checked,
      };

      try {
        if (this.state.editId) {
          const { error } = await sb().from("products").update(payload).eq("id", this.state.editId);
          if (error) throw error;
          ADMIN.toast("Product updated", "success");
        } else {
          payload.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const { error } = await sb().from("products").insert(payload);
          if (error) throw error;
          ADMIN.toast("Product created", "success");
        }
        document.getElementById("p_modal").classList.remove("open");
        await this.load();
      } catch (e) {
        ADMIN.toast(e.message || "Save failed", "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "Save Product";
      }
    },

    async remove(id) {
      const p = this.state.products.find((x) => x.id === id);
      if (!p) return;
      if (!confirm("Delete \"" + p.name + "\"? This cannot be undone.")) return;
      try {
        const { error } = await sb().from("products").delete().eq("id", id);
        if (error) throw error;
        ADMIN.toast("Product deleted", "success");
        await this.load();
      } catch (e) {
        ADMIN.toast(e.message || "Delete failed", "error");
      }
    },
  };

  win.AdminPage = AdminPage;
})(window);