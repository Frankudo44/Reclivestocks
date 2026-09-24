/* ============================================================
   REC — Supabase client (anon key only)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});

  REC.supabaseClient = null;

  REC.initSupabase = function () {
    if (REC.supabaseClient) return REC.supabaseClient;
    if (!REC.isSupabaseConfigured()) {
      // Graceful dev mode: pages still render with demo/offline data.
      return null;
    }
    if (!win.supabase || !win.supabase.createClient) {
      // The supabase-js UMD bundle has not been loaded.
      return null;
    }
    REC.supabaseClient = win.supabase.createClient(
      REC.config.supabaseUrl,
      REC.config.supabaseAnonKey
    );
    return REC.supabaseClient;
  };
})(window);