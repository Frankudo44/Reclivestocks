/* ============================================================
   REC — Cart page rendering + interaction
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;

  function $(s, r) {
    return (r || document).querySelector(s);
  }

  function renderCart() {
    const host = $("#cart_items");
    const items = REC.cart.items();
    if (!host) return;

    if (!items.length) {
      $("#cart_empty").style.display = "block";
      $("#cart_filled").style.display = "none";
      return;
    }
    $("#cart_empty").style.display = "none";
    $("#cart_filled").style.display = "block";
    host.innerHTML = items.map((i, idx) => REC.render.cartItemRow(i, idx)).join("");

    const subtotal = REC.cart.subtotal();
    $("#sum_subtotal").textContent = UI.money(subtotal);
    $("#sum_total").textContent = UI.money(subtotal);
  }

  function bind() {
    document.addEventListener("click", (e) => {
      const remove = e.target.closest("[data-remove]");
      if (remove) {
        REC.cart.remove(remove.getAttribute("data-remove"));
        renderCart();
        UI.toast("Item removed from cart", "info");
        return;
      }
      const inc = e.target.closest("[data-inc]");
      if (inc) {
        const id = inc.getAttribute("data-inc");
        const item = REC.cart.items().find((i) => String(i.product_id) === String(id));
        if (item) {
          REC.cart.updateQty(id, item.quantity + 1);
          renderCart();
        }
        return;
      }
      const dec = e.target.closest("[data-dec]");
      if (dec) {
        const id = dec.getAttribute("data-dec");
        const item = REC.cart.items().find((i) => String(i.product_id) === String(id));
        if (item) {
          REC.cart.updateQty(id, item.quantity - 1);
          renderCart();
        }
      }
    });

    document.addEventListener("change", (e) => {
      const q = e.target.closest("[data-qty]");
      if (!q) return;
      const id = q.getAttribute("data-qty");
      const item = REC.cart.items().find((i) => String(i.product_id) === String(id));
      let v = Number(q.value || 1);
      if (v < 1) v = 1;
      if (item && item.stock_quantity != null && v > item.stock_quantity) {
        v = item.stock_quantity;
        UI.toast("Only " + v + " in stock", "warning");
      }
      REC.cart.updateQty(id, v);
      renderCart();
    });

    $("#clear_cart") &&
      $("#clear_cart").addEventListener("click", () => {
        REC.cart.clear();
        renderCart();
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderCart();
    bind();
    document.addEventListener("rec:cartchange", renderCart);
    window.addEventListener("storage", (e) => {
      if (e.key === "rec_cart") renderCart();
    });
  });
})(window);