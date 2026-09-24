/* ============================================================
   REC — Auth helpers
   Supabase Auth + admin role checks (role is enforced server-side).
   ============================================================ */
(function (win) {
  "use strict";
  const REC = win.REC || {};
  const UI = REC.ui;

  const AUTH_KEY = "rec_user";
  const SESSION_KEY = "rec_session";

  REC.auth = {
    get supabase() {
      return REC.supabaseClient;
    },

    async signUp(email, password, meta) {
      const { data, error } = await REC.supabaseClient.auth.signUp({
        email,
        password,
        options: { data: meta || {} },
      });
      if (error) throw error;
      return data;
    },

    async signIn(email, password) {
      const { data, error } = await REC.supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const user = data.user;
      const profile = await REC.auth.getProfile(user.id);
      REC.auth.cacheUser(user, profile);
      return { user, profile };
    },

    /** Send a password-reset link to the owner of the email. */
    async resetPassword(email) {
      const redirectTo = window.location.origin + "/account.html";
      const { error } = await REC.supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
    },

    /** Set a new password (used after opening a recovery link). */
    async updatePassword(newPassword) {
      const { error } = await REC.supabaseClient.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },

    async signOut() {
      const { error } = await REC.supabaseClient.auth.signOut();
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(SESSION_KEY);
      if (error && !error.message.includes("No session")) throw error;
    },

    async getProfile(userId) {
      const { data, error } = await REC.supabaseClient
        .from("profiles")
        .select("id, full_name, phone, avatar_url, role, created_at")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },

    async getSession() {
      return REC.supabaseClient.auth.getSession();
    },

    cacheUser(user, profile) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user, profile }));
      localStorage.setItem(SESSION_KEY, String(Date.now()));
    },

    currentUser() {
      try {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    isAdmin() {
      const cur = REC.auth.currentUser();
      return !!(cur && cur.profile && cur.profile.role === "admin");
    },

    async refreshProfile() {
      const cur = REC.auth.currentUser();
      if (!cur || !cur.user) return cur;
      const profile = await REC.auth.getProfile(cur.user.id);
      REC.auth.cacheUser(cur.user, profile);
      return { user: cur.user, profile };
    },

    /** Guard an admin page: redirect to login if not authorized. */
    requireAdmin(redirectTo) {
      const cur = REC.auth.currentUser();
      const target = redirectTo || "login.html";
      if (!cur || !cur.user) {
        location.href = target;
        return false;
      }
      return true;
    },
  };

  win.REC = REC;
})(window);