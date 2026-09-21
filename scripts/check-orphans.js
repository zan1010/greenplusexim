/* Fails the build if any indexable page has fewer than 3 inbound internal links. */
const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "..", "_site");
const MIN_INBOUND = 3;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function urlFor(file) {
  let rel = "/" + path.relative(SITE_DIR, file).replace(/\\/g, "/");
  rel = rel.replace(/index\.html$/, "");
  if (!rel.endsWith("/") && !rel.endsWith(".html")) rel += "/";
  return rel;
}

function isNoindex(html) {
  return /<meta\s+name="robots"\s+content="noindex/i.test(html);
}

if (!fs.existsSync(SITE_DIR)) {
  console.error("No _site directory found. Run `npm run build` first.");
  process.exit(1);
}

const files = walk(SITE_DIR);
const pageUrls = new Set(files.map(urlFor));
const inbound = {};
files.forEach((f) => (inbound[urlFor(f)] = 0));

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((m) => m[1]);
  for (let href of hrefs) {
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    href = href.split("#")[0].split("?")[0];
    if (!href) continue;
    if (!href.endsWith("/") && !href.endsWith(".html") && !href.includes(".")) href += "/";
    if (pageUrls.has(href) && href !== urlFor(file)) {
      inbound[href] = (inbound[href] || 0) + 1;
    }
  }
}

const orphans = [];
for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  if (isNoindex(html)) continue;
  const url = urlFor(file);
  if (url === "/thank-you/") continue;
  if ((inbound[url] || 0) < MIN_INBOUND) {
    orphans.push({ url, count: inbound[url] || 0 });
  }
}

if (orphans.length) {
  console.error(`\nOrphan check FAILED — ${orphans.length} indexable page(s) with < ${MIN_INBOUND} inbound internal links:\n`);
  orphans.forEach((o) => console.error(`  ${o.url} (${o.count} inbound)`));
  process.exit(1);
} else {
  console.log(`Orphan check passed — all indexable pages have >= ${MIN_INBOUND} inbound internal links.`);
}
