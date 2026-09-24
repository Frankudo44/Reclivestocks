/* ============================================================
   REC — Dynamic sitemap (Vercel serverless)
   ------------------------------------------------------------
   Serves /sitemap.xml with the static pages PLUS live product
   and blog-post URLs from Supabase (public data, anon read).
   Falls back to the static list if Supabase is unreachable.

   Env vars (optional — defaults match js/config.js):
     SUPABASE_URL
     SUPABASE_ANON_KEY
   ============================================================ */

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://iyyxbvfqrfvdatkfvtyx.supabase.co";
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5eXhidmZxcmZ2ZGF0a2Z2dHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzQxNDQsImV4cCI6MjEwNTc1MDE0NH0.xBqeJY3QoRlSJYL6J8-EocvZGLn5eaMulMl97aO9nFY";

const SITE = "https://reclivestock.com";
const TODAY = new Date().toISOString().slice(0, 10);

const STATIC_URLS = [
  ["", "daily", "1.0"],
  ["shop.html", "weekly", "0.9"],
  ["about.html", "monthly", "0.7"],
  ["contact.html", "monthly", "0.7"],
  ["blog.html", "weekly", "0.6"],
  ["privacy.html", "yearly", "0.2"],
  ["terms.html", "yearly", "0.2"],
];

const esc = (s) =>
  String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function urlBlock(loc, freq, prio, lastmod) {
  return (
    "  <url><loc>" + esc(loc) + "</loc>" +
    (lastmod ? "<lastmod>" + esc(lastmod) + "</lastmod>" : "") +
    "<changefreq>" + freq + "</changefreq><priority>" + prio + "</priority></url>\n"
  );
}

async function fetchDynamic() {
  const headers = { apikey: ANON_KEY, Authorization: "Bearer " + ANON_KEY };
  try {
    // Products are keyed by id on the storefront (product.html?id=…)
    const pRes = await fetch(
      SUPABASE_URL + "/rest/v1/products?select=id,updated_at&active=eq.true&order=featured.desc",
      { headers }
    );
    const products = await pRes.json().catch(() => []);

    // Blog posts are keyed by slug (blog-post.html?slug=…)
    const bRes = await fetch(
      SUPABASE_URL + "/rest/v1/blog_posts?select=slug,published_at&published=eq.true",
      { headers }
    );
    const posts = await bRes.json().catch(() => []);

    let out = "";
    if (Array.isArray(products)) {
      products.forEach((p) => {
        out += urlBlock(
          SITE + "/product.html?id=" + encodeURIComponent(p.id),
          "weekly", "0.8",
          p.updated_at || TODAY
        );
      });
    }
    if (Array.isArray(posts)) {
      posts.forEach((p) => {
        out += urlBlock(
          SITE + "/blog-post.html?slug=" + encodeURIComponent(p.slug),
          "weekly", "0.7",
          p.published_at || TODAY
        );
      });
    }
    return out;
  } catch (e) {
    return "";
  }
}

export default async function handler(req, res) {
  const dynamic = await fetchDynamic();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  STATIC_URLS.forEach(([path, freq, prio]) => {
    xml += urlBlock(SITE + "/" + path, freq, prio, TODAY);
  });
  xml += dynamic;
  xml += "</urlset>";

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).send(xml);
}