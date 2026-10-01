/* Insight / targeting-depth gate for English blog posts, plus a site-wide anchor-text check.
 *
 * Per post (enforced on every post that has a Key takeaways block, i.e. has been through the
 * insight pass; set INSIGHT_STRICT=1 — or flip STRICT below once every post is done — to require
 * it of all posts):
 *   - >= 4 question-shaped H2s ("What documents…?", "How much … fits in a 20ft container?")
 *   - >= 3 insight sections, each wrapped in <!-- insight:TYPE --> … <!-- /insight --> with TYPE
 *     from INSIGHT_TYPES, and each containing a number or a "Scenario:" lead
 *   - a Key takeaways block with exactly 5 items
 *   - term-set coverage >= 70% (research/term-sets.json)
 *
 * Site-wide: for every internal target linked from main content at least 5 times, no single
 * anchor phrase may account for more than 60% of those links (buttons and breadcrumbs excluded).
 *
 *   node scripts/check-blog-insight.mjs [--report]   (--report prints per-post metrics as JSON)
 */
import fs from "node:fs";
import path from "node:path";

const SITE = path.resolve("_site");
const BLOG = path.join(SITE, "blog");
const TERMS = JSON.parse(fs.readFileSync(path.resolve("research/term-sets.json"), "utf8"));
const STRICT = process.env.INSIGHT_STRICT === "1";
const COVERAGE_MIN = 0.7;

export const INSIGHT_TYPES = [
  "cost-buildup", "container-economics", "price-mechanism", "policy-timeline", "origin-comparison",
  "seasonality", "rejection-patterns", "spec-to-application", "buyer-segmentation", "documentation-failures",
];
const QUESTION_START = /^(what|how|which|why|when|where|who|whose|can|could|do|does|did|is|are|should|will|would)\b/i;
const TEMPLATE_H2 = [/commercial facts$/i, /^where india exports/i, /^documentation checklist/i, /^frequently asked questions$/i,
  /^sources$/i, /^related reading$/i, /^key takeaways$/i, /^request an? .* quote$/i, /^get your export quote$/i];

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
const text = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function coverage(slug, mainText) {
  const cfg = TERMS.posts[slug];
  if (!cfg) return null;
  // Coverage is measured on the product + destination vocabulary — the expert signal. Shared trade
  // terms (FOB, B/L, phytosanitary…) appear on almost any export page, so they'd only dilute it.
  const set = [...(TERMS.products[cfg.product] || []), ...cfg.destinations.flatMap((d) => TERMS.destinations[d] || [])];
  const lower = mainText.toLowerCase();
  const missing = [];
  let hit = 0;
  for (const variants of set) {
    const found = variants.some((v) => new RegExp(`(^|[^a-z0-9])${esc(v.toLowerCase())}($|[^a-z0-9])`).test(lower));
    if (found) hit++; else missing.push(variants[0]);
  }
  return { ratio: hit / set.length, hit, total: set.length, missing };
}

