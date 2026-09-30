/* Generates reports/launch-checklist.md — one row per indexable URL (every <loc> in the sitemaps
 * that sitemap-index.xml lists), so the whole site can be scanned at once against what Search
 * Console / Bing report as discovered.
 *
 *   node scripts/launch-checklist.mjs [--site DIR]
 *
 * Columns: title, meta description (with length), word count of <main>, canonical host, inbound
 * internal links (distinct other pages linking to it from their <main> content — header/footer
 * nav excluded, since every page gets those for free), and whether the page carries a lead form.
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const siteIdx = args.indexOf("--site");
const SITE = path.resolve(siteIdx >= 0 ? args[siteIdx + 1] : "_site");
const OUT = path.resolve("reports", "launch-checklist.md");

const read = (p) => fs.readFileSync(p, "utf8");
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const fileFor = (pathname) => path.join(SITE, pathname.endsWith("/") ? pathname + "index.html" : pathname);
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const cell = (s) => decode(s).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const mainOf = (html) => (html.match(/<main[^>]*>([\s\S]*?)<\/main>/) || [, ""])[1];
const words = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").split(/\s+/).filter(Boolean).length;

// ---- Indexable URLs, grouped by sitemap ----
const index = read(path.join(SITE, "sitemap-index.xml"));
const groups = locs(index).map((u) => {
  const name = u.replace(/^https?:\/\/[^/]+\//, "");
  return { name, urls: locs(read(path.join(SITE, name))) };
});
const all = groups.flatMap((g) => g.urls);
const origin = new URL(all[0]).origin;

// ---- Inbound links from every built HTML page's <main> ----
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".html") ? [path.join(d, e.name)] : []
  );
const inbound = new Map(all.map((u) => [new URL(u).pathname, new Set()]));
for (const file of walk(SITE)) {
  const from = "/" + path.relative(SITE, file).replace(/index\.html$/, "").replace(/\\/g, "/");
  for (const m of mainOf(read(file)).matchAll(/<a\b[^>]*\bhref="([^"#?]+)/g)) {
    let target;
    try { target = new URL(m[1], origin + from); } catch { continue; }
    if (target.origin !== origin) continue;
    const p = target.pathname.endsWith("/") || path.extname(target.pathname) ? target.pathname : target.pathname + "/";
    if (inbound.has(p) && p !== from) inbound.get(p).add(from);
  }
}

// ---- Rows ----
const hosts = new Set();
let lines = [];
let totals = { pages: 0, thinDesc: 0, lowLinks: 0, noForm: 0 };
for (const g of groups) {
  lines.push(`\n## ${g.name} (${g.urls.length})\n`);
  lines.push("| URL | Title | Meta description | Words | Canonical host | Inbound links | Form |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const url of g.urls) {
    const pathname = new URL(url).pathname;
    const f = fileFor(pathname);
    if (!fs.existsSync(f)) { lines.push(`| ${pathname} | **not built** ||||||`); continue; }
    const html = read(f);
    const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [, ""])[1];
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [, ""])[1];
    const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [, ""])[1];
    const canonHost = canon ? new URL(canon).host : "—";
    hosts.add(canonHost);
    const links = inbound.get(pathname)?.size ?? 0;
    const hasForm = /<form\b[^>]*name="(export-inquiry|quick-quote|supplier-partnership|[^"]+)"/.test(html);
    const d = decode(desc);
    const descFlag = d.length < 70 || d.length > 160 ? " ⚠" : "";
    totals.pages++;
    if (descFlag) totals.thinDesc++;
    if (links < 3) totals.lowLinks++;
    if (!hasForm) totals.noForm++;
    lines.push(
      `| ${pathname} | ${cell(title)} | ${cell(desc)} (${d.length}${descFlag}) | ${words(mainOf(html)).toLocaleString("en-US")} | ` +
        `${canonHost} | ${links}${links < 3 ? " ⚠" : ""} | ${hasForm ? "✓" : "—"} |`
    );
  }
}

const header = [
  "# Launch checklist — every indexable URL",
  "",
  `Generated ${new Date().toISOString().slice(0, 10)} by \`node scripts/launch-checklist.mjs\` from the built site. ` +
    "Regenerate after any content change. Rows come from the sitemaps listed in `sitemap-index.xml`, " +
    "so this is exactly the set of URLs submitted to Google and Bing.",
  "",
  `- **${totals.pages} indexable URLs** across ${groups.length} sitemaps`,
  `- **Canonical host(s):** ${[...hosts].join(", ")}${hosts.size === 1 ? " — consistent" : " — ⚠ MIXED"}`,
  `- **Meta description outside 70–160 chars (⚠):** ${totals.thinDesc}`,
  `- **Fewer than 3 inbound in-content links (⚠):** ${totals.lowLinks} — nav/footer links excluded, so these rely on menus alone`,
  `- **Pages without a lead form:** ${totals.noForm}`,
  "",
  "Inbound links = distinct other pages linking to the URL from their main content.",
];
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, header.concat(lines).join("\n") + "\n");
console.log(`launch-checklist: ${totals.pages} URLs → ${path.relative(process.cwd(), OUT)} (hosts: ${[...hosts].join(", ")})`);
