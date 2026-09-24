/* ============================================================
   REC — Shop page (search, filters, sort, load more)
   ============================================================ */
(function (win) {
  "use strict";
  const REC = (win.REC = win.REC || {});
  const UI = REC.ui;

  const PAGE_SIZE = 9;
  let allProducts = [];
  let cats = [];
  let filtered = [];
  let shown = PAGE_SIZE;
  let activeFilters = {
    category: null,
    availability: "all", // all | in | out
    priceMax: null,
    featured: false,
    search: "",
    sort: "newest",
  };

  function $(s, r) {
    return (r || document).querySelector(s);
  }

  async function init() {
    REC.initSupabase();
    const params = UI.qs();
    activeFilters.search = params.get("q") || "";
    activeFilters.featured = params.get("featured") === "1";
    const cref = params.get("category");
    if (cref) activeFilters.category = cref;

    const qEl = $("#shop_search");
    if (qEl) qEl.value = activeFilters.search;
    const count = $("#results_count");

    const [products, categories] = await Promise.all([
      REC.products.getProducts({ active: true }),
      REC.products.getCategories(),
    ]);
    allProducts = products;
    cats = categories;
    buildCategoryFilters();
    applyFilters();
  }

  function buildCategoryFilters() {
    const hosts = [$("#filter_categories"), $("#filter_categories_mobile")].filter(Boolean);
    const paramCatSlug = activeFilters.category;
    // Match slug or name
    const currentCat = cats.find(
      (c) => c.slug === paramCatSlug || String(c.id) === paramCatSlug || c.name === paramCatSlug
    );
    if (currentCat) activeFilters.category = currentCat.slug;
    const allBtn = categoryBtn(null, "All Categories");
    const btns = [allBtn].concat(cats.map((c) => categoryBtn(c.slug, c.name)));
    hosts.forEach((host) => {
      host.innerHTML = btns.join("");
      host.querySelectorAll("[data-sel]").forEach((el) => {
        el.addEventListener("click", () => {
          const slug = el.getAttribute("data-sel");
          activeFilters.category = slug === "" ? null : slug;
          applyFilters();
          setActiveCatBtn();
          if (win.innerWidth <= 1024) closeFilters();
        });
      });
    });
    setActiveCatBtn();
  }

  function categoryBtn(slug, name) {
    return (
      '<button type="button" class="btn-link" data-sel="' + (slug || "") + '" style="width:100%;justify-content:space-between;padding:.45rem .2rem;color:var(--ink-2)">' +
      '<span>' + UI.esc(name) + "</span>" +
      UI.icon("i-chevron-right").replace('<svg', '<svg width="14" height="14"') +
      "</button>"
    );
  }

  function setActiveCatBtn() {
    const host = $("#filter_categories");
    if (!host) return;
    host.querySelectorAll("[data-sel]").forEach((el) => {
      const on = el.getAttribute("data-sel") === (activeFilters.category || "");
      el.style.color = on ? "var(--rec-green)" : "var(--ink-2)";
      el.style.fontWeight = on ? "800" : "700";
    });
  }

  function applyFilters() {
    let list = allProducts.slice();
    if (activeFilters.search) {
      const s = activeFilters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.description || "").toLowerCase().includes(s)
      );
    }
    if (activeFilters.category) {
      list = list.filter(
        (p) =>
          p.category_slug === activeFilters.category ||
          String(p.category_id) === activeFilters.category
      );
    }
    if (activeFilters.availability === "in") list = list.filter((p) => p.in_stock);
    if (activeFilters.availability === "out") list = list.filter((p) => !p.in_stock);
    if (activeFilters.featured) list = list.filter((p) => p.featured);
    if (activeFilters.priceMax != null) list = list.filter((p) => p.price <= activeFilters.priceMax);

    switch (activeFilters.sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        list.sort((a, b) => (b.featured === a.featured ? 0 : b.featured ? 1 : -1));
    }

    filtered = list;
    shown = PAGE_SIZE;
    const count = $("#results_count");
    if (count) count.textContent = list.length;
    renderGrid();
  }

  function renderGrid() {
    const grid = $("#shop_grid");
    if (!grid) return;
    if (!filtered.length) {
      grid.innerHTML = UI.emptyState(
        "No products match your filters",
        "Try adjusting the search or filter options.",
        '<a class="btn btn-primary" style="margin-top:1rem" href="shop.html">Clear Filters</a>'
      );
      $("#load_more").style.display = "none";
      return;
    }
    grid.innerHTML = filtered
      .slice(0, shown)
      .map((p) => REC.render.productCard(p))
      .join("");
    UI.initReveal();
    REC.render.bindCommonActions(REC.products.getProduct);

    const btn = $("#load_more");
    if (shown >= filtered.length) {
      btn.style.display = "none";
    } else {
      btn.style.display = "inline-flex";
    }
  }

  function bindEvents() {
    const form = $("#shop_search_form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        activeFilters.search = ($("#shop_search").value || "").trim();
        applyFilters();
      });
    }
    $("#sort_select") &&
      $("#sort_select").addEventListener("change", (e) => {
        activeFilters.sort = e.target.value;
        applyFilters();
      });

    const priceInput = $("#price_max");
    const priceLabel = $("#price_max_label");
    if (priceInput) {
      priceInput.addEventListener("input", () => {
        activeFilters.priceMax = null;
        if (priceLabel) priceLabel.textContent = UI.money(priceInput.value) + " +";
        if (Number(priceInput.value) > 0) activeFilters.priceMax = Number(priceInput.value);
        applyFilters();
      });
    }
    ["availability_in", "availability_out", "only_featured"].forEach((id) => {
      const el = $("#" + id);
      if (el) {
        el.addEventListener("change", () => {
          activeFilters.availability = $("#availability_in").checked
            ? "in"
            : $("#availability_out").checked
            ? "out"
            : "all";
          activeFilters.featured = $("#only_featured").checked;
          applyFilters();
        });
      }
    });
    $("#filter_reset") &&
      $("#filter_reset").addEventListener("click", (e) => {
        e.preventDefault();
        activeFilters = {
          category: null, availability: "all", priceMax: null,
          featured: false, search: "", sort: activeFilters.sort,
        };
        $("#price_max") && ($("#price_max").value = 0);
        $("#shop_search").value = "";
        $("#sort_select") && ($("#sort_select").value = "newest");
        ["availability_in", "availability_out", "only_featured"].forEach((id) => {
          const el = $("#" + id);
          if (el) el.checked = false;
        });
        applyFilters();
        setActiveCatBtn();
      });
    $("#load_more") &&
      $("#load_more").addEventListener("click", () => {
        shown += PAGE_SIZE;
        renderGrid();
      });

    $("#shop_filters_btn") &&
      $("#shop_filters_btn").addEventListener("click", openFilters);
    $("#fd_close") && $("#fd_close").addEventListener("click", closeFilters);
    $("#fd_backdrop") && $("#fd_backdrop").addEventListener("click", closeFilters);

    // Mobile drawer sync
    const mPrice = $("#price_max_m");
    const mIn = $("#availability_in_m");
    const mOut = $("#availability_out_m");
    const setDesktopAvailability = () => {
      if ($("#availability_in")) $("#availability_in").checked = activeFilters.availability === "in";
      if ($("#availability_out")) $("#availability_out").checked = activeFilters.availability === "out";
    };
    const syncMobile = () => {
      if (mPrice) mPrice.value = activeFilters.priceMax || 0;
      if (mIn) mIn.checked = activeFilters.availability === "in";
      if (mOut) mOut.checked = activeFilters.availability === "out";
    };
    setDesktopAvailability();
    syncMobile();
    if (mPrice) {
      mPrice.addEventListener("input", () => {
        activeFilters.priceMax = Number(mPrice.value) > 0 ? Number(mPrice.value) : null;
        const desktop = $("#price_max");
        if (desktop && Number(mPrice.value) > 0) desktop.value = mPrice.value;
      });
    }
    if (mIn || mOut) {
      const handler = () => {
        activeFilters.availability = mIn.checked ? "in" : mOut.checked ? "out" : "all";
        setDesktopAvailability();
      };
      if (mIn) mIn.addEventListener("change", handler);
      if (mOut) mOut.addEventListener("change", handler);
    }
    $("#fd_apply") &&
      $("#fd_apply").addEventListener("click", () => {
        applyFilters();
        closeFilters();
      });
  }

  function openFilters() {
    const drawer = $("#filters_drawer");
    if (drawer) drawer.classList.add("open");
  }
  function closeFilters() {
    const drawer = $("#filters_drawer");
    if (drawer) drawer.classList.remove("open");
  }

  document.addEventListener("DOMContentLoaded", () => {
    init();
    bindEvents();
  });
})(window);