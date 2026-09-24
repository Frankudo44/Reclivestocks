/* ============================================================
   REC — Admin login
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;

  const AdminLogin = {
    async init() {
      const form = document.getElementById("admin_login_form");
      if (!form) return;

      REC.initSupabase();
      if (!REC.isSupabaseConfigured() || !REC.supabaseClient) {
        document.getElementById("al_setup_note").style.display = "block";
      }

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("al_submit");
        btn.disabled = true;
        btn.textContent = "Signing in…";
        try {
          if (!REC.supabaseClient) throw new Error("Supabase is not configured yet. Check js/config.js.");
          await REC.auth.signIn(
            document.getElementById("al_email").value.trim(),
            document.getElementById("al_password").value
          );
          const cur = REC.auth.currentUser();
          if (!cur || !cur.profile || cur.profile.role !== "admin") {
            await REC.auth.signOut();
            throw new Error("This account does not have admin access.");
          }
          UI.toast("Welcome back, " + (cur.profile.full_name || "Admin") + "!", "success");
          setTimeout(() => (window.location.href = "index.html"), 500);
        } catch (err) {
          UI.toast(err.message || "Login failed", "error");
          btn.disabled = false;
          btn.textContent = "Sign In to Dashboard";
        }
      });
    },
  };

  win.AdminLogin = AdminLogin;
})(window);