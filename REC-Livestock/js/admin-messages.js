/* ============================================================
   REC — Admin Messages (contact form inbox)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const ADMIN = (win.RECAdmin = win.RECAdmin || {});
  const sb = () => REC.supabaseClient;

  const AdminPage = {
    state: { rows: [] },

    async init() {
      document.title = "Messages | REC Admin";
      ADMIN.setState();
      const content = document.getElementById("admin-content");
      if (!sb()) return (content.innerHTML = ADMIN.emptyState("No connection", "Connect Supabase first."));

      content.innerHTML =
        '<div class="admin-panel"><div class="ap-head"><div><h3>Messages</h3>' +
        '<span style="font-size:.8rem;color:var(--muted)">Enquiries sent through the contact form.</span></div>' +
        '<button class="btn btn-sm btn-outline" id="m_unread">Mark all read</button></div>' +
        '<div class="ap-body" id="m_list">' + ADMIN.skeleton(5) + "</div></div>";

      await this.load();
      document.getElementById("m_list").addEventListener("click", (e) => this.onClick(e));
      document.getElementById("m_unread").addEventListener("click", () => this.markAll());
    },

    async load() {
      const { data, error } = await sb().from("contact_messages").select("*").order("handled").order("created_at", { ascending: false }).limit(200);
      if (error) return ADMIN.toast(error.message, "error");
      this.state.rows = data || [];
      ADMIN.setCount("messages", this.state.rows.filter((m) => !m.handled).length);
      this.render();
    },

    render() {
      const host = document.getElementById("m_list");
      if (!this.state.rows.length) {
        host.innerHTML = ADMIN.emptyState("No messages yet", "Messages from the contact page arrive here.");
        return;
      }
      host.innerHTML =
        '<div class="m-list">' +
        this.state.rows
          .map(
            (m) =>
              '<div class="m-item' + (m.handled ? "" : " unread") + '" data-id="' + m.id + '">' +
              '<div class="m-head"><strong>' + ADMIN.esc(m.name) + "</strong>" +
              '<a href="mailto:' + ADMIN.esc(m.email) + '" style="color:var(--rec-green);font-size:.85rem">' + ADMIN.esc(m.email) + "</a>" +
              '<span class="m-date">' + ADMIN.date(m.created_at) + "</span></div>" +
              '<div class="m-subject">' + ADMIN.esc(m.subject || "General enquiry") + "</div>" +
              '<p class="m-body">' + ADMIN.esc(m.message) + "</p>" +
              '<div class="m-actions">' +
              (m.handled ? "" : '<button class="btn btn-sm btn-outline" data-read="' + m.id + '">Mark read</button>') +
              '<button class="btn btn-sm btn-outline" data-del="' + m.id + '">Delete</button>' +
              "</div></div>"
          )
          .join("") +
        "</div>";
    },

    async onClick(e) {
      const id = (e.target.closest("[data-read]") || {}).getAttribute ? (e.target.closest("[data-read]") || {}).getAttribute("data-read") : null;
      const dl = e.target.closest("[data-del]");
      if (id) {
        try {
          const { error } = await sb().from("contact_messages").update({ handled: true }).eq("id", id);
          if (error) throw error;
          await this.load();
        } catch (err) {
          ADMIN.toast(err.message || "Update failed", "error");
        }
        return;
      }
      if (dl) {
        if (!confirm("Delete this message?")) return;
        try {
          const { error } = await sb().from("contact_messages").delete().eq("id", dl.getAttribute("data-del"));
          if (error) throw error;
          ADMIN.toast("Message deleted", "success");
          await this.load();
        } catch (err) {
          ADMIN.toast(err.message || "Delete failed", "error");
        }
      }
    },

    async markAll() {
      try {
        const { error } = await sb().from("contact_messages").update({ handled: true }).eq("handled", false);
        if (error) throw error;
        ADMIN.toast("All messages marked as read", "success");
        await this.load();
      } catch (err) {
        ADMIN.toast(err.message || "Update failed", "error");
      }
    },
  };

  win.AdminPage = AdminPage;
})(window);