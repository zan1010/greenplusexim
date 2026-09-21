/* Fails the build if any internal <a href> points to a page that doesn't exist in _site. */
const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "..", "_site");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function urlFor(file) {
  let rel = "/" + path.relative(SITE_DIR, file).replace(/\\/g, "/");
  rel = rel.replace(/index\.html$/, "");
  return rel;
}

if (!fs.existsSync(SITE_DIR)) {
  console.error("No _site directory found. Run `npm run build` first.");
  process.exit(1);
}

const allFiles = walk(SITE_DIR);
const htmlFiles = allFiles.filter((f) => f.endsWith(".html"));
const knownPaths = new Set(allFiles.map((f) => "/" + path.relative(SITE_DIR, f).replace(/\\/g, "/")));
// Also register directory-style URLs (with and without trailing slash) for every HTML file.
for (const f of htmlFiles) {
  const url = urlFor(f);
  knownPaths.add(url);
  knownPaths.add(url.replace(/\/$/, ""));
}

const errors = [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((m) => m[1]);
  for (let href of hrefs) {
    if (!href.startsWith("/") || href.startsWith("//")) continue; // external/protocol-relative
    const clean = href.split("#")[0].split("?")[0];
    if (!clean || clean === "/") continue;
    const withSlash = clean.endsWith("/") || clean.includes(".") ? clean : clean + "/";
    if (!knownPaths.has(clean) && !knownPaths.has(withSlash) && !knownPaths.has(clean.replace(/\/$/, ""))) {
      errors.push(`${path.relative(SITE_DIR, file)}: broken link to "${href}"`);
    }
  }
}

if (errors.length) {
  console.error(`\nBroken internal links FAILED — ${errors.length} issue(s):\n`);
  [...new Set(errors)].forEach((e) => console.error("  " + e));
  process.exit(1);
} else {
  console.log(`Broken-link check passed — ${htmlFiles.length} HTML files, all internal links resolve.`);
}
