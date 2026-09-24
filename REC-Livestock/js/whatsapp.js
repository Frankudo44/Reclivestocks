/* ============================================================
   REC — WhatsApp helpers (business links, product enquiries)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});

  REC.whatsapp = {
    general(message) {
      const msg =
        message ||
        "Hello REC Livestock & Agro Farms, I would like to make an enquiry.";
      const base = String(REC.config.whatsapp || REC.config.phoneRaw || REC.config.phone).replace(/\D/g, "");
      return "https://wa.me/" + base + "?text=" + encodeURIComponent(msg);
    },
    product(name, extras) {
      let msg =
        "Hello REC Livestock & Agro Farms,\nI am interested in " +
        name +
        ".\nPlease provide more information.";
      if (extras) msg += "\n" + extras;
      return REC.whatsapp.general(msg);
    },
    order(reference, items) {
      let msg =
        "Hello REC Livestock & Agro Farms,\nI just placed order " +
        reference +
        ".";
      if (items && items.length) {
        msg += "\nItems:\n" + items.map((i) => "- " + i.name + " x" + i.quantity).join("\n");
      }
      msg += "\nPlease confirm, thank you.";
      return REC.whatsapp.general(msg);
    },
    open(url) {
      win.open(url || REC.whatsapp.general(), "_blank", "noopener");
    },
  };
})(window);