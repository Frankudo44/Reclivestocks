/* ============================================================
   REC — Checkout page logic
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;

  const DEFAULT_FEE = 0; // fee is configured per state in delivery_zones
  let currentFee = DEFAULT_FEE;

  function $(s, r) {
    return (r || document).querySelector(s);
  }
  function $$(s, r) {
    return Array.from((r || document).querySelectorAll(s));
  }

  async function init() {
    const client = REC.initSupabase();
    if (client && REC.auth.getSession) {
      try {
        const { data } = await client.auth.getSession();
        if (data && data.session) {
          const cur = REC.auth.currentUser();
          if (cur && cur.profile) prefill(cur.profile);
        }
      } catch (e) {}
    }

    renderSummary();
    buildStates();
    buildPickupStations();
    bindMethod();
    bindFee();
    bindSubmit();
  }

  function prefill(p) {
    if (!p) return;
    if (!$('#full_name').value) $('#full_name').value = p.full_name || "";
    if (!$('#phone').value) $('#phone').value = p.phone || "";
    const emailField = $('#email');
    if (p.email) emailField.value = p.email;
  }

  function buildStates() {
    const sel = $('#state');
    if (!sel) return;
    sel.innerHTML = '<option value="">Select your state</option>' +
      REC.products.STATES.map((s) => '<option value="' + s + '">' + s + "</option>").join("");
  }

  function buildLgas(state) {
    const sel = $('#lga');
    if (!sel) return;
    const lgas = (state && REC.products.LGAS && REC.products.LGAS[state]) || [];
    sel.disabled = !lgas.length;
    sel.innerHTML =
      '<option value="">' + (lgas.length ? "Select your LGA" : "Select your state first") + "</option>" +
      lgas.map((l) => '<option value="' + l + '">' + l + "</option>").join("");
  }

  async function buildPickupStations() {
    const sel = $('#pickup_station');
    if (!sel) return;
    sel.innerHTML = '<option value="">Loading stations…</option>';
    try {
      const stations = await REC.products.getPickupStations();
      if (!stations || !stations.length) {
        sel.innerHTML = '<option value="">No pickup stations available — please select delivery</option>';
        sel.disabled = true;
        return;
      }
      sel.disabled = false;
      sel.innerHTML =
        '<option value="">Select a pickup station</option>' +
        stations
          .map(
            (s) =>
              '<option value="' + s.id + '"' +
              ' data-fee="' + (Number(s.pickup_fee) || 0) + '"' +
              ' data-name="' + UI.esc(s.name.replace(/"/g, "&quot;")) + '"' +
              ' data-addr="' + UI.esc(s.address.replace(/"/g, "&quot;")) + '"' +
              ' data-hours="' + UI.esc((s.operating_hours || "").replace(/"/g, "&quot;")) + '"' +
              ' data-phone="' + UI.esc((s.contact_phone || "").replace(/"/g, "&quot;")) + '">' +
              UI.esc(s.name) + " — " + UI.esc(s.city || s.state) +
              "</option>"
          )
          .join("");
    } catch (e) {
      sel.innerHTML = '<option value="">Could not load stations</option>';
      sel.disabled = true;
    }
  }

  function selectedPickupFee() {
    const sel = $('#pickup_station');
    if (!sel || !sel.value) return 0;
    const opt = sel.options[sel.selectedIndex];
    return Number(opt && opt.getAttribute('data-fee')) || 0;
  }

  function showPickupDetails() {
    const sel = $('#pickup_station');
    const info = $('#pickup_info');
    const text = $('#pickup_info_text');
    if (!sel || !info || !text) return;
    const opt = sel.options[sel.selectedIndex];
    if (!opt || !opt.value) {
      info.hidden = true;
      return;
    }
    const fee = Number(opt.getAttribute('data-fee')) || 0;
    const lines = [opt.getAttribute('data-addr')];
    if (fee > 0) lines.push('Pickup fee: ' + UI.money(fee));
    else lines.push('Pickup fee: Free');
    if (opt.getAttribute('data-hours')) lines.push('Hours: ' + opt.getAttribute('data-hours'));
    if (opt.getAttribute('data-phone')) lines.push('Tel: ' + opt.getAttribute('data-phone'));
    text.textContent = lines.filter(Boolean).join(' · ');
    info.hidden = false;
  }

  function setMethod(method) {
    const delivery = $('#fm_delivery');
    const pickup = $('#fm_pickup');
    const btnD = $('#fm_btn_delivery');
    const btnP = $('#fm_btn_pickup');
    if (!delivery || !pickup) return;
    REC.checkoutMethod = method === 'pickup' ? 'pickup' : 'delivery';
    const isPickup = REC.checkoutMethod === 'pickup';
    delivery.hidden = isPickup;
    pickup.hidden = !isPickup;
    if (btnD) {
      btnD.classList.toggle('active', !isPickup);
      btnD.setAttribute('aria-checked', String(!isPickup));
    }
    if (btnP) {
      btnP.classList.toggle('active', isPickup);
      btnP.setAttribute('aria-checked', String(isPickup));
    }
    const note = $('#sum_note');
    if (note) {
      note.textContent = isPickup
        ? 'Pickup fee varies by station — select one and your total updates automatically.'
        : 'Delivery fee is confirmed based on your selected state. We deliver across all 36 states and the FCT.';
    }
    updateTotals();
  }

  function bindMethod() {
    const btns = $$('.fm-btn');
    btns.forEach((b) =>
      b.addEventListener('click', () => {
        setMethod(b.getAttribute('data-method'));
        const firstRequired = b.getAttribute('data-method') === 'pickup' ? $('#pickup_station') : $('#state');
        firstRequired && firstRequired.focus({ preventScroll: true });
      })
    );
    const sel = $('#pickup_station');
    if (sel) {
      sel.addEventListener('change', () => {
        showPickupDetails();
        updateTotals();
      });
    }
  }

  async function stateFee(state) {
    if (!state) return DEFAULT_FEE;
    try {
      const zones = await REC.products.getDeliveryZones(state);
      if (zones && zones.length) {
        return Number(zones[0].delivery_fee || 0);
      }
    } catch (e) {}
    // Nationwide default (no configured zone yet) — keep transparent.
    return DEFAULT_FEE;
  }

  async function bindFee() {
    const sel = $('#state');
    if (!sel) return;
    sel.addEventListener('change', async () => {
      buildLgas(sel.value);
      const fee = await stateFee(sel.value);
      updateTotals(fee);
    });
  }

  function updateTotals(_fee) {
    if (_fee !== undefined) currentFee = _fee;
    const subtotal = REC.cart.subtotal();
    const isPickup = REC.checkoutMethod === 'pickup';
    const fee = isPickup ? selectedPickupFee() : (Number(currentFee) || 0);
    const psSel = $('#pickup_station');
    const stationChosen = isPickup && psSel && !!psSel.value;
    const label = $('#sum_fee_label');
    if (label) label.textContent = isPickup ? 'Pickup fee' : 'Delivery fee';
    $('#sum_subtotal').textContent = UI.money(subtotal);
    $('#sum_delivery').textContent = fee
      ? UI.money(fee)
      : (isPickup && stationChosen ? 'Free' : '—');
    $('#sum_total').textContent = UI.money(subtotal + fee);
  }

  function renderSummary() {
    const list = REC.cart.items();
    const host = $('#checkout_items');
    if (!host) return;
    if (!list.length) {
      host.innerHTML =
        '<div class="osi-row"><span>Your cart is empty.</span><span></span></div>' +
        '<div class="osi-row"><span></span><span><a class="btn-link" href="shop.html">Browse products</a></span></div>';
      $('#submit_btn') && ($('#submit_btn').disabled = true);
      return;
    }
    host.innerHTML = list
      .map(
        (i) =>
          '<div class="osi-row"><span>' +
          UI.esc(i.name) +
          " × " +
          i.quantity +
          '</span><span>' +
          UI.money(i.price * i.quantity) +
          "</span></div>"
      )
      .join("");
    const fee = 0;
    updateTotals(fee);
  }

  function validate(form) {
    let ok = true;
    $$('.field', form).forEach((f) => f.classList.remove('invalid'));
    const isPickup = REC.checkoutMethod === 'pickup';
    const rules = [
      ['full_name', (v) => v.trim().length >= 3, 'Enter your full name'],
      ['phone', (v) => v.replace(/\D/g, '').length >= 10, 'Enter a valid phone number'],
      ['email', (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email or leave blank'],
    ];
    if (isPickup) {
      rules.push(['pickup_station', (v) => !!v, 'Select a pickup station']);
    } else {
      rules.push(
        ['state', (v) => !!v, 'Select your state'],
        ['lga', (v) => !!v, 'Select your LGA'],
        ['delivery_address', (v) => v.trim().length >= 5, 'Enter your delivery address']
      );
    }
    rules.forEach(([id, fn, msg]) => {
      const el = $('#' + id);
      if (!el) return;
      const field = el.closest('.field');
      const val = el.value || '';
      if (!fn(val)) {
        ok = false;
        if (field) {
          field.classList.add('invalid');
          const err = field.querySelector('.err');
          if (err) err.textContent = msg;
        }
      }
    });
    return ok;
  }

  function bindSubmit() {
    const form = $('#checkout_form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!REC.cart.items().length) {
        UI.toast('Your cart is empty', 'warning');
        return;
      }
      if (!validate(form)) {
        UI.toast('Please correct the highlighted fields', 'error');
        const firstBad = $('.field.invalid');
        if (firstBad) firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const btn = $('#submit_btn');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Processing…';

      try {
        const isPickup = REC.checkoutMethod === 'pickup';
        const state = $('#state').value;
        const fee = isPickup ? selectedPickupFee() : await stateFee(state);
        const subtotal = REC.cart.subtotal();
        const psSelect = $('#pickup_station');
        const psOption = psSelect && psSelect.value ? psSelect.options[psSelect.selectedIndex] : null;
        const payload = {
          full_name: $('#full_name').value.trim(),
          phone: $('#phone').value.trim(),
          email: $('#email').value.trim() || null,
          fulfillment_method: isPickup ? 'pickup' : 'delivery',
          state: isPickup ? null : state,
          lga: isPickup ? null : $('#lga').value.trim(),
          delivery_address: isPickup ? null : $('#delivery_address').value.trim(),
          pickup_station_id: psOption ? Number(psOption.value) : null,
          pickup_station_name: psOption ? psOption.getAttribute('data-name') : null,
          pickup_station_address: psOption ? psOption.getAttribute('data-addr') : null,
          notes: $('#notes').value.trim() || null,
          subtotal,
          delivery_fee: fee,
          total: subtotal + fee,
          items: REC.cart.items(),
        };

        const order = await REC.orders.create(payload);
        const reference = order.order_number;
        localStorage.setItem('rec_last_order', JSON.stringify({ ...order, created_at: order.created_at || new Date().toISOString() }));
        REC.cart.clear();

        // Confirmation page renders from rec_last_order.
        window.location.href = 'order-success.html?ref=' + encodeURIComponent(reference);
      } catch (err) {
        UI.toast(err.message || 'Order submission failed. Please try again.', 'error');
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);