const issues = [], pending = [], report = [];
const slugs = fs.readdirSync(BLOG).filter((d) => fs.existsSync(path.join(BLOG, d, "index.html")));
for (const slug of slugs) {
  const html = fs.readFileSync(path.join(BLOG, slug, "index.html"), "utf8");
  if (!/<html[^>]*lang="en"/.test(html)) continue;
  const main = (html.match(/<main[\s\S]*?<\/main>/) || [html])[0];
  const rel = `blog/${slug}`;

  const h2s = [...main.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => text(m[1]).trim());
  const own = h2s.filter((h) => !TEMPLATE_H2.some((re) => re.test(h)));
  const questions = own.filter((h) => h.endsWith("?") || QUESTION_START.test(h));

  const insights = [...main.matchAll(/<!--\s*insight:([a-z-]+)\s*-->([\s\S]*?)<!--\s*\/insight\s*-->/g)].map((m) => ({ type: m[1], body: text(m[2]) }));
  const takeaways = (main.match(/id="key-takeaways"[\s\S]*?<\/ol>/) || [""])[0];
  const takeawayCount = (takeaways.match(/<li\b/g) || []).length;
  const cov = coverage(slug, text(main));

  report.push({ slug, questionH2: questions.length, insights: insights.map((i) => i.type), takeaways: takeawayCount,
    termCoverage: cov ? Math.round(cov.ratio * 100) : null, missingTerms: cov ? cov.missing : [] });

  const upgraded = takeawayCount > 0;
  if (!upgraded && !STRICT) { pending.push(slug); continue; }

  if (questions.length < 4) issues.push(`${rel}: ${questions.length} question-shaped H2s (need >= 4)`);
  if (insights.length < 3) issues.push(`${rel}: ${insights.length} insight sections (need >= 3, wrapped in <!-- insight:TYPE --> … <!-- /insight -->)`);
  for (const i of insights) {
    if (!INSIGHT_TYPES.includes(i.type)) issues.push(`${rel}: unknown insight type "${i.type}" (allowed: ${INSIGHT_TYPES.join(", ")})`);
    if (!/\d/.test(i.body) && !/scenario:/i.test(i.body)) issues.push(`${rel}: insight "${i.type}" has no number or "Scenario:" — adjectives only`);
  }
  if (new Set(insights.map((i) => i.type)).size < insights.length) issues.push(`${rel}: the same insight type is used twice`);
  if (takeawayCount !== 5) issues.push(`${rel}: Key takeaways has ${takeawayCount} items (need exactly 5)`);
  if (!cov) issues.push(`${rel}: no term set in research/term-sets.json`);
  else if (cov.ratio < COVERAGE_MIN) issues.push(`${rel}: term coverage ${Math.round(cov.ratio * 100)}% (need >= 70%); missing: ${cov.missing.join(", ")}`);
}

// ---- Site-wide anchor-text variety ----
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".html") ? [path.join(d, e.name)] : []);
const anchors = new Map();
for (const file of walk(SITE)) {
  const html = fs.readFileSync(file, "utf8");
  if (/name="robots" content="noindex/.test(html) || file.endsWith(path.join("sitemap", "index.html"))) continue; // HTML sitemap is a directory, not editorial
  let main = (html.match(/<main[\s\S]*?<\/main>/) || [""])[0];
  main = main
    .replace(/<nav\b[\s\S]*?<\/nav>/g, " ") // breadcrumbs
    .replace(/<form\b[\s\S]*?<\/form>/g, " "); // form consent/legal links
  for (const m of main.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const attrs = m[1];
    if (/class="[^"]*\bbtn\b/.test(attrs) || /class="[^"]*\bcard\b/.test(attrs)) continue; // CTAs and card grids
    const href = (attrs.match(/href="(\/[^"#?]*)"/) || [])[1];
    if (!href || href.startsWith("/authors/")) continue; // author bylines are structural
    const label = text(m[2]).trim().toLowerCase();
    if (!label) continue;
    if (!anchors.has(href)) anchors.set(href, new Map());
    const per = anchors.get(href);
    per.set(label, (per.get(label) || 0) + 1);
  }
}
for (const [href, per] of anchors) {
  const total = [...per.values()].reduce((a, b) => a + b, 0);
  if (total < 5) continue;
  const [topLabel, topCount] = [...per.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCount / total > 0.6) {
    issues.push(`anchor text: ${Math.round((topCount / total) * 100)}% of ${total} in-content links to ${href} say "${topLabel}" (max 60%) — vary it`);
  }
}

if (process.argv.includes("--report")) console.log(JSON.stringify(report, null, 1));
if (issues.length) {
  console.error(`\nBlog insight check FAILED — ${issues.length} issue(s):\n`);
  issues.forEach((i) => console.error("  " + i));
  if (pending.length) console.error(`\n  (${pending.length} post(s) not yet through the insight pass: ${pending.join(", ")})`);
  process.exit(1);
}
console.log(`Blog insight check passed — ${slugs.length - pending.length} post(s) meet the insight standard` +
  (pending.length ? `; ${pending.length} pending the insight pass` : "") + "; anchor text varied site-wide.");
