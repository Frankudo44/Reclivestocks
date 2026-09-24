/* ============================================================
   REC — Homepage data loading
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;

  async function init() {
    REC.initSupabase();

    const setText = async () => {
      const s = await REC.products.getSettings();
      REC.siteData = s;
      if (s && s.hero_image) {
        const img = document.querySelector("[data-hero-img]");
        if (img) img.src = s.hero_image;
      }
      if (s && s.business_name) {
        document.querySelectorAll("[data-company]").forEach((el) => (el.textContent = s.business_name));
      }
      if (s && s.motto) {
        document.querySelectorAll("[data-motto]").forEach((el) => (el.textContent = s.motto));
      }
    };
    setText();

    loadCategories();
    loadFeatured();
    loadTestimonials();
  }

  async function loadCategories() {
    const host = document.getElementById("shop-categories");
    if (!host) return;
    host.innerHTML = REC.ui.skeletonGrid(6, "category");
    const cats = await REC.products.getCategories();
    host.innerHTML = cats.map((c) => REC.render.categoryCard(c)).join("");
    REC.ui.initReveal();
  }

  async function loadFeatured() {
    const host = document.getElementById("featured-products");
    if (!host) return;
    host.innerHTML = REC.ui.skeletonGrid(6, "product");
    const products = await REC.products.getFeatured(6);
    if (!products.length) {
      host.innerHTML = REC.ui.emptyState(
        "Featured products coming soon",
        "The REC team is stocking the farm shop. Check back shortly."
      );
      return;
    }
    host.innerHTML = products.map((p) => REC.render.productCard(p)).join("");
    REC.ui.initReveal();
    REC.render.bindCommonActions(REC.products.getProduct);
  }

  async function loadTestimonials() {
    const host = document.getElementById("testimonials-grid");
    if (!host) return;
    const items = await REC.products.getTestimonials();
    if (!items.length) {
      host.innerHTML = '<p class="text-center" style="color:var(--muted)">Testimonials will appear here soon.</p>';
      return;
    }
    host.innerHTML = items.map((t) => REC.render.testimonial(t)).join("");
    REC.ui.initReveal();
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);