/* Uniqueness gate (Block A3). For each template family (product, category, country, region,
   blog), strips sitewide boilerplate (header, nav, footer, forms, CTA bands, modals, scripts),
   then computes per page:
     - unique ratio: the share of this page's 5-word shingles that appear on NO other page
       in the same family (higher = more distinct content)
     - max pairwise similarity: the highest Jaccard similarity against any single sibling page
   Thresholds: unique ratio >= 45% for product/category/country/region, >= 60% for blog;
   max pairwise similarity < 25% for all. Failures are written to reports/uniqueness-failures.md
   and fail the build. */
import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SITE_DIR = path.join(ROOT, "_site");
const REPORTS_DIR = path.join(ROOT, "reports");

const THRESHOLDS = {
  product: { unique: 0.45, label: "product" },
  category: { unique: 0.45, label: "category" },
  country: { unique: 0.45, label: "country" },
  region: { unique: 0.45, label: "region" },
  blog: { unique: 0.6, label: "blog" },
};
const MAX_PAIRWISE = 0.25;
const SHINGLE_SIZE = 5;

async function walkHtml(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walkHtml(full, files);
    else if (entry.name === "index.html") files.push(full);
  }
  return files;
}

function urlFor(file) {
  const rel = path.relative(SITE_DIR, path.dirname(file)).replace(/\\/g, "/");
  return rel ? "/" + rel + "/" : "/";
}

// Classify a built page into a template family by URL shape. Returns null for pages that
// shouldn't be uniqueness-gated (hubs, legal, utility, noindex pages).
function classify(url, html) {
  if (/noindex/.test(html)) return null;
  if (/^\/products\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(url)) return "product"; // product x country landing pages
  if (/^\/products\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(url)) return "product";
  if (/^\/products\/[a-z0-9-]+\/$/.test(url)) return "category";
  const marketMatch = url.match(/^\/markets\/([a-z0-9-]+)\/$/);
  if (marketMatch) {
    const REGION_SLUGS = new Set(["middle-east-gcc", "south-asia", "southeast-asia", "east-asia", "europe", "africa", "north-america", "latin-america"]);
    return REGION_SLUGS.has(marketMatch[1]) ? "region" : "country";
  }
  if (/^\/(blog|ar\/blog|id\/blog|vi\/blog|ms\/blog|pt\/blog|es\/blog|fr\/blog|de\/blog|nl\/blog)\/[^/]+\/$/.test(url)) return "blog";
  return null;
}

