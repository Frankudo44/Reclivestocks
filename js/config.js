/* ============================================================
   REC — Configuration
   ------------------------------------------------------------
   PUBLIC Supabase URL + anon key are safe for the browser
   (protected by RLS). NEVER place the service-role key here.

   Option A (recommended for Vercel): supply these as build-time
   environment variables and inject at deploy time via a small
   build step that writes this file, OR use the inline values below.
   Option B: edit SUPABASE_URL / SUPABASE_ANON_KEY directly.
   ============================================================ */
(function (win) {
  "use strict";

  const REC = (win.REC = win.REC || {});

  // Injected at build time via Vercel env (optional).
  // Falls back to values edited in this file for local dev.
  REC.env = REC.env || {};

  REC.config = {
    supabaseUrl:
      (typeof process !== "undefined" && process.env.SUPABASE_URL) ||
      REC.env.SUPABASE_URL ||
      "https://iyyxbvfqrfvdatkfvtyx.supabase.co",
    supabaseAnonKey:
      (typeof process !== "undefined" && process.env.SUPABASE_ANON_KEY) ||
      REC.env.SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5eXhidmZxcmZ2ZGF0a2Z2dHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzQxNDQsImV4cCI6MjEwNTc1MDE0NH0.xBqeJY3QoRlSJYL6J8-EocvZGLn5eaMulMl97aO9nFY",

    appName: "REC Livestock & Agro Farms",
    motto: "Growing Excellence, Feeding the Future.",
    location: "Abia, Nigeria",
    phone: "+234 813 504 2997",
    phoneRaw: "+2348135042997",
    whatsapp: "+2347071850599",
    email: "reclivestockagrofarms@gmail.com",
    website: "",

    storageBucket: "rec-media",
    site: "reclivestock.ng",

    // Paystack (public key is safe in the browser; the SECRET key lives
    // in the Vercel serverless function api/verify-payment.js only).
    paystackKey:
      (typeof process !== "undefined" && process.env.PAYSTACK_PUBLIC_KEY) ||
      REC.env.PAYSTACK_PUBLIC_KEY ||
      "",
    paystackVerifyUrl: "/api/verify-payment",
  };

  REC.isSupabaseConfigured = function () {
    return (
      REC.config.supabaseUrl.indexOf("YOUR_SUPABASE") === -1 &&
      REC.config.supabaseAnonKey.indexOf("YOUR_SUPABASE") === -1
    );
  };

  REC.getImage = function (path) {
    return path && !path.startsWith("data:") && !path.startsWith("blob:")
      ? path
      : path;
  };
})(window);