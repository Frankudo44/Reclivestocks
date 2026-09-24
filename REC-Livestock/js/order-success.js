/* ============================================================
   REC — Order confirmation page
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;

  function $(id) {
    return document.getElementById(id);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const ref = UI.qs().get("ref");
    const stored = localStorage.getItem("rec_last_order");
    const order = stored ? JSON.parse(stored) : null;

    let reference = ref || (order && order.order_number) || null;

    const refEl = $("order_ref");
    if (reference) refEl.textContent = reference;

    const wa = $("order_wa");
    if (wa) {
      const items = (order && order.items) || [];
      wa.href = REC.whatsapp.order(reference || "my order", items);
    }

    // Show pickup station details when the order is a pickup order.
    if (order && order.fulfillment_method === "pickup" && order.pickup_station_name) {
      const box = $("pickup_box");
      if (box) {
        $("pickup_name").textContent = order.pickup_station_name;
        $("pickup_address").textContent = order.pickup_station_address || "";
        $("pickup_hours").textContent =
          "Pickup is free — bring your order reference (" + reference + ").";
        box.hidden = false;
      }
    }
  });
})(window);