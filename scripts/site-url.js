// Single source of truth for the site's absolute base URL. Used by .eleventy.js (absUrl
// filter default) and src/_data/site.js (site.url / site.domain), so canonicals, hreflang,
// sitemaps, robots.txt, schema and OG tags can never disagree about what host the site is
// "on" for a given build.
//
// Priority: explicit SITE_URL override > Netlify's own build-time URL (so deploy previews and
// branch deploys canonicalize to themselves, not to production) > the production domain as the
// last-resort fallback for local builds run with no env vars set.
const PRODUCTION_URL = "https://www.greenplusexim.com";

function getSiteUrl() {
  const raw = process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || PRODUCTION_URL;
  return raw.replace(/\/$/, "");
}

module.exports = { getSiteUrl, PRODUCTION_URL };
