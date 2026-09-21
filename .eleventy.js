const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const Image = require("@11ty/eleventy-img");
const fs = require("fs");
const path = require("path");

function slugifyStr(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  eleventyConfig.addGlobalData("currentYear", () => new Date().getFullYear());
  eleventyConfig.addGlobalData("buildDate", () => new Date().toISOString().split("T")[0]);

  // Passthrough static assets
  eleventyConfig.addPassthroughCopy("src/assets/css");
  eleventyConfig.addPassthroughCopy("src/assets/js");
  eleventyConfig.addPassthroughCopy("src/assets/img");
  eleventyConfig.addPassthroughCopy("src/assets/fonts");
  eleventyConfig.addPassthroughCopy("src/assets/icons.svg");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");

  eleventyConfig.setLibrary("md-it", require("./scripts/markdown-config.js"));

  // ---- Filters ----
  eleventyConfig.addFilter("absUrl", (url, base = "https://www.greenplusexim.com") => {
    if (!url) return base;
    return url.startsWith("http") ? url : base.replace(/\/$/, "") + url;
  });

  eleventyConfig.addFilter("dateIso", (d) => {
    if (!d) return "";
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().split("T")[0];
  });

  eleventyConfig.addFilter("dateDisplay", (d) => {
    if (!d) return "";
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  });

  eleventyConfig.addFilter("jsonify", (obj) => JSON.stringify(obj));

  eleventyConfig.addFilter("slugify", slugifyStr);

  eleventyConfig.addFilter("limit", (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : arr));

  eleventyConfig.addFilter("where", (arr, key, value) =>
    Array.isArray(arr) ? arr.filter((item) => item[key] === value) : []
  );

  eleventyConfig.addFilter("breadcrumbSchema", (breadcrumbs, siteUrl, pageUrl) => {
    const items = [{ "@type": "ListItem", position: 1, name: "Home", item: siteUrl + "/" }];
    (breadcrumbs || []).forEach((c, i) => {
      items.push({
        "@type": "ListItem",
        position: i + 2,
        name: c.label,
        item: siteUrl + (c.url || pageUrl),
      });
    });
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items,
    });
  });

  // Build-time inline SVG bar chart from trade data — no chart library, no client JS.
  eleventyConfig.addShortcode("barChart", (rows, opts = {}) => {
    // Chart USD value where available; fall back to quantity when the source only
    // published volumes (e.g. MPEDA's shrimp data). Never charts a row with neither.
    const all = rows || [];
    const useValue = all.some((r) => typeof r.value_usd === "number" && r.value_usd > 0);
    const field = useValue ? "value_usd" : "qty";
    const data = all.filter((r) => typeof r[field] === "number" && r[field] > 0);
    if (!data.length) return "";
    const unit = useValue ? "usd" : (data[0].qty_unit || "");
    const label = opts.label || "Export value";
    const max = Math.max(...data.map((r) => r[field]));
    const barH = 30;
    const gap = 12;
    const labelW = 150;
    const chartW = 620;
    const barMaxW = chartW - labelW - 90;
    const height = data.length * (barH + gap) + 24;

    const fmt = (n) => {
      if (unit !== "usd") return new Intl.NumberFormat("en-US").format(n) + " " + unit;
      if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
      if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
      if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
      return "$" + n;
    };

    const bars = data
      .map((r, i) => {
        const y = i * (barH + gap) + 8;
        const w = Math.max(2, Math.round((r[field] / max) * barMaxW));
        const escName = String(r.country).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return (
          `<text x="0" y="${y + barH / 2 + 5}" font-size="14" fill="#14201B">${escName}</text>` +
          `<rect x="${labelW}" y="${y}" width="${w}" height="${barH}" fill="#2E7D4F" rx="4"></rect>` +
          `<text x="${labelW + w + 10}" y="${y + barH / 2 + 5}" font-size="13" fill="#45564D">${fmt(r.value_usd)}</text>`
        );
      })
      .join("");

    const escLabel = label.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return (
      `<div class="chart-wrap" role="img" aria-label="${escLabel}">` +
      `<svg viewBox="0 0 ${chartW} ${height}" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">${bars}</svg>` +
      `</div>`
    );
  });

  // Joins the HS-code table with the map of product pages that actually exist,
  // so category cards link only where there's a page to link to.
  eleventyConfig.addFilter("withUrls", (hsRows, productPages) =>
    (hsRows || []).map((row) => ({
      label: row.product,
      hs: row.hs,
      url: (productPages || {})[row.product] || null,
    }))
  );

  eleventyConfig.addFilter("itemListSchema", (items, siteUrl) =>
    (items || []).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.label,
      url: p.url ? siteUrl + p.url : undefined,
    }))
  );

  // Trade-data `hs` fields sometimes carry an explanatory tail
  // ("0904.21 / 0904.22 (dried chilli...); WITS legacy 0904.20") — keep the codes, drop the prose.
  eleventyConfig.addFilter("truncateHs", (hs) => String(hs || "").split("(")[0].trim());

  // Safe i18n lookup: {{ i18n | t(lang, "fullName") }} — falls back to English, then the key itself.
  eleventyConfig.addFilter("t", (i18nData, lang, key) => {
    const dict = (i18nData && i18nData[lang]) || {};
    const en = (i18nData && i18nData.en) || {};
    return dict[key] || en[key] || key;
  });

  eleventyConfig.addFilter("citationUrls", (sources) => (sources || []).map((s) => s.url));

  // Aggregates a region's total India-export value per product across its member countries,
  // using only real cited figures already in countryTradeIndex — no invented numbers.
  eleventyConfig.addFilter("regionTopProducts", (iso2List, countryTradeIndex, limit = 6) => {
    const totals = {}; // product -> { value, countries: Set, year, source_name, source_url }
    for (const iso2 of iso2List || []) {
      for (const row of countryTradeIndex[iso2] || []) {
        if (typeof row.value_usd !== "number") continue;
        const key = row.product;
        if (!totals[key]) totals[key] = { product: row.product, country: row.product, value_usd: 0, countries: new Set(), year: row.year, source_name: row.source_name, source_url: row.source_url };
        totals[key].value_usd += row.value_usd;
        totals[key].countries.add(iso2);
      }
    }
    return Object.values(totals)
      .sort((a, b) => b.value_usd - a.value_usd)
      .slice(0, limit)
      .map((t) => ({ ...t, countryCount: t.countries.size }));
  });

  eleventyConfig.addFilter("hasQty", (rows) =>
    (rows || []).some((r) => typeof r.qty === "number" && r.qty > 0)
  );

  eleventyConfig.addFilter("schemaProps", (specs) =>
    (specs || []).map((s) => ({ "@type": "PropertyValue", name: s.name, value: s.value }))
  );

  eleventyConfig.addFilter("faqSchema", (faqs) => {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: (faqs || []).map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  });

  eleventyConfig.addFilter("definedTermSetSchema", (terms, siteUrl) => {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      name: "Green Plus EXIM Export Glossary",
      hasDefinedTerm: (terms || []).map((t) => ({
        "@type": "DefinedTerm",
        name: t.term,
        description: t.def,
        url: siteUrl + "/resources/glossary/#" + slugifyStr(t.term),
      })),
    });
  });

  eleventyConfig.addFilter("money", (n) => {
    if (typeof n !== "number") return n;
    return new Intl.NumberFormat("en-US").format(n);
  });

  // ---- Collections ----
  eleventyConfig.addCollection("products", (api) =>
    api.getFilteredByGlob("src/products/**/*.njk").filter((p) => p.data.type === "product")
  );

  eleventyConfig.addCollection("productCategories", (api) =>
    api.getFilteredByGlob("src/products/**/*.njk").filter((p) => p.data.type === "category")
  );

  eleventyConfig.addCollection("productCountryPairs", (api) =>
    api.getFilteredByGlob("src/products/**/*.njk").filter((p) => p.data.type === "product-country")
  );

  eleventyConfig.addCollection("countries", (api) =>
    api.getFilteredByGlob("src/markets/**/*.njk").filter((p) => p.data.type === "country")
  );

  eleventyConfig.addCollection("regions", (api) =>
    api.getFilteredByGlob("src/markets/**/*.njk").filter((p) => p.data.type === "region")
  );

  // Blog posts are .njk files (front matter + raw HTML body), not .md — matched by requiring
  // `slug` in front matter, which every real post sets and the blog index/hub pages don't.
  eleventyConfig.addCollection("blogEn", (api) =>
    api.getFilteredByGlob("src/blog/**/*.njk").filter((p) => p.data.slug).sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addCollection("corePages", (api) =>
    api
      .getFilteredByGlob([
        "src/pages/**/*.njk",
        "src/index.njk",
        "src/products/index.njk",
        "src/products/compare.njk",
        "src/markets/index.njk",
        "src/blog/index.njk",
        "src/authors/**/*.njk",
      ])
      .filter((p) => !p.data.noindex)
  );

  eleventyConfig.addCollection("blogIntl", (api) =>
    api
      .getFilteredByGlob("src/{es,pt,fr,de,nl,ar,id,vi,ms}/blog/**/*.njk")
      .filter((p) => p.data.slug)
      .sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addCollection("blogAll", (api) =>
    api
      .getFilteredByGlob(["src/blog/**/*.njk", "src/{es,pt,fr,de,nl,ar,id,vi,ms}/blog/**/*.njk"])
      .filter((p) => p.data.slug)
      .sort((a, b) => b.date - a.date)
  );

  // ---- Responsive image shortcode (AVIF/WebP + fallback, logs placeholders) ----
  const IMAGES_TODO_PATH = path.join(__dirname, "IMAGES_TODO.md");
  const loggedPlaceholders = new Set();

  function logPlaceholder(src, context) {
    if (!/unsplash|pexels/i.test(src) || loggedPlaceholders.has(src)) return;
    loggedPlaceholders.add(src);
    try {
      const line = `- [ ] ${context || "Placeholder"}: ${src}\n`;
      fs.appendFileSync(IMAGES_TODO_PATH, line);
    } catch (e) {
      /* non-fatal */
    }
  }

  eleventyConfig.addAsyncShortcode("respImg", async function (src, alt, opts = {}) {
    if (!alt && alt !== "") throw new Error(`Missing alt text for image: ${src}`);
    logPlaceholder(src, opts.context);
    try {
      const metadata = await Image(src, {
        widths: opts.widths || [400, 800, 1200, 1600],
        formats: ["avif", "webp", "jpeg"],
        outputDir: "_site/assets/img/optimized/",
        urlPath: "/assets/img/optimized/",
        filenameFormat: (id, srcPath, width, format) => {
          const name = path.basename(srcPath, path.extname(srcPath)).replace(/[^a-z0-9-]/gi, "-");
          return `${name}-${width}w-${id}.${format}`;
        },
      });
      const imageAttributes = {
        alt,
        sizes: opts.sizes || "100vw",
        loading: opts.priority ? "eager" : "lazy",
        decoding: "async",
      };
      if (opts.priority) imageAttributes.fetchpriority = "high";
      return Image.generateHTML(metadata, imageAttributes, {
        whitespaceMode: "inline",
      });
    } catch (e) {
      // Network unavailable at build time — fall back to a plain tag so the build never breaks.
      const w = opts.fallbackWidth || 1200;
      const h = opts.fallbackHeight || 800;
      return `<img src="${src}" alt="${alt}" width="${w}" height="${h}" loading="${opts.priority ? "eager" : "lazy"}" ${opts.priority ? 'fetchpriority="high"' : ""}>`;
    }
  });

  // ---- Layout aliases ----
  eleventyConfig.addLayoutAlias("base", "layouts/base.njk");
  eleventyConfig.addLayoutAlias("page", "layouts/page.njk");
  eleventyConfig.addLayoutAlias("product", "layouts/product.njk");
  eleventyConfig.addLayoutAlias("market", "layouts/market.njk");
  eleventyConfig.addLayoutAlias("blog", "layouts/blog.njk");

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "md", "11ty.js"],
  };
};
