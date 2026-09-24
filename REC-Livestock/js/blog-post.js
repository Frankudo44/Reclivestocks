/* ============================================================
   REC — Single blog post
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;

  function $(id) {
    return document.getElementById(id);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const host = $("post_body");
    if (!host) return;
    const slug = UI.qs().get("slug");
    const post = await REC.products.getBlogPost(slug || "");

    if (!post || !post.title) {
      host.innerHTML = UI.emptyState("Post not found", "The article may have been removed.");
      return;
    }

    const paragraphs = Array.isArray(post.content)
      ? post.content.join("</p><p>")
      : String(post.content || "").replace(/\n{2,}/g, "</p><p>");

    host.innerHTML =
      '<nav class="breadcrumb" aria-label="Breadcrumb">' +
      '<a href="index.html">Home</a><span class="sep">/</span>' +
      '<a href="blog.html">Blog</a><span class="sep">/</span>' +
      '<span aria-current="page">' + UI.esc(post.title) + "</span></nav>" +
      '<span class="p-cat">' + UI.esc(post.category || "Farm") + "</span>" +
      "<h1 style='font-size:clamp(1.9rem,4vw,2.7rem)'>" + UI.esc(post.title) + "</h1>" +
      '<div class="p-meta" style="margin-top:.7rem">' +
      UI.icon("i-clock").replace('<svg', '<svg width="16" height="16"') +
      "<span>" + UI.formatDate(post.published_at || post.date) + " · " + UI.esc(post.author || "REC Farm Team") + "</span>" +
      "</div>" +
      '<div class="pd-main-img" style="aspect-ratio:16/9;margin-top:1.6rem">' +
      '<img src="' + UI.esc(post.image || "assets/images/turkey.png") + '" alt="' + UI.esc(post.title) + '" style="width:100%;height:100%;object-fit:cover"/>' +
      "</div>" +
      '<div class="prose" style="margin-top:1.8rem;line-height:1.85">' +
      "<p>" + paragraphs + "</p>" +
      "</div>" +
      '<div class="cta-band" style="margin-top:2.4rem">' +
      '<div class="cta-inner"><div><h2 style="font-size:1.4rem">Need help on your farm?</h2>' +
      "<p>Talk to the REC team today.</p></div>" +
      '<div style="display:flex;gap:.7rem;flex-wrap:wrap">' +
      '<a class="btn btn-gold" href="shop.html">Shop Products</a>' +
      '<a class="btn btn-white" href="' + REC.whatsapp.general() + '" target="_blank" rel="noopener">WhatsApp Us</a>' +
      "</div></div></div>";

    document.title = post.title + " | REC Blog";
    setPostMeta(post);
  });

  function setPostMeta(post) {
    const date = post.published_at || post.date;
    const image = toAbs(post.image || "assets/images/turkey.png");
    setMeta("og:title", post.title + " | REC Blog");
    setMeta("twitter:title", post.title + " | REC Blog");
    setMeta("og:description", (post.excerpt || "").slice(0, 200));
    setMeta("twitter:description", (post.excerpt || "").slice(0, 200));
    setMeta("og:image", image);
    setMeta("twitter:image", image);
    const urlMeta = document.querySelector('meta[property="og:url"]');
    if (urlMeta) urlMeta.setAttribute("content", window.location.href);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = window.location.href;

    const prev = document.getElementById("bp_jsonld");
    if (prev) prev.remove();
    const schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      image: image,
      datePublished: date,
      author: { "@type": "Organization", name: post.author || "REC Farm Team" },
      publisher: { "@type": "Organization", name: "REC Livestock & Agro Farms" },
      mainEntityOfPage: window.location.href,
    };
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "bp_jsonld";
    el.textContent = JSON.stringify(schema);
    document.head.appendChild(el);
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

  function toAbs(src) {
    if (!src) return "https://reclivestock.ng/assets/images/turkey.png";
    return /^https?:\/\//.test(src) ? src : "https://reclivestock.ng/" + src.replace(/^\//, "");
  }
})(window);