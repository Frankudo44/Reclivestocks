/* ============================================================
   REC — Product reviews (ratings & comments)
   Reads approved reviews from Supabase; falls back to a small
   demo set so the UI is browseable in development.
   Submitting a review requires a signed-in customer.
   Reviews are NOT published until an admin approves them.
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;
  const sb = () => REC.supabaseClient;

  const DEMO_REVIEWS = [
    {
      id: "rv1",
      product_id: "demo",
      author_name: "Adaeze O.",
      rating: 5,
      comment:
        "Sample review — the birds arrived healthy and on time. Great service from start to finish.",
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      sample: true,
    },
    {
      id: "rv2",
      product_id: "demo",
      author_name: "Chinedu E.",
      rating: 4,
      comment:
        "Sample review — good quality and fair pricing. Delivery took a little longer than expected.",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      sample: true,
    },
    {
      id: "rv3",
      product_id: "demo",
      author_name: "Fatima B.",
      rating: 5,
      comment:
        "Sample review — recommended. Fresh products and easy WhatsApp contact.",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      sample: true,
    },
  ];

  function stars(rating, opts) {
    opts = opts || {};
    const n = Math.max(0, Math.min(5, Number(rating) || 0));
    return Array.from({ length: 5 }, (_, i) => {
      const style = [];
      if (opts.size) style.push("width:" + opts.size + "px;height:" + opts.size + "px");
      if (i < n) style.push("opacity:1");
      else if (opts.dimEmpty) style.push("opacity:.22");
      else style.push("opacity:1;color:var(--line-dark)");
      return UI.icon("i-star").replace("<svg", '<svg style="' + style.join(";") + '"');
    }).join("");
  }

  function starsRow(rating, opts) {
    opts = opts || {};
    return (
      '<span class="stars' +
      (opts.cls ? " " + opts.cls : "") +
      '" aria-label="Rated ' +
      rating +
      " out of 5\">" +
      stars(rating, opts) +
      "</span>"
    );
  }

  function demoReviews(productId) {
    return DEMO_REVIEWS.map((r) => ({ ...r, product_id: productId }));
  }

  async function getReviews(productId) {
    const client = sb();
    if (client) {
      const { data, error } = await client
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("approved", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) return data;
      if (error) console.warn("Reviews fetch failed:", error.message);
      return [];
    }
    return demoReviews(productId);
  }

  async function getStats(productId) {
    const client = sb();
    if (client) {
      const { data, error } = await client
        .from("product_rating_stats")
        .select("review_count, average_rating")
        .eq("product_id", productId)
        .maybeSingle();
      if (!error && data) {
        return {
          review_count: Number(data.review_count || 0),
          average_rating: Number(data.average_rating || 0),
        };
      }
    }
    // Demo / fallback: compute from fetched reviews
    const list = await getReviews(productId);
    if (!list.length) return { review_count: 0, average_rating: 0 };
    const avg = list.reduce((s, r) => s + Number(r.rating || 0), 0) / list.length;
    return { review_count: list.length, average_rating: Math.round(avg * 10) / 10 };
  }

  function currentSession() {
    if (!REC.supabaseClient) return null;
    const cur = REC.auth && REC.auth.currentUser();
    return cur && cur.user ? cur.user : null;
  }

  async function myReview(productId) {
    const user = currentSession();
    if (!user) return null;
    const { data, error } = await sb()
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return null;
    return data || null;
  }

  async function submit(productId, rating, comment) {
    const user = currentSession();
    if (!user) throw new Error("Please sign in to write a review.");
    const name =
      (REC.auth.currentUser() && REC.auth.currentUser().profile &&
        REC.auth.currentUser().profile.full_name) ||
      "REC Customer";
    const { data, error } = await sb()
      .from("product_reviews")
      .insert({
        product_id: productId,
        user_id: user.id,
        author_name: name,
        rating: Math.max(1, Math.min(5, Number(rating) || 5)),
        comment: String(comment || "").trim(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function remove(reviewId) {
    const { error } = await sb().from("product_reviews").delete().eq("id", reviewId);
    if (error) throw error;
  }

  /* ---------- Render helpers ---------- */

  function summary(stats) {
    const avg = Number((stats && stats.average_rating) || 0);
    const count = Number((stats && stats.review_count) || 0);
    if (!count) {
      return (
        '<span class="rv-summary-avg">No ratings yet</span>' +
        '<span class="rv-summary-count">Be the first to review this product.</span>'
      );
    }
    return (
      '<span class="rv-summary-avg">' +
      avg.toFixed(1) +
      "</span>" +
      starsRow(avg, { cls: "rv-summary-stars", size: 16 }) +
      '<span class="rv-summary-count">Based on ' +
      count +
      " review" +
      (count === 1 ? "" : "s") +
      "</span>"
    );
  }

  function card(r) {
    return (
      '<div class="review-card' +
      (r.sample ? " sample" : "") +
      (r.featured ? " featured" : "") +
      '">' +
      '<div class="rv-user">' +
      '<span class="rv-avatar">' + UI.esc(UI.initials(r.author_name || "R")) + "</span>" +
      '<div class="rv-user-meta">' +
      '<strong>' + UI.esc(r.author_name || "Customer") + "</strong>" +
      '<span class="rv-date">' + UI.formatDate(r.created_at) + "</span>" +
      "</div>" +
      (r.featured ? '<span class="badge badge-gold">Featured</span>' : "") +
      (r.sample ? '<span class="badge badge-green">Sample</span>' : "") +
      "</div>" +
      '<div class="rv-stars-row">' + starsRow(r.rating, { dimEmpty: true, size: 15 }) + "</div>" +
      '<p class="rv-comment">' + UI.esc(r.comment || "") + "</p>" +
      "</div>"
    );
  }

  function empty() {
    return (
      '<div class="empty-state">' +
      '<div class="e-icon">' + UI.icon("i-quote") + "</div>" +
      "<h4>No reviews yet</h4>" +
      "<p>No customer reviews for this product yet. Be the first to share your experience.</p>" +
      "</div>"
    );
  }

  function formPanel(state) {
    if (state && state.error) {
      return (
        '<div class="rv-form-box">' +
        "<strong>Write a Review</strong>" +
        '<p style="font-size:.9rem;color:var(--muted);margin-top:.4rem">' + UI.esc(state.error) + "</p>" +
        "</div>"
      );
    }
    if (state && state.unauth) {
      return (
        '<div class="rv-form-box">' +
        "<strong>Write a Review</strong>" +
        '<p style="font-size:.9rem;color:var(--muted);margin-top:.4rem">Sign in to rate this product and share your experience with other customers.</p>' +
        '<div style="display:flex;gap:.7rem;margin-top:1rem;flex-wrap:wrap">' +
        '<a class="btn btn-primary btn-sm" href="account.html">Sign In</a>' +
        '<a class="btn btn-outline btn-sm" href="account.html">Create Account</a>' +
        "</div>" +
        "</div>"
      );
    }
    if (state && state.pending) {
      return (
        '<div class="rv-form-box">' +
        "<strong>Thanks for your review!</strong>" +
        '<p style="font-size:.9rem;color:var(--muted);margin-top:.4rem">Your rating and comment have been submitted and are awaiting approval.</p>' +
        '<button type="button" class="btn btn-outline btn-sm" id="review_delete" style="margin-top:1rem">' +
        UI.icon("i-trash") + " Delete My Review</button>" +
        "</div>"
      );
    }
    return (
      '<div class="rv-form-box">' +
      "<strong>Write a Review</strong>" +
      '<p style="font-size:.86rem;color:var(--muted);margin:.3rem 0 0">Rate this product (1–5 stars) and tell others what you think.</p>' +
      '<div class="field" style="margin-top:.9rem">' +
      '<label for="review_rating">Your rating</label>' +
      '<div class="rate-input" id="rate_input" role="radiogroup" aria-label="Rating">' +
      '<input type="hidden" id="review_rating" value="0"/>' +
      Array.from({ length: 5 }, (_, i) =>
        '<button type="button" class="rate-star" data-rate="' + (i + 1) + '" aria-label="' + (i + 1) + ' star' +
        (i ? "s" : "") + '" aria-pressed="false">' + stars(1, { dimEmpty: true, size: 26 }) + "</button>"
      ).join("") +
      "</div>" +
      "</div>" +
      '<div class="field">' +
      '<label for="review_comment">Your comment</label>' +
      '<textarea class="textarea" id="review_comment" rows="4" maxlength="1000" placeholder="Share your experience with this product…"></textarea>' +
      "</div>" +
      '<button type="button" class="btn btn-primary" id="review_submit">' +
      UI.icon("i-star") + " Submit Review</button>" +
      '<p class="rv-mod-note">' + UI.icon("i-shield") + ' Reviews are checked by our team before they are published.</p>' +
      "</div>"
    );
  }

  REC.reviews = {
    getReviews,
    getStats,
    myReview,
    submit,
    remove,
    summary,
    card,
    empty,
    formPanel,
    stars,
    starsRow,
    DEMO_REVIEWS,
  };

  win.REC = REC;
})(window);