function stripBoilerplate(html) {
  // Every page's own content lives entirely inside <main id="main">...</main> in base.njk —
  // header, mobile drawer, footer, sticky CTA bar, WhatsApp float and the quick-quote modal are
  // all siblings outside <main>, so extracting <main> alone is a far more robust boundary than
  // trying to regex out each boilerplate block individually (a previous version of this script
  // had a runaway "mobile-drawer" removal regex that silently ate most of the real content).
  const mainMatch = html.match(/<main id="main">([\s\S]*?)<\/main>/);
  const main = mainMatch ? mainMatch[1] : html;
  return main
    .replace(/<script[\s\S]*?<\/script>/g, " ") // JSON-LD schema blocks embedded in-page
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<form\b[\s\S]*?<\/form>/g, " ") // RFQ + quick-quote forms are identical boilerplate
    .replace(/<nav class="breadcrumbs[\s\S]*?<\/nav>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#0?39;|&rsquo;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    // Known sitewide boilerplate strings that appear verbatim wherever a template doesn't
    // override them (cta-band defaults, RFQ microcopy, quick-quote microcopy). Stripped as
    // literal strings — safer than a nested-div regex that risks eating real content.
    .replace(/ready to source from india\?/g, " ")
    .replace(/tell us your specs — get a quote within 24 business hours\./g, " ")
    .replace(/get export quote/g, " ")
    .replace(/whatsapp us/g, " ")
    .replace(/response within 24 business hours · no obligation · samples available/g, " ")
    .replace(/response within 24 business hours · no obligation/g, " ")
    .replace(/get your export quote/g, " ")
    .replace(/share your requirement — quantity, destination and specs — and we'll come back with fob\/cif pricing, lead time and documentation details\./g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shingles(text, n = SHINGLE_SIZE) {
  const words = text.split(" ").filter(Boolean);
  const set = new Set();
  for (let i = 0; i <= words.length - n; i++) {
    set.add(words.slice(i, i + n).join(" "));
  }
  return set;
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const item of small) if (large.has(item)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// --- Main ---
const allFiles = await walkHtml(SITE_DIR);
const families = {};

for (const file of allFiles) {
  const html = await readFile(file, "utf8");
  const url = urlFor(file);
  const family = classify(url, html);
  if (!family) continue;
  const text = stripBoilerplate(html);
  const wordCount = text.split(" ").filter(Boolean).length;
  (families[family] = families[family] || []).push({ url, file, text, shingles: shingles(text), wordCount });
}

const failures = [];
const allResults = [];

for (const [family, pages] of Object.entries(families)) {
  const threshold = THRESHOLDS[family];
  for (const page of pages) {
    let sharedShingles = 0;
    let maxPairwise = 0;
    let nearestSibling = null;
    const otherShinglesUnion = new Set();

    for (const other of pages) {
      if (other === page) continue;
      const sim = jaccard(page.shingles, other.shingles);
      if (sim > maxPairwise) {
        maxPairwise = sim;
        nearestSibling = other.url;
      }
      for (const s of other.shingles) otherShinglesUnion.add(s);
    }

    let uniqueCount = 0;
    for (const s of page.shingles) if (!otherShinglesUnion.has(s)) uniqueCount++;
    const uniqueRatio = page.shingles.size === 0 ? 0 : uniqueCount / page.shingles.size;

    const result = { family, url: page.url, uniqueRatio, maxPairwise, nearestSibling, wordCount: page.wordCount };
    allResults.push(result);

    if (pages.length > 1 && uniqueRatio < threshold.unique) {
      failures.push(`${page.url} [${family}]: unique ratio ${(uniqueRatio * 100).toFixed(1)}% (need >= ${threshold.unique * 100}%), nearest sibling: ${nearestSibling}`);
    }
    if (maxPairwise >= MAX_PAIRWISE) {
      failures.push(`${page.url} [${family}]: max pairwise similarity ${(maxPairwise * 100).toFixed(1)}% (need < ${MAX_PAIRWISE * 100}%) against ${nearestSibling}`);
    }
  }
}

await mkdir(REPORTS_DIR, { recursive: true });

const reportLines = [
  "# Uniqueness Report",
  "",
  `Generated ${new Date().toISOString().split("T")[0]}. Thresholds: product/category/country/region unique ratio >= 45%, blog >= 60%, max pairwise similarity < 25% (5-gram Jaccard) for all.`,
  "",
  "| Family | URL | Unique Ratio | Max Pairwise | Nearest Sibling | Words |",
  "|---|---|---|---|---|---|",
  ...allResults
    .sort((a, b) => a.family.localeCompare(b.family) || a.uniqueRatio - b.uniqueRatio)
    .map(
      (r) =>
        `| ${r.family} | ${r.url} | ${(r.uniqueRatio * 100).toFixed(1)}% | ${(r.maxPairwise * 100).toFixed(1)}% | ${r.nearestSibling || "—"} | ${r.wordCount} |`
    ),
];
await writeFile(path.join(REPORTS_DIR, "uniqueness.md"), reportLines.join("\n") + "\n");

if (failures.length) {
  const failLines = [
    "# Uniqueness Failures",
    "",
    "These pages fall below the uniqueness thresholds and must be rewritten with genuinely distinct data, or consolidated (301 redirect into their category/region page) before anything new is published.",
    "",
    ...failures.map((f) => `- ${f}`),
  ];
  await writeFile(path.join(REPORTS_DIR, "uniqueness-failures.md"), failLines.join("\n") + "\n");
  console.error(`\nUniqueness gate FAILED — ${failures.length} issue(s). See reports/uniqueness-failures.md\n`);
  failures.forEach((f) => console.error("  " + f));
  process.exit(1);
} else {
  try {
    await stat(path.join(REPORTS_DIR, "uniqueness-failures.md"));
    await writeFile(path.join(REPORTS_DIR, "uniqueness-failures.md"), "# Uniqueness Failures\n\nNone — all pages currently pass.\n");
  } catch (e) {
    /* no prior failures file, nothing to clear */
  }
  console.log(`Uniqueness gate passed — ${allResults.length} pages across ${Object.keys(families).length} template families. Full report: reports/uniqueness.md`);
}
