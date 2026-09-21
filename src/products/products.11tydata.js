/* Derives each category page's product list from the (research-maintained) HS code table,
   joined against the map of product pages that actually exist. Keeps category pages in sync
   automatically when a research pass corrects an HS code or a new product page is added. */
module.exports = {
  eleventyComputed: {
    categoryProducts: (data) => {
      if (data.type !== "category") return null;
      // `hsProducts` picks specific products by name (used where two site categories
      // share one HS-table category, e.g. fertilizers vs organic manure).
      const rows = data.hsProducts
        ? (data.hsCodes || []).filter((r) => data.hsProducts.includes(r.product))
        : data.hsCategory
        ? (data.hsCodes || []).filter((r) => r.category === data.hsCategory)
        : [];
      if (!rows.length) return null;
      const pages = data.productPages || {};
      return rows.map((r) => ({
        label: r.product,
        hs: r.hs,
        url: pages[r.product] || null,
      }));
    },
  },
};
