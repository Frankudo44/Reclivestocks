/* ============================================================
   REC — Admin Settings (site_settings + stock alerts)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const ADMIN = (win.RECAdmin = win.RECAdmin || {});
  const sb = () => REC.supabaseClient;

  const AdminPage = {
    state: { settings: {} },

    async init() {
      document.title = "Settings | REC Admin";
      ADMIN.setState();
      const content = document.getElementById("admin-content");
      if (!sb()) return (content.innerHTML = ADMIN.emptyState("No connection", "Connect Supabase first."));

      await this.load();
      content.innerHTML =
        '<div class="admin-panel"><div class="ap-head"><div><h3>Site Settings</h3>' +
        '<span style="font-size:.8rem;color:var(--muted)">Brand info used across the website. Supabase keys are set in js/config.js / Vercel env vars.</span></div></div>' +
        '<div class="ap-body"><form id="s_form" class="admin-grid-2">' +
        '<div class="field"><label for="sf_site_name">Business name</label><input class="input" id="sf_site_name"/></div>' +
        '<div class="field"><label for="sf_motto">Motto</label><input class="input" id="sf_motto"/></div>' +
        '<div class="field"><label for="sf_phone">Phone</label><input class="input" id="sf_phone"/></div>' +
        '<div class="field"><label for="sf_whatsapp">WhatsApp (digits)</label><input class="input" id="sf_whatsapp"/></div>' +
        '<div class="field"><label for="sf_email">Email</label><input class="input" id="sf_email"/></div>' +
        '<div class="field"><label for="sf_address">Address</label><input class="input" id="sf_address"/></div>' +
        '<div class="field full"><label for="sf_delivery_note">Delivery note</label><input class="input" id="sf_delivery_note"/></div>' +
        '<div class="field full"><label for="sf_website">Website (URL)</label><input class="input" id="sf_website" placeholder="https://reclivestock.ng"/></div>' +
        '<div class="field"><label for="sf_fb">Facebook (URL)</label><input class="input" id="sf_fb"/></div>' +
        '<div class="field"><label for="sf_ig">Instagram (URL)</label><input class="input" id="sf_ig"/></div>' +
        '<div class="field"><label for="sf_tt">TikTok (URL)</label><input class="input" id="sf_tt"/></div>' +
        '<div class="field"><label for="sf_yt">YouTube (URL)</label><input class="input" id="sf_yt"/></div>' +
        '<div class="field"><label for="sf_tg">Telegram (URL)</label><input class="input" id="sf_tg"/></div>' +
        '<div class="field"><label for="sf_wa_channel">WhatsApp channel (URL)</label><input class="input" id="sf_wa_channel"/></div>' +
        '<div class="field"><label for="sf_wa_group">WhatsApp group (URL)</label><input class="input" id="sf_wa_group"/></div>' +
        '<div class="field"><label for="sf_tg_channel">Telegram channel (URL)</label><input class="input" id="sf_tg_channel"/></div>' +
        '<div class="field"><label for="sf_tg_group">Telegram group (URL)</label><input class="input" id="sf_tg_group"/></div>' +
        '<div class="form-actions full"><button class="btn btn-primary" type="submit">Save Settings</button>' +
        '<span class="hint" id="s_saved" style="display:none;color:var(--green-600);font-weight:700">Saved ✓</span></div>' +
        "</form></div></div>" +
        '<div id="s_stock"></div>';

      this.fillForm();
      document.getElementById("s_form").addEventListener("submit", (e) => {
        e.preventDefault();
        this.save();
      });
      this.renderStock();
    },

    async load() {
      const { data, error } = await sb().from("site_settings").select("*").limit(1);
      if (data && data.length) this.state.settings = data[0];
      else if (error) ADMIN.toast(error.message, "error");
    },

    fillForm() {
      const s = this.state.settings;
      document.getElementById("sf_site_name").value = s.business_name || REC.config.appName;
      document.getElementById("sf_motto").value = s.motto || "";
      document.getElementById("sf_phone").value = s.phone || REC.config.phone;
      document.getElementById("sf_whatsapp").value = s.whatsapp || "";
      document.getElementById("sf_email").value = s.email || REC.config.email;
      document.getElementById("sf_address").value = s.address || "";
      document.getElementById("sf_delivery_note").value = s.delivery_note || "";
      document.getElementById("sf_fb").value = s.social_facebook || "";
      document.getElementById("sf_ig").value = s.social_instagram || "";
      document.getElementById("sf_tt").value = s.social_tiktok || "";
      document.getElementById("sf_yt").value = s.social_youtube || "";
      document.getElementById("sf_tg").value = s.social_telegram || "";
      document.getElementById("sf_website").value = s.website || REC.config.website || "";
      document.getElementById("sf_wa_channel").value = s.whatsapp_channel || "";
      document.getElementById("sf_wa_group").value = s.whatsapp_group || "";
      document.getElementById("sf_tg_channel").value = s.telegram_channel || "";
      document.getElementById("sf_tg_group").value = s.telegram_group || "";
    },

    async save() {
      const v = (id) => document.getElementById(id).value.trim();
      let payload = {
        business_name: v("sf_site_name") || REC.config.appName,
        motto: v("sf_motto"),
        phone: v("sf_phone") || REC.config.phone,
        whatsapp: v("sf_whatsapp") || REC.config.phoneRaw || "",
        email: v("sf_email") || REC.config.email,
        address: v("sf_address"),
        delivery_note: v("sf_delivery_note"),
        social_facebook: v("sf_fb") || null,
        social_instagram: v("sf_ig") || null,
        social_tiktok: v("sf_tt") || null,
        social_youtube: v("sf_yt") || null,
        social_telegram: v("sf_tg") || null,
        website: v("sf_website") || REC.config.website || null,
        whatsapp_channel: v("sf_wa_channel") || null,
        whatsapp_group: v("sf_wa_group") || null,
        telegram_channel: v("sf_tg_channel") || null,
        telegram_group: v("sf_tg_group") || null,
      };
      try {
        if (this.state.settings && this.state.settings.id) {
          const { error } = await sb().from("site_settings").update(payload).eq("id", this.state.settings.id);
          if (error) throw error;
        } else {
          const { error } = await sb().from("site_settings").insert(payload);
          if (error) throw error;
        }
        const saved = document.getElementById("s_saved");
        saved.style.display = "inline";
        setTimeout(() => (saved.style.display = "none"), 2500);
        await this.load();
      } catch (e) {
        ADMIN.toast(e.message || "Save failed", "error");
      }
    },

    async renderStock() {
      const host = document.getElementById("s_stock");
      if (!host) return;
      const { data } = await sb().from("products").select("name,stock_quantity").order("stock_quantity");
      const low = (data || [])
        .filter((p) => Number(p.stock_quantity) <= 5)
        .slice(0, 5);
      host.innerHTML =
        '<div class="admin-panel" style="margin-top:1rem"><div class="ap-head"><h3>Env configuration</h3></div><div class="ap-body">' +
        '<div class="env-box"><code>SUPABASE_URL</code><span>' + ADMIN.esc(REC.config.supabaseUrl || "not set") + "</span></div>" +
        '<div class="env-box"><code>SUPABASE_ANON_KEY</code><span>' + (REC.config.supabaseAnonKey && REC.config.supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY" ? "configured (anon key)" : ADMIN.esc(REC.config.supabaseAnonKey || "not set")) + "</span></div>" +
        '<p class="hint" style="margin-top:.6rem">Diretions: set these in <b>js/config.js</b> for local dev, or as Vercel env vars for production. The public site uses only the anon key; never expose your service role key.</p>' +
        "</div></div>" +
        (low.length
          ? '<div class="admin-panel" style="margin-top:1rem"><div class="ap-head"><h3>Low Stock Alerts</h3></div><div class="ap-body">' +
            low.map((p) => '<div class="pd-meta"><strong>' + ADMIN.esc(p.name) + "</strong>: " + p.stock_quantity + " left</div>").join("") +
            "</div></div>"
          : "");
    },
  };

  win.AdminPage = AdminPage;
})(window);