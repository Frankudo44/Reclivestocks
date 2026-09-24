/* ============================================================
   REC — Contact page (form → Supabase, fallback to WhatsApp)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;

  function $(s, r) {
    return (r || document).querySelector(s);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    REC.initSupabase();

    // Populate contact details from settings
    const s = await REC.products.getSettings();
    const fill = (id, val) => {
      const el = $("#" + id);
      if (el) el.textContent = val || el.textContent;
    };
    fill("c_company", s.business_name || REC.config.appName);
    fill("c_location", s.address || REC.config.location);
    fill("c_email", s.email || REC.config.email);
    fill("c_phone", s.phone || REC.config.phone);
    const tel = $("#c_phone_link");
    if (tel) tel.href = "tel:" + (REC.config.phoneRaw || "+2348135042997");
    const mail = $("#c_email_link");
    if (mail) mail.href = "mailto:" + (s.email || REC.config.email);
    const wa = $("#c_wa_link");
    if (wa) wa.href = REC.whatsapp.general();
    const wa2 = $("#c_wa_link2");
    if (wa2) wa2.href = REC.whatsapp.general();

    // Social + channel/group links (only real links are shown)
    const socials = [
      { href: s.social_whatsapp || REC.whatsapp.general(), icon: "i-whatsapp", label: "WhatsApp" },
      { href: s.whatsapp_channel, icon: "i-whatsapp", label: "WhatsApp Channel" },
      { href: s.whatsapp_group, icon: "i-whatsapp", label: "WhatsApp Group" },
      { href: s.social_facebook, icon: "i-facebook", label: "Facebook" },
      { href: s.social_instagram, icon: "i-instagram", label: "Instagram" },
      { href: s.social_tiktok, icon: "i-tiktok", label: "TikTok" },
      { href: s.social_youtube, icon: "i-youtube", label: "YouTube" },
      { href: s.social_telegram || s.telegram_channel, icon: "i-telegram", label: "Telegram" },
    ].filter((x) => !!x.href);
    const socialHost = $("#c_socials");
    if (socialHost) {
      socialHost.innerHTML = socials
        .map(
          (x) =>
            '<a href="' +
            UI.esc(x.href) +
            '" aria-label="' +
            UI.esc(x.label) +
            '" target="_blank" rel="noopener">' +
            UI.icon(x.icon) +
            "</a>"
        )
        .join("");
    }

    const form = $("#contact_form");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Honeypot — bots fill the hidden field; silently ignore.
        const honeypot = $("#cf_website");
        if (honeypot && honeypot.value.trim()) return;

        // Minimal rate guard — one submission per 90 seconds per browser.
        const LAST_KEY = "rec_contact_last";
        const last = Number(localStorage.getItem(LAST_KEY) || 0);
        if (Date.now() - last < 90000) {
          UI.toast("Thanks — please wait a moment before sending another message.", "info");
          return;
        }

        const name = $("#cf_name").value.trim();
        const email = $("#cf_email").value.trim();
        const phone = $("#cf_phone").value.trim();
        const subject = $("#cf_subject").value.trim();
        const message = $("#cf_message").value.trim();

        if (!name || !message || message.length < 10) {
          UI.toast("Please fill your name and a message (at least 10 characters).", "error");
          return;
        }

        const btn = $("#cf_submit");
        const original = btn.innerHTML;
        btn.disabled = true;
        btn.textContent = "Sending…";

        const client = REC.supabaseClient;
        if (client) {
          try {
            const { error } = await client.from("contact_messages").insert({
              name,
              email: email || null,
              phone: phone || null,
              subject: subject || "Website enquiry",
              message,
            });
            if (error) throw error;
            form.reset();
            localStorage.setItem(LAST_KEY, String(Date.now()));
            UI.toast("Thank you! Your message has been sent to the REC team.", "success");
            btn.disabled = false;
            btn.innerHTML = original;
            return;
          } catch (err) {
            console.error("Contact insert failed:", err.message);
            // fall through to WhatsApp handoff
          }
        }

        // Fallback: open WhatsApp with the message
        const waMsg =
          "Hello REC Livestock & Agro Farms,\n" +
          (name ? "My name is " + name + ".\n" : "") +
          (subject ? "Subject: " + subject + "\n" : "") +
          message +
          (phone ? "\n\nPhone: " + phone : "") +
          (email ? "\nEmail: " + email : "");
        window.open(REC.whatsapp.general(waMsg), "_blank", "noopener");
        UI.toast("Opening WhatsApp — please send the pre-filled message.", "info");
        btn.disabled = false;
        btn.innerHTML = original;
      });
    }
  });
})(window);