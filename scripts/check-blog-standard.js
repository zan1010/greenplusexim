/* Enforces the 2026 blog content standard (reports/blog-overhaul.md) on every post that has
   opted in by declaring `commercialFacts` in its front matter — i.e. every post that has been
   rebuilt to the new standard. Posts not yet migrated are left to the lighter, universal
   check-blog-quality.js gate so the overhaul can proceed batch-by-batch without breaking the
   build for posts not yet touched. Once every post is migrated this script covers 100% of them.

   English posts only — the standard (and its sourcing/authority requirements) is scoped to
   English for now; localized posts stay under check-blog-quality.js + the reviewed/noindex gate
   until the localized program (blog-overhaul.md §4) builds them to an equivalent bar. */
const fs = require("fs");
const path = require("path");

const SITE_ROOT = path.join(__dirname, "..", "_site");
const BLOG_DIR = path.join(SITE_ROOT, "blog");

const WORD_COUNT_MIN = { "buyer-guides": 2000, default: 1600 };

const REQUIRED_CF_FIELDS = [
  "HS code", "Product forms / grades offered", "Typical specification ranges",
  "Packaging options", "Net weight per 20ft / 40ft container", "MOQ", "Loading port(s)",
  "Destination port(s) for this market", "Transit time", "Incoterms quoted",
  "Payment terms available", "Lead time from order confirmation", "Shelf life / storage",
];

// Official destination-authority / primary-dataset domains. Extend as new markets are covered.
const AUTHORITY_ALLOW_PATTERNS = [
  /\.gov(\.|\/|$)/i, /\.gov\.[a-z]{2}/i, /europa\.eu/i, /apeda\.gov\.in/i, /dgft\.gov\.in/i,
  /customs\.gov/i, /gacc\.gov\.cn/i, /moccae\.gov\.ae/i, /fda\.gov/i,
  /fsis\.usda\.gov/i, /usda\.gov/i, /bstiportal\.gov\.bd/i, /apeda\.in/i, /wits\.worldbank\.org/i,
  /comtrade\.un\.org/i, /mpeda\.gov\.in/i, /ippc\.int/i,
  // GACC's official CIFER registration portal for overseas food-facility registration (Decree
  // 248) is hosted on singlewindow.cn, not a gacc.gov.cn URL — verified as the sole official
  // portal (GACC explicitly warns against lookalike domains), so allowlisted explicitly.
  /cifer(query)?\.singlewindow\.cn/i,
  // Indonesia's government TLD is .go.id, not .gov.id — bpom.go.id doesn't exist, the real
  // domain is pom.go.id (BPOM, the food/drug authority). \.gov\.[a-z]{2} above never matched it.
  /\.go\.id/i,
];

// Domains known to be secondary/aggregator republications, not primary datasets — a post citing
// one of these where a primary source exists must be fixed, not just flagged.
const KNOWN_AGGREGATOR_DOMAINS = ["agritimes.co.in"];

const ABSOLUTE_PRICE_RE = /(\$|USD|₹|INR|EUR|€)\s?\d[\d,.]*\s*(\/|per\s)\s*(kg|mt|tonne|lb|ton|container|carton|20ft|40ft)/i;

function section(html, id) {
  const re = new RegExp(`id="${id}"[\\s\\S]*?(?=<section |<article |$)`);
  const m = html.match(re);
  return m ? m[0] : null;
}

function marker(html, name) {
  const re = new RegExp(`<!--\\s*${name}:start\\s*-->([\\s\\S]*?)<!--\\s*${name}:end\\s*-->`);
  const m = html.match(re);
  return m ? m[1] : null;
}

