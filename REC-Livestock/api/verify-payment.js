/* ============================================================
   REC — Paystack payment verification (Vercel serverless)
   ------------------------------------------------------------
   The browser never sees the Paystack secret key or the Supabase
   service-role key. This function:
     1. verifies the transaction with Paystack,
     2. checks the paid amount matches the stored order total,
     3. updates the order payment fields server-side.

   Env vars (Vercel → Settings → Environment Variables):
     PAYSTACK_SECRET_KEY
     SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY
   ============================================================ */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

function json(res, status, body) {
  return res.status(status).json(body);
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "GET" && req.method !== "POST") {
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  const order_number = String(req.query.order_number || "").trim().toUpperCase();
  const token = String(req.query.token || req.query.reference || "").trim();

  if (!order_number || !/^REC-\d{4}-\d{6}$/.test(order_number)) {
    return json(res, 400, { ok: false, error: "Invalid order number" });
  }
  if (!token) {
    return json(res, 400, { ok: false, error: "Missing payment reference" });
  }
  if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(res, 500, { ok: false, error: "Payment verification is not configured on the server." });
  }

  try {
    // 1. Verify with Paystack
    const pr = await fetch(
      "https://api.paystack.co/transaction/verify/" + encodeURIComponent(token),
      { headers: { Authorization: "Bearer " + PAYSTACK_SECRET_KEY } }
    );
    const pay = await pr.json().catch(() => ({}));
    if (!pay || pay.status !== true || !pay.data) {
      return json(res, 200, { ok: true, verified: false, reason: "Transaction not found" });
    }
    if (pay.data.status !== "success") {
      return json(res, 200, { ok: true, verified: false, reason: pay.data.status || "not successful" });
    }

    // 2. Load the order (service role bypasses RLS)
    const orderUrl =
      SUPABASE_URL +
      "/rest/v1/orders?order_number=eq." +
      encodeURIComponent(order_number) +
      "&select=id,total,payment_status,payment_reference";
    const og = await fetch(orderUrl, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
      },
    });
    const orders = await og.json().catch(() => null);
    const order = Array.isArray(orders) ? orders[0] : null;
    if (!order) {
      return json(res, 200, { ok: true, verified: false, reason: "Order not found" });
    }

    // 3. Amount must match the order total (Paystack sends the amount in kobo)
    const expected = Math.round(Number(order.total || 0) * 100);
    const received = Math.round(Number(pay.data.amount || 0));
    if (received < expected) {
      return json(res, 200, { ok: true, verified: false, reason: "amount_mismatch" });
    }
    if (order.payment_status === "paid") {
      return json(res, 200, { ok: true, verified: true, order_number, amount: received });
    }

    // 4. Mark paid server-side
    const patch = await fetch(
      SUPABASE_URL + "/rest/v1/orders?order_number=eq." + encodeURIComponent(order_number),
      {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          payment_status: "paid",
          payment_method: "paystack",
          payment_reference: token,
          paid_at: new Date().toISOString(),
          amount_paid: received / 100,
          updated_at: new Date().toISOString(),
        }),
      }
    );
    const patched = await patch.json().catch(() => null);
    if (!patch.ok) {
      return json(res, 500, { ok: false, error: "Failed to update order" });
    }

    return json(res, 200, {
      ok: true,
      verified: true,
      order_number,
      amount: received,
      order: Array.isArray(patched) ? patched[0] : null,
    });
  } catch (e) {
    return json(res, 500, { ok: false, error: String((e && e.message) || e) });
  }
}