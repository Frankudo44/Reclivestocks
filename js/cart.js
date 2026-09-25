/* ============================================================
   REC — Cart (localStorage-based, synced with guest/customer)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;
  const KEY = "rec_cart";

  const Cart = {
    items() {
      try {
        return JSON.parse(localStorage.getItem(KEY)) || [];
      } catch (e) {
        return [];
      }
    },

    save(list) {
      localStorage.setItem(KEY, JSON.stringify(list));
      const ev = new CustomEvent("rec:cartchange", { bubbles: true, detail: { items: list } });
      document.dispatchEvent(ev);
      win.dispatchEvent(ev);
    },

    count() {
      return Cart.items().reduce((s, i) => s + i.quantity, 0);
    },

    find(productId) {
      return Cart.items().find((i) => String(i.product_id) === String(productId));
    },

    add(item) {
      const list = Cart.items();
      const existing = list.find((i) => String(i.product_id) === String(item.product_id));
      const qty = Number(item.quantity || 1);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + qty, Number(item.stock_quantity) || existing.quantity + qty);
      } else {
        list.push({
          product_id: String(item.product_id),
          name: item.name,
          price: Number(item.price),
          unit: item.unit || "",
          image: item.image || "",
          stock_quantity: item.stock_quantity != null ? Number(item.stock_quantity) : null,
          quantity: qty,
        });
      }
      Cart.save(list);
      UI.toast("Added to cart · " + item.name, "success");
    },

    updateQty(productId, qty) {
      if (qty <= 0) {
        Cart.remove(productId);
        return;
      }
      const list = Cart.items().map((i) =>
        String(i.product_id) === String(productId) ? { ...i, quantity: qty } : i
      );
      Cart.save(list);
    },

    remove(productId) {
      Cart.save(Cart.items().filter((i) => String(i.product_id) !== String(productId)));
    },

    clear() {
      Cart.save([]);
    },

    subtotal() {
      return Cart.items().reduce((s, i) => s + i.price * i.quantity, 0);
    },

    total(deliveryFee) {
      return Cart.subtotal() + (Number(deliveryFee) || 0);
    },
  };

  REC.cart = Cart;
  win.REC = REC;
})(window);