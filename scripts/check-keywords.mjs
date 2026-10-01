/* Keyword-targeting gate. research/keyword-map.csv is the source of truth for each indexable
 * URL's primary keyword; this checks the built site in _site against it.
 *
 *  1. The map covers exactly the sitemap's URLs (no unmapped indexable page, no stale row).
 *  2. One primary keyword per indexable URL, no duplicates site-wide.
 *  3. <title>: <= 60 chars, contains the primary keyword and "India"/"Indian", unique.
 *  4. Meta description: 120–155 chars, contains the primary keyword, unique.
 *  5. H1 contains the primary keyword (content page types).
 *  6. The blog index and sitemap-blog-en.xml list exactly the same posts.
 *
 * "Contains the primary keyword" = every content word of the keyword appears in the text, after
 * light stemming (exporter/exporting/export, seeds/seed, Indian/India) and ignoring stop words —
 * so "Indian Grapes Exporter to Netherlands" satisfies "grapes exporter india to netherlands".
 * Utility pages (privacy, terms, sitemap, author pages) are exempt from 2–5.
 */
import fs from "node:fs";
import path from "node:path";

const SITE = path.resolve("_site");
const MAP = path.resolve("research/keyword-map.csv");
const CONTENT_TYPES = new Set(["blog", "product", "product-country", "market", "market-region", "product-category"]);
const STOP = new Set("a an the of for to from and vs versus in on by with your".split(" "));

function parseCsv(text) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1);
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const stem = (w) => {
  w = w.toLowerCase().replace(/'s$/, "");
  if (w === "indian") return "india";
  if (w.length > 4 && w.endsWith("ies")) w = w.slice(0, -3) + "y";
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith("er")) w = w.slice(0, -2);
  return w;
};
const words = (s) => (decode(s).toLowerCase().match(/[a-z0-9]+(?:'[a-z]+)?/g) || []).map(stem);
// Country names written out on the page count as their abbreviation in the keyword.
const SYNONYMS = [[/united states|\bu\.s\.?a?\b/i, "usa"], [/united arab emirates/i, "uae"], [/united kingdom|\bbritain\b/i, "uk"]];
const missing = (kw, text) => {
  const have = new Set(words(text));
  for (const [re, abbr] of SYNONYMS) if (re.test(decode(text))) have.add(abbr);
  return words(kw).filter((w) => !STOP.has(w) && !have.has(w));
};
const read = (u) => fs.readFileSync(path.join(SITE, u.endsWith("/") ? u + "index.html" : u), "utf8");

const issues = [];
const map = parseCsv(fs.readFileSync(MAP, "utf8"));

// 1. Map <-> sitemap coverage
const idx = fs.readFileSync(path.join(SITE, "sitemap-index.xml"), "utf8");
const sitemapUrls = new Set();
for (const child of [...idx.matchAll(/<loc>[^<]*\/(sitemap-[^<]+)<\/loc>/g)].map((m) => m[1])) {
  for (const m of fs.readFileSync(path.join(SITE, child), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)) {
    sitemapUrls.add(new URL(m[1]).pathname);
  }
}
const mapUrls = new Set(map.map((r) => r.url));
for (const u of sitemapUrls) if (!mapUrls.has(u)) issues.push(`${u}: indexable (in sitemap) but has no row in keyword-map.csv`);
for (const u of mapUrls) if (!sitemapUrls.has(u)) issues.push(`${u}: row in keyword-map.csv but not in any sitemap (redirected/noindex? remove the row)`);

// 2–5
const seenPk = new Map(), seenTitle = new Map(), seenMeta = new Map();
let checked = 0;
for (const r of map) {
  if (r.page_type === "utility" || !sitemapUrls.has(r.url)) continue;
  checked++;
  const html = read(r.url);
  const pk = r.primary_keyword.trim();
  if (!pk) { issues.push(`${r.url}: no primary keyword`); continue; }
  if (seenPk.has(pk.toLowerCase())) issues.push(`${r.url}: primary keyword "${pk}" also used by ${seenPk.get(pk.toLowerCase())}`);
  seenPk.set(pk.toLowerCase(), r.url);

  const title = decode((html.match(/<title>([^<]*)<\/title>/) || [, ""])[1]).trim();
  if (title.length > 60) issues.push(`${r.url}: title is ${title.length} chars (max 60): "${title}"`);
  if (!/\bindian?\b/i.test(title)) issues.push(`${r.url}: title lacks "India"/"Indian": "${title}"`);
  const tMiss = missing(pk, title);
  if (tMiss.length) issues.push(`${r.url}: title lacks primary-keyword words [${tMiss.join(", ")}]: "${title}"`);
  if (seenTitle.has(title)) issues.push(`${r.url}: title duplicates ${seenTitle.get(title)}`);
  seenTitle.set(title, r.url);

  const meta = decode((html.match(/<meta name="description" content="([^"]*)"/) || [, ""])[1]).trim();
  if (meta.length < 120 || meta.length > 155) issues.push(`${r.url}: meta description is ${meta.length} chars (need 120–155)`);
  const mMiss = missing(pk, meta);
  if (mMiss.length) issues.push(`${r.url}: meta lacks primary-keyword words [${mMiss.join(", ")}]`);
  if (seenMeta.has(meta)) issues.push(`${r.url}: meta description duplicates ${seenMeta.get(meta)}`);
  seenMeta.set(meta, r.url);

  if (CONTENT_TYPES.has(r.page_type)) {
    const h1 = decode(((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ""])[1]).replace(/<[^>]+>/g, " ")).trim();
    const hMiss = missing(pk, h1);
    if (hMiss.length) issues.push(`${r.url}: H1 lacks primary-keyword words [${hMiss.join(", ")}]: "${h1}"`);
  }
}

// 6. Blog index vs blog sitemap
const blogIndex = read("/blog/");
const main = (blogIndex.match(/<main[\s\S]*?<\/main>/) || [""])[0];
const listed = new Set([...main.matchAll(/href="(\/blog\/[^"\/#?]+\/)"/g)].map((m) => m[1]));
const blogSitemap = new Set([...fs.readFileSync(path.join(SITE, "sitemap-blog-en.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));
for (const u of listed) if (!blogSitemap.has(u)) issues.push(`/blog/ lists ${u} but sitemap-blog-en.xml does not (noindex/consolidated posts must leave the index)`);
for (const u of blogSitemap) if (!listed.has(u)) issues.push(`sitemap-blog-en.xml has ${u} but the /blog/ index does not list it`);

if (issues.length) {
  console.error(`\nKeyword targeting check FAILED — ${issues.length} issue(s) across ${checked} mapped URLs:\n`);
  issues.forEach((i) => console.error("  " + i));
  process.exit(1);
}
console.log(`Keyword targeting check passed — ${checked} URLs: unique primaries, titles <=60 with keyword + India, metas 120–155, H1s on target; blog index = blog sitemap (${listed.size} posts).`);
