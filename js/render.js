/* ============================================================
   REC — Shared renderers (product cards, category cards, etc.)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;
  const icon = UI.icon;
  const esc = UI.esc;

  const stockLabel = (p) => {
    if (!p.in_stock) return { text: "Out of stock", cls: "out" };
    if (p.low_stock) return { text: "Low stock", cls: "low" };
    return { text: "In stock", cls: "" };
  };

  const R = {
    productCard(p) {
      const st = stockLabel(p);
      const fav = REC.favorites && REC.favorites.has(p.id);
      const cat = p.category_name || p.categories?.name || "";
      const price = UI.money(p.price);
      const tags = [
        p.featured ? '<span class="p-tag gold">Featured</span>' : "",
        p.online_orderable === false ? '<span class="p-tag soon">Farm Visit</span>' : "",
      ].join("");
      const canOrder = p.online_orderable !== false && p.in_stock;
      const waHref = UI.waLink(UI.waProductMessage(p.name));
      return (
        '<article class="product-card reveal" data-id="' + esc(p.id) + '">' +
        '<div class="p-media">' +
        (tags ? '<div class="p-badge">' + tags + "</div>" : "") +
        '<button type="button" class="p-fav' + (fav ? " active" : "") +
        '" data-fav="' + esc(p.id) + '" aria-label="Add to favourites" aria-pressed="' + (fav ? "true" : "false") + '">' +
        icon("i-heart") +
        "</button>" +
        '<a href="product.html?id=' + encodeURIComponent(p.id) + '">' +
        '<img src="' + esc(p.image || REC.products.PLACEHOLDER) + '" alt="' + esc(p.name) + '" width="400" height="300" loading="lazy"/>' +
        "</a>" +
        "</div>" +
        '<div class="p-body">' +
        '<span class="p-cat">' + esc(cat) + "</span>" +
        '<a href="product.html?id=' + encodeURIComponent(p.id) + '" class="p-name">' + esc(p.name) + "</a>" +
        '<div class="p-meta">' +
        '<span class="p-stock"><span class="dot ' + st.cls + '"></span>' + st.text + "</span>" +
        '<span>· ' + esc(p.unit || "") + "</span>" +
        "</div>" +
        '<div class="p-foot">' +
        '<div class="p-price">' + price + " <small>" + esc(p.unit || "") + "</small></div>" +
        '<div class="p-actions">' +
        '<a class="btn btn-sm btn-outline" href="product.html?id=' + encodeURIComponent(p.id) + '">Details</a>' +
        (canOrder
          ? '<button type="button" class="btn btn-sm btn-primary" data-add="' + esc(p.id) + '">' + icon("i-cart") + "Add</button>"
          : '<a class="btn btn-sm btn-gold" href="' + waHref + '" target="_blank" rel="noopener">' + icon("i-whatsapp") + "Enquire</a>") +
        "</div>" +
        "</div>" +
        "</div>" +
        "</article>"
      );
    },

    categoryCard(c) {
      const img = c.image || REC.products.PLACEHOLDER;
      return (
        '<a class="category-card reveal" href="shop.html?category=' + encodeURIComponent(c.slug || c.id) + '">' +
        '<div class="cat-media"><img src="' + esc(img) + '" alt="' + esc(c.name) + '" width="400" height="300" loading="lazy"/></div>' +
        '<div class="cat-body">' +
        '<span class="cat-title">' + esc(c.name) + "</span>" +
        '<p class="cat-desc">' + esc(c.description || "") + "</p>" +
        '<span class="cat-arrow">Explore ' + icon("i-arrow-right") + "</span>" +
        "</div>" +
        "</a>"
      );
    },

    testimonial(t) {
      const rating = Number(t.rating || 5);
      const stars = Array.from({ length: 5 }, (_, i) =>
        icon("i-star").replace('aria-hidden="true"', i < rating ? 'aria-hidden="true" style="opacity:1"' : 'aria-hidden="true" style="opacity:.25"')
      ).join("");
      return (
        '<div class="testimonial-card reveal">' +
        '<div class="t-head">' +
        '<div class="t-avatar">' + esc(UI.initials(t.name || "REC")) + "</div>" +
        "<div><div class=\"t-name\">" + esc(t.name || "Customer") + "</div>" +
        '<div class="t-loc">' + esc(t.location || "") + "</div></div>" +
        (t.sample === true ? '<span class="t-sample">Sample testimonial</span>' : "") +
        "</div>" +
        '<blockquote>&ldquo;' + esc(t.message || "") + '&rdquo;</blockquote>' +
        '<div class="rating"><span class="stars">' + stars + "</span></div>" +
        "</div>"
      );
    },

    cartItemRow(i, index) {
      const total = UI.money(i.price * i.quantity);
      return (
        '<div class="cart-item" data-cart-row="' + esc(i.product_id) + '">' +
        '<a class="ci-img" href="product.html?id=' + encodeURIComponent(i.product_id) + '">' +
        '<img src="' + esc(i.image || REC.products.PLACEHOLDER) + '" alt="' + esc(i.name) + '" width="92" height="92" loading="lazy"/>' +
        "</a>" +
        "<div>" +
        '<a class="ci-name" href="product.html?id=' + encodeURIComponent(i.product_id) + '">' + esc(i.name) + "</a>" +
        '<div class="ci-meta">' + esc(i.unit || "") + " · " + UI.money(i.price) + " each</div>" +
        "</div>" +
        '<div class="ci-right">' +
        '<span class="ci-price">' + total + "</span>" +
        '<div class="qty-stepper" data-qty-for="' + esc(i.product_id) + '">' +
        '<button type="button" data-dec="' + esc(i.product_id) + '" aria-label="Decrease quantity">&minus;</button>' +
        '<input type="number" min="1" value="' + i.quantity + '" data-qty="' + esc(i.product_id) + '" aria-label="Quantity"/>' +
        '<button type="button" data-inc="' + esc(i.product_id) + '" aria-label="Increase quantity">+</button>' +
        "</div>" +
        '<button type="button" class="ci-remove" data-remove="' + esc(i.product_id) + '">' + icon("i-trash") + "Remove</button>" +
        "</div>" +
        "</div>"
      );
    },
  };

  /* Wiring delegated actions used by any page (bound once) */
  R.bindCommonActions = function (productResolver) {
    if (productResolver) R._resolver = productResolver;
    if (R._bound) return;
    R._bound = true;
    document.addEventListener("click", async (e) => {
      const addBtn = e.target.closest("[data-add]");
      if (addBtn) {
        e.preventDefault();
        const id = addBtn.getAttribute("data-add");
        const p = await R._resolver(id);
        if (!p) return UI.toast("Product not found", "error");
        const stock = p.stock_quantity;
        if (stock != null && stock <= 0) return UI.toast("This product is out of stock", "warning");
        REC.cart.add({
          product_id: id,
          name: p.name,
          price: p.price,
          unit: p.unit,
          image: p.image,
          stock_quantity: stock,
          quantity: Math.max(1, Number(p.minimum_order_quantity || 1)),
        });
        return;
      }
      const favBtn = e.target.closest("[data-fav]");
      if (favBtn) {
        e.preventDefault();
        const id = favBtn.getAttribute("data-fav");
        const list = REC.favorites.toggle(id);
        const on = list.includes(String(id));
        favBtn.classList.toggle("active", on);
        favBtn.setAttribute("aria-pressed", on ? "true" : "false");
        UI.toast(on ? "Saved to favourites" : "Removed from favourites", "info");
      }
    });
  };

  REC.render = R;
  win.REC = REC;
})(window);