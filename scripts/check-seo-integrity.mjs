// Blog-overhaul Step 0 gates: canonical host is a single consistent value, /sitemap.xml
// resolves, no empty sitemap is listed in the index, and no two blog posts in the same
// language target the same primary keyword (the anti-cannibalization guardrail from
// CONTENT_GUIDE.md, now enforced in code rather than just documented).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SITE_ROOT = path.join(ROOT, "_site");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

let issues = [];

// 1. Canonical host consistency
const htmlFiles = walk(SITE_ROOT);
const hosts = new Set();
for (const f of htmlFiles) {
  const html = fs.readFileSync(f, "utf8");
  const m = html.match(/<link rel="canonical" href="(https?:\/\/[^/"]+)/);
  if (m) hosts.add(m[1]);
}
if (hosts.size > 1) {
  issues.push(`Canonical host is inconsistent across the build: ${[...hosts].join(", ")}`);
} else if (hosts.size === 0) {
  issues.push("No page carries a canonical tag — cannot verify canonical host.");
}

// 2. /sitemap.xml redirect exists
const netlifyToml = fs.readFileSync(path.join(ROOT, "netlify.toml"), "utf8");
if (!/from\s*=\s*"\/sitemap\.xml"[\s\S]*?to\s*=\s*"\/sitemap-index\.xml"/.test(netlifyToml)) {
  issues.push("netlify.toml is missing the /sitemap.xml -> /sitemap-index.xml redirect.");
}

// 3. sitemap-index.xml resolves and lists no empty sitemap
const indexPath = path.join(SITE_ROOT, "sitemap-index.xml");
if (!fs.existsSync(indexPath)) {
  issues.push("_site/sitemap-index.xml does not exist.");
} else {
  const indexXml = fs.readFileSync(indexPath, "utf8");
  const locs = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!locs.length) issues.push("sitemap-index.xml lists no sitemaps.");
  for (const loc of locs) {
    const file = path.join(SITE_ROOT, new URL(loc).pathname);
    if (!fs.existsSync(file)) {
      issues.push(`sitemap-index.xml references ${loc}, which does not exist in the build.`);
      continue;
    }
    const urlCount = (fs.readFileSync(file, "utf8").match(/<url>/g) || []).length;
    if (urlCount === 0) issues.push(`${path.basename(file)} is listed in sitemap-index.xml but contains 0 <url> entries.`);
  }
}

// 4. Cannibalization: no two blog posts in the same language share a primary_keyword
const blogSrcDirs = ["src/blog", "src/es/blog", "src/pt/blog", "src/fr/blog", "src/de/blog", "src/nl/blog", "src/ar/blog", "src/id/blog", "src/vi/blog", "src/ms/blog"]
  .map((d) => path.join(ROOT, d))
  .filter((d) => fs.existsSync(d));

const seen = new Map(); // "lang::keyword" -> [slugs]
for (const dir of blogSrcDirs) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".njk")) continue;
    const full = path.join(dir, entry.name);
    const text = fs.readFileSync(full, "utf8");
    const front = text.split(/^---\s*$/m)[1] || "";
    const kwMatch = front.match(/^primary_keyword:\s*"?([^"\n]+?)"?\s*$/m);
    const langMatch = front.match(/^lang:\s*"?([^"\n]+?)"?\s*$/m);
    const slugMatch = front.match(/^slug:\s*"?([^"\n]+?)"?\s*$/m);
    if (!kwMatch) continue;
    const key = `${langMatch ? langMatch[1] : "en"}::${kwMatch[1].toLowerCase().trim()}`;
    const slug = slugMatch ? slugMatch[1] : entry.name;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(slug);
  }
}
for (const [key, slugs] of seen) {
  if (slugs.length > 1) {
    const [lang, keyword] = key.split("::");
    issues.push(`Keyword cannibalization: "${keyword}" (${lang}) is the primary_keyword of ${slugs.length} posts: ${slugs.join(", ")}`);
  }
}

if (issues.length) {
  console.error(`\nSEO integrity check FAILED — ${issues.length} issue(s):\n`);
  issues.forEach((i) => console.error("  " + i));
  process.exit(1);
} else {
  console.log(`SEO integrity check passed — canonical host consistent, sitemap.xml redirect present, ${blogSrcDirs.length} blog directories checked for keyword cannibalization.`);
}