function wordCount(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

let files = [];
if (fs.existsSync(BLOG_DIR)) {
  for (const entry of fs.readdirSync(BLOG_DIR, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const f = path.join(BLOG_DIR, entry.name, "index.html");
      if (fs.existsSync(f)) files.push(f);
    }
  }
}

let issues = [];
let checked = 0;

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  if (!html.includes('id="commercial-facts"')) continue; // not migrated yet
  checked++;
  const rel = path.relative(SITE_ROOT, file);
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/);
  const body = mainMatch ? mainMatch[0] : html;

  // 1. Word count
  const category = (html.match(/data-category="([^"]+)"/) || [])[1];
  const min = WORD_COUNT_MIN[category] || WORD_COUNT_MIN.default;
  const wc = wordCount(body);
  if (wc < min) issues.push(`${rel}: ${wc} words, needs >= ${min}${category ? ` (category: ${category})` : ""}`);

  // 2. Commercial-facts table
  const cf = section(body, "commercial-facts");
  if (!cf) {
    issues.push(`${rel}: missing commercial-facts table`);
  } else {
    for (const field of REQUIRED_CF_FIELDS) {
      if (!cf.includes(`<td>${field}</td>`)) issues.push(`${rel}: commercial-facts table missing field "${field}"`);
    }
    const onRequestCount = (cf.match(/On request|Varies by season/g) || []).length;
    if (onRequestCount > 2) issues.push(`${rel}: commercial-facts table has ${onRequestCount} "On request"/"Varies by season" rows, max 2`);
  }

  // 3 & 4. Market-data table + chart
  const market = section(body, "top-markets");
  if (!market) {
    issues.push(`${rel}: missing market-data table (id="top-markets")`);
  } else {
    const rowCount = (market.match(/<tr>/g) || []).length - 1; // minus header row
    if (rowCount < 5) issues.push(`${rel}: market-data table has ${rowCount} data rows, needs >= 5`);
    if (!/<strong>Source:<\/strong>/.test(market)) issues.push(`${rel}: market-data table missing visible source citation`);
    if (!/Retrieved:/.test(market)) issues.push(`${rel}: market-data table missing retrieval date`);
    if (!/<svg[^>]*>[\s\S]*?<title[\s\S]*?<\/title>[\s\S]*?<desc[\s\S]*?<\/desc>/.test(market)) {
      issues.push(`${rel}: market-data chart missing <title>/<desc> accessibility elements`);
    }
  }

  // 5. Documentation checklist
  const docs = section(body, "documentation");
  if (!docs) {
    issues.push(`${rel}: missing documentation checklist (id="documentation")`);
  } else {
    const links = [...docs.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
    const hasAuthorityLink = links.some((url) => AUTHORITY_ALLOW_PATTERNS.some((re) => re.test(url)));
    if (!hasAuthorityLink) issues.push(`${rel}: documentation checklist has no outbound link to an official destination authority`);
  }

  // 6. Price-behaviour section
  const price = marker(body, "price-behaviour");
  if (!price) {
    issues.push(`${rel}: missing price-behaviour section (<!-- price-behaviour:start/end --> markers)`);
  } else if (ABSOLUTE_PRICE_RE.test(price)) {
    issues.push(`${rel}: price-behaviour section contains an absolute price claim`);
  }

  // 7. Operator-detail section
  const operator = marker(body, "operator-detail");
  if (!operator) {
    issues.push(`${rel}: missing operator-detail section (<!-- operator-detail:start/end --> markers)`);
  } else {
    const owc = wordCount(operator);
    if (owc < 200) issues.push(`${rel}: operator-detail section is ${owc} words, needs >= 200`);
  }

  // 8. Compare-options element
  const compare = section(body, "compare-options");
  if (!compare || !/<table/.test(compare)) {
    issues.push(`${rel}: missing compare-options table (id="compare-options")`);
  }

  // 9. FAQ >= 7 with schema
  const faqCount = (html.match(/class="faq-item"/g) || []).length;
  if (faqCount < 7) issues.push(`${rel}: only ${faqCount} FAQ items (need >= 7)`);
  if (!html.includes('"@type":"FAQPage"')) issues.push(`${rel}: missing FAQPage schema`);

  // 10. Sources — flag known aggregator citations
  const sourcesSection = html.match(/<h2>Sources<\/h2>[\s\S]*?<\/section>/);
  if (sourcesSection) {
    for (const domain of KNOWN_AGGREGATOR_DOMAINS) {
      if (sourcesSection[0].includes(domain)) {
        issues.push(`${rel}: cites known aggregator domain "${domain}" — replace with the primary source`);
      }
    }
  }
}

if (issues.length) {
  console.error(`\nBlog content-standard check FAILED — ${issues.length} issue(s) across ${checked} migrated post(s):\n`);
  issues.forEach((i) => console.error("  " + i));
  process.exit(1);
} else {
  console.log(`Blog content-standard check passed — ${checked} migrated post(s) meet the full standard (${files.length - checked} not yet migrated, covered by check:blog-quality only).`);
}
