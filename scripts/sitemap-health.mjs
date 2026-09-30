/* Sitemap health gate.
 *
 * Local (always): _site/sitemap-index.xml parses, every child it lists exists in _site, parses,
 * is non-empty, and every <loc> (index + children) is on the canonical host.
 *
 * Live (production): fetches the index and each child from the canonical host exactly as
 * Googlebot would and requires 200, an XML content type, zero redirects, no X-Robots-Tag noindex
 * and no long-lived Cache-Control. This is the check that would have caught the Sep 2026 redirect
 * loop. If the network is unreachable the live half is skipped with a warning (so offline local
 * runs still pass); set SITEMAP_HEALTH_STRICT=1 to make that a failure instead.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PRODUCTION_URL } = require("./site-url.js");

const SITE = path.resolve("_site");
const BASE = (process.env.SITEMAP_HEALTH_BASE || PRODUCTION_URL).replace(/\/$/, "");
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const MAX_CACHE_SECONDS = 3600;

const errors = [];
const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
const wellFormed = (xml) => /^<\?xml[^>]*\?>\s*<(urlset|sitemapindex)\b[\s\S]*<\/\1>\s*$/.test(xml.trim());

// ---- Local ----
const indexFile = path.join(SITE, "sitemap-index.xml");
if (!fs.existsSync(indexFile)) {
  console.error("sitemap-health: _site/sitemap-index.xml missing — run the build first.");
  process.exit(1);
}
const indexXml = fs.readFileSync(indexFile, "utf8");
if (!wellFormed(indexXml)) errors.push("sitemap-index.xml is not a well-formed <sitemapindex>");
const children = locs(indexXml);
if (!children.length) errors.push("sitemap-index.xml lists no child sitemaps");

let urlCount = 0;
for (const child of [`${BASE}/sitemap-index.xml`, ...children]) {
  if (!child.startsWith(BASE + "/")) errors.push(`index entry not on canonical host ${BASE}: ${child}`);
}
for (const child of children) {
  const rel = child.replace(/^https?:\/\/[^/]+/, "");
  const file = path.join(SITE, rel);
  if (!fs.existsSync(file)) { errors.push(`${rel}: listed in index but not built`); continue; }
  const xml = fs.readFileSync(file, "utf8");
  if (!wellFormed(xml)) errors.push(`${rel}: not a well-formed <urlset>`);
  const urls = locs(xml);
  if (!urls.length) errors.push(`${rel}: listed in index but has 0 URLs`);
  const offHost = urls.filter((u) => !u.startsWith(BASE + "/"));
  if (offHost.length) errors.push(`${rel}: ${offHost.length} <loc> not on ${BASE} (e.g. ${offHost[0]})`);
  urlCount += urls.length;
}

// ---- Live ----
async function liveCheck(url) {
  const problems = [];
  const res = await fetch(url, { redirect: "manual", headers: { "user-agent": UA } });
  const type = res.headers.get("content-type") || "";
  const robots = res.headers.get("x-robots-tag") || "";
  const cache = res.headers.get("cache-control") || "";
  const maxAge = Number((cache.match(/max-age=(\d+)/) || [])[1] || 0);
  if (res.status >= 300 && res.status < 400) problems.push(`redirects (${res.status} → ${res.headers.get("location")})`);
  else if (res.status !== 200) problems.push(`HTTP ${res.status}`);
  if (!/^(application|text)\/xml\b/i.test(type)) problems.push(`content-type "${type}"`);
  if (/noindex/i.test(robots)) problems.push(`X-Robots-Tag "${robots}"`);
  if (maxAge > MAX_CACHE_SECONDS) problems.push(`Cache-Control max-age=${maxAge}s (stale copies)`);
  return { url, status: res.status, type, problems };
}

let liveRan = false;
try {
  const targets = [`${BASE}/sitemap-index.xml`, `${BASE}/robots.txt`, ...children];
  const results = await Promise.all(targets.map((u) => liveCheck(u)));
  liveRan = true;
  for (const r of results) {
    const isRobots = r.url.endsWith("/robots.txt");
    const probs = isRobots ? r.problems.filter((p) => !p.startsWith("content-type")) : r.problems;
    const label = r.url.replace(BASE, "");
    console.log(`  ${label.padEnd(24)} ${r.status} ${r.type}${probs.length ? "  ✖ " + probs.join("; ") : ""}`);
    probs.forEach((p) => errors.push(`live ${label}: ${p}`));
  }
} catch (e) {
  const msg = `live check skipped — could not reach ${BASE} (${e.cause?.code || e.message})`;
  if (process.env.SITEMAP_HEALTH_STRICT === "1") errors.push(msg);
  else console.warn(`  ⚠ ${msg}`);
}

if (errors.length) {
  console.error(`\nSitemap health FAILED — ${errors.length} issue(s):\n`);
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log(
  `Sitemap health passed — ${children.length} child sitemaps, ${urlCount} URLs, all on ${BASE}` +
    (liveRan ? "; live: 200 XML, 0 redirects, no noindex." : " (local only).")
);
