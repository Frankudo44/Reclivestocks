/* ============================================================
   REC — Bulk quote request modal (product page)
   Inserts into bulk_quote_requests (anon insert allowed via RLS).
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;

  let currentProduct = null;

  function buildModal(p) {
    let modal = document.getElementById("bq_modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "modal-root";
      modal.id = "bq_modal";
      document.body.appendChild(modal);
    }
    const cur = REC.auth && typeof REC.auth.currentUser === "function" ? REC.auth.currentUser() : null;
    const profile = cur ? cur.profile : null;
    modal.innerHTML =
      '<div class="modal-backdrop" data-close></div>' +
      '<div class="modal-card" role="dialog" aria-modal="true">' +
      '<button class="modal-close" data-close aria-label="Close"><svg><use href="assets/icons/sprite.svg#i-close"></use></svg></button>' +
      "<h3>Request a Bulk Quote</h3>" +
      '<p class="bq-intro">Tell us what you need and roughly how many. We will reply with a quote for <strong id="bq_product_name"></strong>.</p>' +
      '<div class="bq-grid">' +
      '<div class="field"><label for="bqf_name">Full name *</label><input class="input" id="bqf_name" value="' + UI.esc((profile && profile.full_name) || "") + '" autocomplete="name"/></div>' +
      '<div class="field"><label for="bqf_phone">Phone / WhatsApp *</label><input class="input" id="bqf_phone" type="tel" value="' + UI.esc((profile && profile.phone) || "") + '" autocomplete="tel"/></div>' +
      '<div class="field"><label for="bqf_email">Email</label><input class="input" id="bqf_email" type="email" value="' + UI.esc((profile && profile.email) || "") + '" autocomplete="email"/></div>' +
      '<div class="field"><label for="bqf_qty">Estimated quantity *</label><input class="input" id="bqf_qty" type="number" min="1" value="' + Math.max(1, Number(p.minimum_order_quantity || 1)) + '"/></div>' +
      '<div class="field"><label for="bqf_date">Preferred date</label><input class="input" id="bqf_date" type="date"/></div>' +
      '<div class="field"><label for="bqf_location">Delivery location</label><input class="input" id="bqf_location" placeholder="e.g. Aba, Abia"/></div>' +
      "</div>" +
      '<div class="field"><label for="bqf_req">Requirements</label><textarea class="textarea" id="bqf_req" rows="3" placeholder="e.g. 50 ISA Brown layers, vaccinated, split delivery"></textarea></div>' +
      '<div class="modal-actions"><button class="btn btn-primary" id="bqf_submit">Submit Request</button>' +
      '<button class="btn btn-outline" data-close>Cancel</button></div></div>';
    document.getElementById("bq_product_name").textContent = p.name || "this product";
    modal.classList.add("open");
    modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => modal.classList.remove("open")));
    document.getElementById("bqf_submit").addEventListener("click", submitQuote);
  }

  async function submitQuote() {
    const get = (id) => document.getElementById(id);
    const name = get("bqf_name").value.trim();
    const phone = get("bqf_phone").value.trim();
    const qty = Number(get("bqf_qty").value || 0);
    if (!name || !phone) return UI.toast("Name and phone are required", "error");
    if (qty < 1) return UI.toast("Enter a quantity of at least 1", "error");
    const client = REC.initSupabase();
    if (!client || !REC.isSupabaseConfigured()) return UI.toast("Supabase is not configured yet.", "error");
    const payload = {
      product_id: currentProduct ? currentProduct.id : null,
      product_name: currentProduct ? currentProduct.name : null,
      name,
      phone,
      email: get("bqf_email").value.trim() || null,
      quantity: qty,
      preferred_date: get("bqf_date").value || null,
      location: get("bqf_location").value.trim() || null,
      requirements: get("bqf_req").value.trim() || null,
      source: "quote",
    };
    const btn = get("bqf_submit");
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      const { error } = await client.from("bulk_quote_requests").insert(payload);
      if (error) throw error;
      document.getElementById("bq_modal").classList.remove("open");
      UI.toast("Request submitted — we will reply with your quote shortly!", "success");
    } catch (e) {
      UI.toast("Could not submit: " + e.message, "error");
      btn.disabled = false;
      btn.textContent = "Submit Request";
    }
  }

  async function onOpen() {
    const id = UI.qs().get("id");
    const btn = document.getElementById("pd_bulk_quote");
    if (!id || !btn) return;
    btn.disabled = true;
    btn.textContent = "Loading…";
    try {
      const p = await REC.products.getProduct(id);
      if (p) {
        currentProduct = p;
        buildModal(p);
      } else {
        UI.toast("Product not found", "error");
      }
    } catch (e) {
      UI.toast("Could not load product", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Request Bulk Quote";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("click", (e) => {
      if (e.target.closest("#pd_bulk_quote")) onOpen();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const m = document.getElementById("bq_modal");
        if (m) m.classList.remove("open");
      }
    });
  });
})(window);