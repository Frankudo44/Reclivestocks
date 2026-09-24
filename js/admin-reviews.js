/* ============================================================
   REC — Admin Product Reviews (moderation)
   Approve / hide, feature, and delete customer reviews.
   Reviews are never published automatically.
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const ADMIN = (win.RECAdmin = win.RECAdmin || {});
  const sb = () => REC.supabaseClient;
  const stars = (n) => "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));

  const AdminPage = {
    state: { rows: [], filter: "pending" },

    async init() {
      document.title = "Reviews | REC Admin";
      ADMIN.setState();
      const content = document.getElementById("admin-content");
      if (!sb()) return (content.innerHTML = ADMIN.emptyState("No connection", "Connect Supabase first."));

      content.innerHTML =
        '<div class="admin-panel"><div class="ap-head"><div><h3>Product Reviews</h3>' +
        '<span style="font-size:.8rem;color:var(--muted)">Customers rate and comment on products. Approve to publish.</span></div></div>' +
        '<div class="filter-tabs" id="rv_filters">' +
        '<button class="btn btn-sm btn-outline active" data-filter="pending">Pending</button>' +
        '<button class="btn btn-sm btn-outline" data-filter="approved">Approved</button>' +
        '<button class="btn btn-sm btn-outline" data-filter="all">All</button>' +
        "</div>" +
        '<div class="ap-body" id="rv_list">' + ADMIN.skeleton(5) + "</div></div>";

      document.getElementById("rv_filters").addEventListener("click", (e) => {
        const b = e.target.closest("[data-filter]");
        if (!b) return;
        this.state.filter = b.getAttribute("data-filter");
        document.querySelectorAll("#rv_filters [data-filter]").forEach((x) => x.classList.toggle("active", x === b));
        this.render();
      });
      document.getElementById("rv_list").addEventListener("change", (e) => this.toggle(e));
      document.getElementById("rv_list").addEventListener("click", (e) => {
        const dl = e.target.closest("[data-del]");
        if (dl) this.remove(dl.getAttribute("data-del"));
      });

      await this.load();
    },

    async load() {
      const { data, error } = await sb()
        .from("product_reviews")
        .select("*, products(id, name, slug)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) return ADMIN.toast(error.message, "error");
      this.state.rows = data || [];
      ADMIN.setCount("reviews", this.state.rows.filter((r) => !r.approved).length);
      this.render();
    },

    render() {
      const host = document.getElementById("rv_list");
      const filter = this.state.filter;
      const rows = this.state.rows.filter((r) =>
        filter === "pending" ? !r.approved : filter === "approved" ? r.approved : true
      );
      if (!rows.length) {
        host.innerHTML = ADMIN.emptyState(
          filter === "pending" ? "No pending reviews" : "No reviews",
          filter === "pending"
            ? "New customer reviews will appear here for approval."
            : "There are no product reviews to show."
        );
        return;
      }
      host.innerHTML =
        '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        "<th>Product</th><th>Customer</th><th>Rating</th><th>Review</th><th>Date</th><th>Featured</th><th>Approved</th><th></th>" +
        "</tr></thead><tbody>" +
        rows
          .map(
            (r) =>
              "<tr" + (r.approved ? "" : ' class="row-pending"') + ">" +
              '<td class="t-strong">' +
              '<a class="t-link" href="../product.html?id=' + encodeURIComponent(r.product_id) + '">' +
              ADMIN.esc(r.products ? r.products.name : "Product") + "</a>" +
              "</td>" +
              "<td>" + ADMIN.esc(r.author_name || r.user_id || "") + "</td>" +
              '<td style="color:var(--rec-gold);white-space:nowrap">' + stars(Math.min(5, r.rating || 0)) + "</td>" +
              '<td style="max-width:320px">' + ADMIN.esc(r.comment && r.comment.length > 90 ? r.comment.slice(0, 90) + "…" : r.comment || "") + "</td>" +
              "<td>" + ADMIN.date(r.created_at) + "</td>" +
              '<td><label class="switch"><input type="checkbox" data-feature="' + r.id + '"' + (r.featured ? " checked" : "") + '><span class="slider"></span></label></td>' +
              '<td><label class="switch"><input type="checkbox" data-approved="' + r.id + '"' + (r.approved ? " checked" : "") + '><span class="slider"></span></label></td>' +
              '<td><div class="t-actions">' +
              '<button class="t-btn danger" data-del="' + r.id + '" title="Delete"><svg><use href="../assets/icons/sprite.svg#i-trash"></use></svg></button>' +
              "</div></td></tr>"
          )
          .join("") +
        "</tbody></table></div>";
    },

    async toggle(e) {
      const app = e.target.closest("[data-approved]");
      const feat = e.target.closest("[data-feature]");
      if (app) {
        const id = app.getAttribute("data-approved");
        const row = this.state.rows.find((x) => x.id === id);
        try {
          const { error } = await sb()
            .from("product_reviews")
            .update({ approved: app.checked })
            .eq("id", id);
          if (error) throw error;
          if (row) row.approved = app.checked;
          ADMIN.toast(app.checked ? "Review published" : "Review hidden", "success");
          ADMIN.setCount("reviews", this.state.rows.filter((r) => !r.approved).length);
          if (this.state.filter !== "all") this.render();
        } catch (err) {
          app.checked = !app.checked;
          ADMIN.toast(err.message || "Update failed", "error");
        }
      }
      if (feat) {
        const id = feat.getAttribute("data-feature");
        const row = this.state.rows.find((x) => x.id === id);
        try {
          const { error } = await sb()
            .from("product_reviews")
            .update({ featured: feat.checked })
            .eq("id", id);
          if (error) throw error;
          if (row) row.featured = feat.checked;
          ADMIN.toast(feat.checked ? "Review featured" : "Unfeatured", "success");
          if (this.state.filter === "approved") this.render();
        } catch (err) {
          feat.checked = !feat.checked;
          ADMIN.toast(err.message || "Update failed", "error");
        }
      }
    },

    async remove(id) {
      if (!confirm("Delete this review permanently?")) return;
      try {
        const { error } = await sb().from("product_reviews").delete().eq("id", id);
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