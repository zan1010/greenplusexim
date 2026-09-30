// Build-time environment values templates may read. Kept to an explicit allowlist so nothing
// secret from the Netlify build environment can leak into rendered HTML.
module.exports = () => ({
  CONTEXT: process.env.CONTEXT || "",
  // Search-engine ownership codes: paste the value into Netlify → Site configuration →
  // Environment variables and redeploy, no code change needed. Falls back to site.base.json.
  BING_SITE_VERIFICATION: process.env.BING_SITE_VERIFICATION || "",
  GOOGLE_SITE_VERIFICATION: process.env.GOOGLE_SITE_VERIFICATION || "",
});
