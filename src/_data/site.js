// Wraps site.base.json and overrides url/domain with the single computed SITE_URL (see
// scripts/site-url.js) so every template that reads `site.url` / `site.domain` — canonicals,
// hreflang, sitemaps, robots.txt, JSON-LD, OG tags — agrees with the absUrl filter default in
// .eleventy.js. Never hardcode the domain in a template; read it from `site.url`.
const { getSiteUrl } = require("../../scripts/site-url.js");
const base = require("./site.base.json");

module.exports = () => {
  const url = getSiteUrl();
  return { ...base, url, domain: url };
};
