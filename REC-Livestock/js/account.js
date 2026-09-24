/* ============================================================
   REC — Account (login / register / track order)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;

  function $(s, r) {
    return (r || document).querySelector(s);
  }

  function show(id) {
    ["view_guest", "view_login", "view_register", "view_track", "view_profile", "view_forgot", "view_recovery"].forEach((v) => {
      const el = $('#' + v);
      if (el) el.style.display = v === id ? "block" : "none";
    });
  }

  async function detectRecovery() {
    try {
      if (!REC.supabaseClient || !REC.supabaseClient.auth.getSession) return false;
      const { data } = await REC.supabaseClient.auth.getSession();
      return !!(data && data.session && data.session.user && data.session.user.aud === "authenticated" && location.hash && /type=recovery/i.test(location.hash));
    } catch (e) {
      return false;
    }
  }

  function renderProfile() {
    const cur = REC.auth.currentUser();
    const user = cur && cur.user;
    const profile = (cur && cur.profile) || {};
    if (!user) {
      show("view_login");
      const tr = $("#tab_row");
      if (tr) tr.style.display = "";
      return;
    }
    const tr = $("#tab_row");
    if (tr) tr.style.display = "none";
    show("view_profile");
    const box = $("#profile_box");
    box.innerHTML =
      "<h3>Hi, " + UI.esc(profile.full_name || user.user_metadata && user.user_metadata.full_name || user.email || "there") + "</h3>" +
      '<div class="sum-row"><span>Email</span><span>' + UI.esc(user.email || "") + "</span></div>" +
      '<div class="sum-row"><span>Phone</span><span>' + UI.esc(profile.phone || (user.user_metadata && user.user_metadata.phone) || "—") + "</span></div>" +
      '<div class="sum-row"><span>Member since</span><span>' + UI.formatDate(profile.created_at || user.created_at) + "</span></div>" +
      '<div style="display:flex;gap:.7rem;flex-wrap:wrap;margin-top:1.2rem">' +
      '<button type="button" class="btn btn-outline btn-sm" id="signout_btn">Sign Out</button>' +
      "</div>" +
      '<h4 style="margin:1.8rem 0 .6rem">Your Orders</h4><div id="profile_orders"></div>';

    $("#signout_btn").addEventListener("click", async () => {
      try {
        await REC.auth.signOut();
        UI.toast("Signed out", "success");
        setTimeout(() => window.location.reload(), 400);
      } catch (err) {
        UI.toast(err.message || "Sign out failed", "error");
      }
    });

    loadOrders(user);
  }

  async function loadOrders(user) {
    const host = $("#profile_orders");
    if (!host) return;
    const sb = REC.orders.sb();
    if (!sb) {
      host.innerHTML = '<p style="font-size:.9rem;color:var(--muted)">Order history is available once Supabase is connected.</p>';
      return;
    }
    host.innerHTML = '<p style="font-size:.9rem;color:var(--muted)">Loading your orders…</p>';
    try {
      const { data: custRow } = await sb.from("customers").select("id").eq("user_id", user.id).maybeSingle();
      let orders = [];
      if (custRow) {
        const { data, error } = await sb
          .from("orders")
          .select("order_number, status, payment_status, total, created_at, items")
          .eq("customer_id", custRow.id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) throw error;
        orders = data || [];
      }
      renderOrders(host, orders);
    } catch (err) {
      host.innerHTML = '<p style="font-size:.9rem;color:var(--muted)">Could not load your orders: ' + UI.esc(err.message) + "</p>";
    }
  }

  function renderOrders(host, orders) {
    if (!orders || !orders.length) {
      host.innerHTML =
        '<div class="empty-state"><p>No orders yet. Order history links to any account you were signed into at checkout.</p></div>' +
        '<div style="text-align:center;margin-top:1rem"><a class="btn btn-gold btn-sm" href="shop.html">Start Shopping</a></div>';
      return;
    }
    const statusMap = {
      pending: ["badge-gold", "Pending"],
      confirmed: ["badge-green", "Confirmed"],
      processing: ["badge-gold", "Processing"],
      ready: ["badge-green", "Ready"],
      "out for delivery": ["badge-green", "Out for Delivery"],
      completed: ["badge-green", "Completed"],
      cancelled: ["badge-red", "Cancelled"],
    };
    host.innerHTML = orders
      .map((o) => {
        const [cls, label] = statusMap[o.status] || ["bg-gray", o.status || "Pending"];
        const pay = o.payment_status === "paid" ? '<span class="badge badge-green">Paid</span>' : '<span class="badge badge-gold">' + UI.esc(o.payment_status || "unpaid") + "</span>";
        return (
          '<div class="pd-order-panel">' +
          '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:.4rem">' +
          "<h3>" + UI.esc(o.order_number) + "</h3>" +
          '<span class="badge ' + cls + '">' + UI.esc(label) + "</span>" +
          "</div>" +
          '<div class="sum-row"><span>Placed</span><span>' + UI.formatDate(o.created_at) + "</span></div>" +
          '<div class="sum-row"><span>Total</span><span>' + UI.money(o.total) + "</span></div>" +
          '<div class="sum-row"><span>Payment</span><span>' + pay + "</span></div>" +
          "</div>"
        );
      })
      .join("");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    REC.initSupabase();
    const forms = ["login", "register", "track"];

    // Already signed in? Show the profile view.
    const cur = REC.auth && REC.auth.currentUser();
    if (cur && cur.user) {
      await REC.auth.refreshProfile && REC.auth.refreshProfile();
      renderProfile();
    } else {
      // User landed here from a password-reset email.
      const recovery = await detectRecovery();
      if (recovery) {
        const tr = $("#tab_row");
        if (tr) tr.style.display = "none";
        show("view_recovery");
      }
    }

    // Tabs
    const tabs = $$('.tab-btn').forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const target = btn.getAttribute("data-tab");
        show("view_" + target);
      });
    });

    // Forgot password toggle
    const forgotLink = $("#forgot_link");
    if (forgotLink) forgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      show("view_forgot");
    });
    const forgotBack = $("#forgot_back");
    if (forgotBack) forgotBack.addEventListener("click", (e) => {
      e.preventDefault();
      show("view_login");
    });

    // Send reset link
    $("#forgot_form") &&
      $("#forgot_form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = $("#forgot_email").value.trim();
        if (!email) return UI.toast("Enter your account email address", "warning");
        if (!REC.isSupabaseConfigured() || !REC.supabaseClient || !REC.auth.resetPassword) {
          UI.toast("Password reset is enabled once Supabase accounts are connected.", "error");
          return;
        }
        const btn = $("#forgot_submit");
        btn.disabled = true;
        btn.textContent = "Sending…";
        try {
          await REC.auth.resetPassword(email);
          UI.toast("Reset link sent — check your inbox.", "success");
          btn.disabled = false;
          btn.textContent = "Resend Reset Link";
        } catch (err) {
          UI.toast(err.message || "Could not send reset link", "error");
          btn.disabled = false;
          btn.textContent = "Send Reset Link";
        }
      });

    // Set new password after recovery email click
    $("#recovery_form") &&
      $("#recovery_form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const pw = $("#recovery_password").value;
        const confirm = $("#recovery_confirm").value;
        if (pw.length < 6) return UI.toast("Password must be at least 6 characters", "warning");
        if (pw !== confirm) return UI.toast("Passwords do not match", "warning");
        if (!REC.isSupabaseConfigured() || !REC.supabaseClient || !REC.auth.updatePassword) {
          UI.toast("Password recovery is enabled once Supabase accounts are connected.", "error");
          return;
        }
        const btn = $("#recovery_submit");
        btn.disabled = true;
        btn.textContent = "Updating…";
        try {
          await REC.auth.updatePassword(pw);
          await REC.auth.signOut();
          UI.toast("Password updated — please sign in.", "success");
          const tr = $("#tab_row");
          if (tr) tr.style.display = "";
          show("view_login");
        } catch (err) {
          UI.toast(err.message || "Could not update password", "error");
        }
        btn.disabled = false;
        btn.textContent = "Update Password";
      });

    // Login
    $("#login_form") &&
      $("#login_form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = $("#login_submit");
        btn.disabled = true;
        btn.textContent = "Signing in…";
        try {
          const email = $("#login_email").value.trim();
          const password = $("#login_password").value;
          if (!REC.isSupabaseConfigured() || !REC.supabaseClient) {
            throw new Error("Accounts are enabled once Supabase is connected. For now, use guest checkout.");
          }
          await REC.auth.signIn(email, password);
          UI.toast("Welcome back!", "success");
          renderProfile();
        } catch (err) {
          UI.toast(err.message || "Login failed", "error");
          btn.disabled = false;
          btn.textContent = "Sign In";
        }
      });

    // Register
    $("#register_form") &&
      $("#register_form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = $("#register_submit");
        btn.disabled = true;
        btn.textContent = "Creating account…";
        try {
          const name = $("#register_name").value.trim();
          const email = $("#register_email").value.trim();
          const phone = $("#register_phone").value.trim();
          const password = $("#register_password").value;
          if (!REC.isSupabaseConfigured() || !REC.supabaseClient) {
            throw new Error("Accounts are enabled once Supabase is connected. For now, use guest checkout.");
          }
          const { data } = await REC.auth.signUp(email, password, {
            full_name: name,
            phone,
          });
          UI.toast("Account created! Check your email to confirm.", "success");
          btn.disabled = false;
          btn.textContent = "Create Account";
        } catch (err) {
          UI.toast(err.message || "Registration failed", "error");
          btn.disabled = false;
          btn.textContent = "Create Account";
        }
      });

    // Track order
    $("#track_form") &&
      $("#track_form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const ref = $("#track_ref").value.trim();
        if (!ref) return UI.toast("Enter your order reference", "warning");
        const btn = $("#track_submit");
        btn.disabled = true;
        btn.textContent = "Searching…";
        try {
          const order = await REC.orders.track(ref.toUpperCase());
          btn.disabled = false;
          btn.textContent = "Track Order";
          const host = $("#track_result");
          if (!order) {
            host.innerHTML =
              '<div class="empty-state"><h4>Order not found</h4><p>Double-check your reference like <strong>REC-2026-000001</strong>.</p></div>';
            return;
          }
          const statusMap = {
            pending: ["badge-gold", "Pending"],
            confirmed: ["badge-green", "Confirmed"],
            processing: ["badge-gold", "Processing"],
            ready: ["badge-green", "Ready"],
            "out for delivery": ["badge-green", "Out for Delivery"],
            completed: ["badge-green", "Completed"],
            cancelled: ["badge-red", "Cancelled"],
          };
          const [cls, label] = statusMap[order.status] || ["bg-gray", order.status || "Pending"];
const isPickup = order.fulfillment_method === "pickup";
            const destLabel = isPickup
              ? "Pickup station"
              : "Delivery to";
            const destValue = isPickup
              ? order.pickup_station_name || "Pickup"
              : [order.state, order.lga].filter(Boolean).join(", ") || "—";
            host.innerHTML =
              '<div class="pd-order-panel">' +
              "<h3>Order " + UI.esc(order.order_number) + "</h3>" +
              '<div class="sum-row"><span>Status</span><span class="badge ' + cls + '">' + UI.esc(label) + "</span></div>" +
              '<div class="sum-row"><span>Placed</span><span>' + UI.formatDate(order.created_at) + "</span></div>" +
              '<div class="sum-row"><span>Total</span><span>' + (REC.ui.money(order.total)) + "</span></div>" +
              '<div class="sum-row"><span>' + destLabel + '</span><span>' + UI.esc(destValue) + "</span></div>" +
            '<div style="display:flex;gap:.7rem;flex-wrap:wrap;margin-top:1rem">' +
            '<a class="btn btn-whatsapp btn-sm" href="' + REC.whatsapp.general("Hello REC, I\u0027m tracking order " + (order.order_number || "")) + '" target="_blank" rel="noopener">' + UI.icon("i-whatsapp") + "Ask on WhatsApp</a>" +
            "</div></div>";
        } catch (err) {
          btn.disabled = false;
          btn.textContent = "Track Order";
          UI.toast(err.message || "Tracking failed", "error");
        }
      });
  });

  function $$(s, r) {
    return Array.from((r || document).querySelectorAll(s));
  }
})(window);