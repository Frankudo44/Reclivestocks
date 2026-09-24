/* ============================================================
   REC — Product detail page
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;

  function $(s, r) {
    return (r || document).querySelector(s);
  }

  async function init() {
    REC.initSupabase();
    const id = UI.qs().get("id");
    if (!id) {
      $("#pd_missing") && ($("#pd_missing").style.display = "flex");
      return;
    }
    const product = await REC.products.getProduct(id);
    if (!product) {
      $("#pd_missing") && ($("#pd_missing").style.display = "flex");
      return;
    }
    DOCUMENT_TITLE(product);
    render(product);
    renderRelated(product);
    bindQty();
    bindActions(product);
    initReviews(product);
    UI.initReveal();
  }

  function DOCUMENT_TITLE(p) {
    document.title = p.name + " | REC Livestock & Agro Farms";
    setMeta("og:title", p.name + " | REC Livestock & Agro Farms");
    setMeta("twitter:title", p.name + " | REC Livestock & Agro Farms");
    setMeta("og:description", (p.description || "Buy " + p.name + " from REC Livestock & Agro Farms.").slice(0, 200));
    setMeta("twitter:description", (p.description || "Buy " + p.name + " from REC Livestock & Agro Farms.").slice(0, 200));
    setMeta("og:image", toAbs(p.image || REC.products.PLACEHOLDER));
    setMeta("twitter:image", toAbs(p.image || REC.products.PLACEHOLDER));
    setMetaNode("og:url", window.location.href);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = window.location.href;

    injectProductJsonLd(p);
  }

  function setMeta(prop, content) {
    let el = document.querySelector('meta[property="' + prop + '"], meta[name="' + prop + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(prop.indexOf("og:") === 0 ? "property" : "name", prop);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function setMetaNode(prop, content) {
    const el = document.querySelector('meta[property="' + prop + '"]');
    if (el) el.setAttribute("content", content);
  }

  function toAbs(src) {
    if (!src) return "https://reclivestock.ng/assets/images/placeholder-product.svg";
    return /^https?:\/\//.test(src) ? src : "https://reclivestock.ng/" + src.replace(/^\//, "");
  }

  function injectProductJsonLd(p) {
    const prev = document.getElementById("pd_jsonld");
    if (prev) prev.remove();
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      image: toAbs(p.image || REC.products.PLACEHOLDER),
      description: p.description || "",
      sku: p.id,
      category: p.category_name || "Farm Product",
      brand: { "@type": "Brand", name: "REC Livestock & Agro Farms" },
      offers: {
        "@type": "Offer",
        url: window.location.href,
        priceCurrency: "NGN",
        price: String(Number(p.price) || 0),
        availability: p.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    };
    if (p.reviews_stats && p.reviews_stats.avg && p.reviews_stats.count) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: String(Number(p.reviews_stats.avg).toFixed(1)),
        reviewCount: String(p.reviews_stats.count),
      };
    }
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "pd_jsonld";
    el.textContent = JSON.stringify(schema);
    document.head.appendChild(el);
  }

  function render(p) {
    const mainImg = $("#pd_main_img");
    if (mainImg) {
      mainImg.src = p.image || REC.products.PLACEHOLDER;
      mainImg.alt = p.name;
    }

    $("#pd_cat").textContent = p.category_name || "Farm Product";
    $("#pd_name").textContent = p.name;
    $("#pd_price").textContent = UI.money(p.price);
    $("#pd_unit").textContent = p.unit || "";
    $("#pd_desc").textContent = p.description || "";
    $("#pd_meta_min").textContent = "Minimum order: " + p.minimum_order_quantity + (p.unit ? " " + p.unit : "");
    $("#pd_meta_delivery").textContent = p.delivery_info || "Delivery across Nigeria (fee per location).";

    // Stock badge
    const stockEl = $("#pd_stock");
    if (stockEl) {
      if (p.in_stock) {
        stockEl.className = "badge badge-green";
        stockEl.textContent = p.low_stock ? "Low stock — order soon" : "In stock";
      } else {
        stockEl.className = "badge badge-red";
        stockEl.textContent = "Out of stock";
      }
    }

    // Attributes (livestock: breed, age, sex, weight)
    const attrs = [];
    if (p.breed) attrs.push(["Breed / Type", p.breed]);
    if (p.age) attrs.push(["Age", p.age]);
    if (p.sex) attrs.push(["Sex", p.sex]);
    if (p.weight) attrs.push(["Weight", p.weight]);
    if (attrs.length) {
      const host = $("#pd_attributes");
      host.innerHTML = attrs
        .map(
          ([k, v]) =>
            '<div class="pd-meta">' +
            UI.icon("i-tag").replace('<svg', '<svg width="18" height="18"') +
            "<div><strong>" + UI.esc(k) + "</strong>" + UI.esc(v) + "</div></div>"
        )
        .join("");
    }

    // Gallery
    const thumbs = $("#pd_thumbs");
    if (thumbs) {
      const gallery = p.gallery && p.gallery.length ? p.gallery : [p.image || REC.products.PLACEHOLDER];
      thumbs.innerHTML = gallery
        .slice(0, 4)
        .map(
          (g, i) =>
            '<button type="button" class="' + (i === 0 ? "active" : "") + '" data-thumb>' +
            '<img src="' + UI.esc(g) + '" alt="' + UI.esc(p.name) + " view " + (i + 1) + '" width="80" height="80" loading="lazy"/>' +
            "</button>"
        )
        .join("");
      thumbs.querySelectorAll("[data-thumb]").forEach((btn) => {
        btn.addEventListener("click", () => {
          thumbs.querySelectorAll("[data-thumb]").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          if (mainImg) mainImg.src = btn.querySelector("img").src;
        });
      });
    }

    // WhatsApp enquiry
    const waEnquiry = $("#pd_wa_enquiry");
    if (waEnquiry) waEnquiry.href = REC.whatsapp.product(p.name);
    const waShare = $("#pd_wa_share");
    if (waShare) waShare.href = REC.whatsapp.general("Check out " + p.name + " on the REC website: " + window.location.href);

    // Order controls depend on policy
    if (p.online_orderable === false) {
      $("#pd_order_on").style.display = "none";
      $("#pd_order_off").style.display = "block";
      $("#pd_qty_wrap").style.display = "none";
    } else {
      $("#pd_order_on").style.display = "block";
      $("#pd_order_off").style.display = "none";
      if (p.in_stock) {
        $("#pd_add_cart").disabled = false;
        $("#pd_buy_now").disabled = false;
      } else {
        $("#pd_add_cart").disabled = true;
        $("#pd_buy_now").disabled = true;
      }
      const moq = Math.max(1, Number(p.minimum_order_quantity || 1));
      $("#pd_qty").value = moq;
      $("#pd_qty").min = moq;
      $("#pd_qty").max = p.stock_quantity || 99999;
      $("#pd_add_cart").dataset.product = JSON.stringify({
        product_id: p.id, name: p.name, price: p.price, unit: p.unit, image: p.image,
        stock_quantity: p.stock_quantity,
      });
    }

    // Meta tags
    const meta = $("#pd_rd_link");
    if (meta) meta.value = window.location.href;
  }

  function bindQty() {
    const dec = $("#pd_qty_dec");
    const inc = $("#pd_qty_inc");
    const input = $("#pd_qty");
    if (!input) return;
    const step = (d) => {
      let v = Number(input.value || 1) + d;
      const min = Number(input.min || 1);
      const max = Number(input.max || 99999);
      if (v < min) v = min;
      if (v > max) v = max;
      input.value = v;
    };
    if (dec) dec.addEventListener("click", () => step(-1));
    if (inc) inc.addEventListener("click", () => step(1));
    input.addEventListener("change", () => {
      let v = Number(input.value || 1);
      const min = Number(input.min || 1);
      const max = Number(input.max || 99999);
      if (v < min) v = min;
      if (v > max) v = max;
      input.value = v;
    });
  }

  function bindActions(p) {
    const addBtn = $("#pd_add_cart");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const item = JSON.parse(addBtn.dataset.product);
        item.quantity = Number($("#pd_qty").value || 1);
        REC.cart.add(item);
      });
    }
    const buyBtn = $("#pd_buy_now");
    if (buyBtn) {
      buyBtn.addEventListener("click", () => {
        const item = JSON.parse(addBtn.dataset.product);
        item.quantity = Number($("#pd_qty").value || 1);
        REC.cart.add(item);
        setTimeout(() => (window.location.href = "cart.html"), 400);
      });
    }
  }

  async function renderRelated(p) {
    const host = $("#related_products");
    if (!host) return;
    const items = await REC.products.getRelated(p, 4);
    host.innerHTML = items.map((x) => REC.render.productCard(x)).join("");
    UI.initReveal();
    REC.render.bindCommonActions(REC.products.getProduct);
  }

  /* ---------- Reviews ---------- */
  async function initReviews(p) {
    const host = $("#rv_list");
    const sumEl = $("#rv_summary");
    const formEl = $("#rv_form_panel");
    if (!host && !formEl) return;

    const client = REC.supabaseClient;
    const supabaseOn = !!(REC.isSupabaseConfigured() && client);

    // Summary + list
    if (sumEl) sumEl.innerHTML = REC.reviews.summary(await REC.reviews.getStats(p.id));
    if (host) {
      const list = client
        ? await REC.reviews.getReviews(p.id)
        : REC.reviews.DEMO_REVIEWS.map((r) => ({ ...r, product_id: p.id }));
      host.innerHTML = list.length ? list.map((r) => REC.reviews.card(r)).join("") : REC.reviews.empty();
    }

    // Form panel
    if (!formEl) return;
    const user = client ? REC.auth.currentUser() : null;
    if (!user || !user.user) {
      formEl.innerHTML = supabaseOn ? REC.reviews.formPanel({ unauth: true }) : REC.reviews.formPanel({ error: "Reviews go live once Supabase accounts are connected. For now, contact us on WhatsApp with your feedback." });
      return;
    }
    if (!supabaseOn) {
      formEl.innerHTML = REC.reviews.formPanel({ error: "Reviews go live once Supabase accounts are connected." });
      return;
    }
    const mine = await REC.reviews.myReview(p.id);
    renderPendingDelete(formEl, p.id, mine ? mine.id : null);
    if (!mine) bindReviewForm(p.id);
  }

  function renderPendingDelete(formEl, productId, reviewId) {
    formEl.innerHTML = REC.reviews.formPanel(reviewId ? { pending: true } : {});
    const del = $("#review_delete");
    if (del) {
      del.addEventListener("click", async () => {
        if (!confirm("Delete your review for this product?")) return;
        try {
          await REC.reviews.remove(reviewId);
          UI.toast("Review deleted", "success");
          renderPendingDelete(formEl, productId, null);
          bindReviewForm(productId);
          const sumEl = $("#rv_summary");
          if (sumEl) sumEl.innerHTML = REC.reviews.summary(await REC.reviews.getStats(productId));
        } catch (err) {
          UI.toast(err.message || "Delete failed", "error");
        }
      });
    }
  }

  function bindReviewForm(productId) {
    const input = $("#review_rating");
    const box = $("#rate_input");
    if (box) {
      box.querySelectorAll("[data-rate]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const v = Number(btn.getAttribute("data-rate"));
          if (input) input.value = v;
          box.querySelectorAll("[data-rate]").forEach((b) => {
            const on = Number(b.getAttribute("data-rate")) <= v;
            b.classList.toggle("on", on);
            b.setAttribute("aria-pressed", on ? "true" : "false");
            b.querySelectorAll("svg").forEach((sv) => {
              sv.style.opacity = on ? "1" : ".22";
              sv.style.color = on ? "" : "";
            });
          });
        });
      });
    }

    $("#review_submit").addEventListener("click", async () => {
      const rating = Number((input && input.value) || 0);
      const commentEl = $("#review_comment");
      const comment = (commentEl && commentEl.value || "").trim();
      if (!rating) return UI.toast("Please select a star rating", "warning");
      if (comment.length < 10) return UI.toast("Your review comment is a little short", "warning");
      const btn = $("#review_submit");
      btn.disabled = true;
      btn.textContent = "Submitting…";
      try {
        const review = await REC.reviews.submit(productId, rating, comment);
        UI.toast("Review submitted! It will appear after approval.", "success");
        renderPendingDelete($("#rv_form_panel"), productId, review.id);
        const sumEl = $("#rv_summary");
        if (sumEl) sumEl.innerHTML = REC.reviews.summary(await REC.reviews.getStats(productId));
      } catch (err) {
        UI.toast(err.message || "Could not submit your review", "error");
        btn.disabled = false;
        btn.textContent = "Submit Review";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);