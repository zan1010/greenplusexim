/* Inverts the trade-data files into a country-keyed index, so a market page can show
   "products India exports to <country>" using only figures that are already sourced and cited.
   Keyed by ISO2. Each entry carries the product, value/qty and the citation from its source file. */
const fs = require("fs");
const path = require("path");

module.exports = function () {
  const dir = path.join(__dirname, "trade-data");
  const index = {};
  if (!fs.existsSync(dir)) return index;

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    let td;
    try {
      td = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    } catch (e) {
      continue;
    }
    for (const row of td.india_exports_by_country || []) {
      if (!row.iso2) continue; // regional aggregates (e.g. "European Union") have no ISO2
      (index[row.iso2] = index[row.iso2] || []).push({
        product: td.product,
        hs: td.hs,
        slug: file.replace(/\.json$/, ""),
        value_usd: row.value_usd,
        qty: row.qty,
        qty_unit: row.qty_unit,
        year: td.year,
        source_name: td.source_name,
        source_url: td.source_url,
        india_world_total_usd: td.india_world_total_usd,
      });
    }
  }

  // Rank each country's products by export value where known, so the biggest lines lead.
  for (const iso2 of Object.keys(index)) {
    index[iso2].sort((a, b) => (b.value_usd || 0) - (a.value_usd || 0));
  }
  return index;
};
