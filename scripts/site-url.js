// Single source of truth for the site's absolute base URL. Used by .eleventy.js (absUrl
// filter default) and src/_data/site.js (site.url / site.domain), so canonicals, hreflang,
// sitemaps, robots.txt, schema and OG tags can never disagree about what host the site is
// "on" for a given build.
//
// Priority: explicit SITE_URL override > the production domain for Netlify production builds >
// DEPLOY_PRIME_URL (so deploy previews and branch deploys canonicalize to themselves) > the
// production domain as the fallback for local builds run with no env vars set.
//
// Netlify's `URL` is deliberately NOT used: it is whatever the primary domain is set to in the
// Netlify UI, so flipping that setting (e.g. to the apex) would silently move every canonical
// off www.greenplusexim.com.
const PRODUCTION_URL = "https://www.greenplusexim.com";

function getSiteUrl() {
  const isProduction = process.env.CONTEXT === "production";
  const raw =
    process.env.SITE_URL ||
    (isProduction ? PRODUCTION_URL : process.env.DEPLOY_PRIME_URL) ||
    PRODUCTION_URL;
  return raw.replace(/\/$/, "");
}

module.exports = { getSiteUrl, PRODUCTION_URL };
