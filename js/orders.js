/* ============================================================
   REC — Orders (create order + order reference generation)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;

  REC.orders = {
    sb() {
      return REC.supabaseClient;
    },

    /** REC-2026-000001 style reference */
    generateReference() {
      const year = new Date().getFullYear();
      const seq = Math.floor(Math.random() * 900000 + 100000);
      return "REC-" + year + "-" + String(seq).padStart(6, "0");
    },

    /**
     * Creates an order in Supabase. Falls back gracefully with a
     * documented integration point when Supabase is not configured.
     */
    async create(orderPayload) {
      const client = REC.orders.sb();
      const reference = orderPayload.order_number || REC.orders.generateReference();

      if (!client) {
        // ---- INTEGRATION POINT ----
        // Supabase is not configured yet (add keys in js/config.js).
        // Simulate a successful order so the flow can be tested end-to-end.
        const stored = {
          ...orderPayload,
          order_number: reference,
          status: "pending",
          payment_status: "unpaid",
          created_at: new Date().toISOString(),
        };
        const history = JSON.parse(localStorage.getItem("rec_orders") || "[]");
        history.unshift(stored);
        localStorage.setItem("rec_orders", JSON.stringify(history.slice(0, 50)));
        return stored;
      }

      const basePayload = {
        customer_id: orderPayload.customer_id || null,
        full_name: orderPayload.full_name,
        phone: orderPayload.phone,
        email: orderPayload.email || null,
        state: orderPayload.state || null,
        lga: orderPayload.lga || null,
        delivery_address: orderPayload.delivery_address || null,
        notes: orderPayload.notes || null,
        subtotal: orderPayload.subtotal,
        delivery_fee: orderPayload.delivery_fee,
        total: orderPayload.total,
        status: "pending",
        payment_status: "unpaid",
        items: (orderPayload.items || []).map((it) => ({
          product_id: it.product_id,
          name: it.name,
          quantity: it.quantity,
          unit_price: it.price,
          subtotal: it.quantity * it.price,
        })),
      };

      const pickupPayload = {
        fulfillment_method: orderPayload.fulfillment_method || "delivery",
        pickup_station_id: orderPayload.pickup_station_id || null,
        pickup_station_name: orderPayload.pickup_station_name || null,
        pickup_station_address: orderPayload.pickup_station_address || null,
      };

      let result = await client
        .from("orders")
        .insert({ ...basePayload, ...pickupPayload })
        .select()
        .single();

      // Resilient degradation: an un-migrated database (supabase/schema.sql
      // not re-run since pickup stations were added) rejects the pickup
      // columns. Retry once without them so checkout never hard-fails.
      if (result.error && REC.orders.isPickupSchemaMismatch(result.error)) {
        console.warn(
          "orders table is missing pickup columns — re-run supabase/schema.sql. Retrying without pickup fields."
        );
        result = await client.from("orders").insert(basePayload).select().single();
      }

      const { data, error } = result;

      if (error) {
        // Fall back to local record if write fails (network / RLS) so nobody
        // loses their order silently — but surface the issue in console.
        console.error("Order insert failed:", error.message);
        const stored = { ...orderPayload, order_number: reference, status: "pending", payment_status: "unpaid", created_at: new Date().toISOString() };
        const history = JSON.parse(localStorage.getItem("rec_orders") || "[]");
        history.unshift(stored);
        localStorage.setItem("rec_orders", JSON.stringify(history.slice(0, 50)));
        throw new Error(
          "We could not save your order online right now. Your order reference is " +
            reference +
            ". Please send it to us on WhatsApp so we can confirm manually."
        );
      }
      // The trigger-assigned reference comes back from RETURNING; only fall
      // back to the random one if the trigger is absent.
      if (!data) throw new Error("We could not save your order online right now.");
      if (!data.order_number) data.order_number = reference;
      return data;
    },

    /**
     * True when the insert failed because the live DB is missing the pickup
     * columns added in supabase/schema.sql (Pre-42703 undefined column /
     * PostgREST PGRST204 schema-cache miss).
     */
    isPickupSchemaMismatch(error) {
      if (!error) return false;
      const msg = String(error.message || "");
      const pickupColumns = [
        "fulfillment_method",
        "pickup_station_id",
        "pickup_station_name",
        "pickup_station_address",
      ];
      if (!pickupColumns.some((c) => msg.indexOf(c) !== -1)) return false;
      return (
        error.code === "42703" ||
        error.code === "PGRST204" ||
        /does not exist/i.test(msg) ||
        /schema[- ]cache/i.test(msg) ||
        /column/i.test(msg)
      );
    },

    async track(reference) {
      const client = REC.orders.sb();
      if (client) {
        try {
          const { data, error } = await client
            .rpc("track_order", { p_reference: reference });
          if (!error && data && data.length) return data[0];
        } catch (e) {}
      }
      const list = JSON.parse(localStorage.getItem("rec_orders") || "[]");
      return list.find((o) => o.order_number === reference) || null;
    },

    ORDER_STATUSES: [
      "pending",
      "confirmed",
      "processing",
      "ready",
      "out for delivery",
      "completed",
      "cancelled",
    ],
  };
})(window);