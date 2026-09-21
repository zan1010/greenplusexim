/* Indexation/SEO audit (Block A2). Produces reports/seo-audit.json and reports/seo-audit.md
   covering: sitemap vs built-site parity, title/description/H1 outliers and duplicates,
   inbound-link depth, word counts, and schema/OG/canonical/hreflang completeness. Read-only —
   never fails the build; it's a report, not a gate (the gates it feeds are check-forms.js,
   check-broken-links.js, check-orphans.js and uniqueness.mjs). */
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SITE_DIR = path.join(ROOT, "_site");
const REPORTS_DIR = path.join(ROOT, "reports");

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else files.push(full);
  }
  return files;
}

function urlFor(file) {
  const rel = path.relative(SITE_DIR, path.dirname(file)).replace(/\\/g, "/");
  return rel ? "/" + rel + "/" : "/";
}

const allFiles = await walk(SITE_DIR);
const htmlFiles = allFiles.filter((f) => f.endsWith(".html") && path.basename(f) === "index.html");
// sitemap-index.xml itself is excluded here — it's a sitemap of sitemaps (its <loc> entries
// point to the other .xml files below, not HTML pages), so including it would make every
// sub-sitemap file show up as a false-positive "sitemap URL with no matching built page".
const sitemapFiles = allFiles.filter((f) => /sitemap-.*\.xml$/.test(f) && !f.endsWith("sitemap-index.xml"));

// --- Parse sitemap URLs ---
const sitemapUrls = new Set();
for (const f of sitemapFiles) {
  const xml = await readFile(f, "utf8");
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    sitemapUrls.add(m[1].replace(/^https?:\/\/[^/]+/, ""));
  }
}

const pages = [];
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const url = urlFor(file);
  const isNoindex = /name="robots" content="noindex/.test(html);
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]*)"/);
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());
  const ogImageMatch = html.match(/<meta property="og:image" content="([^"]*)"/);
  const hasBreadcrumbSchema = /"@type":\s*"BreadcrumbList"/.test(html);
  const hasFaqSchema = /"@type":\s*"FAQPage"/.test(html);
  const hreflangs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map((m) => m[1]);
  const inboundHrefs = [...html.matchAll(/<a\b[^>]*href="(\/[^"]*)"/g)].map((m) => m[1].split("#")[0].split("?")[0]);
  const mainMatch = html.match(/<main id="main">([\s\S]*?)<\/main>/);
  const wordCount = mainMatch
    ? mainMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length
    : 0;
  const isBlog = /^\/(blog|[a-z]{2}\/blog)\/[^/]+\/$/.test(url);

  pages.push({
    url,
    file: path.relative(ROOT, file),
    noindex: isNoindex,
    title: titleMatch ? titleMatch[1] : null,
    titleLength: titleMatch ? titleMatch[1].length : 0,
    description: descMatch ? descMatch[1] : null,
    descriptionLength: descMatch ? descMatch[1].length : 0,
    canonical: canonicalMatch ? canonicalMatch[1] : null,
    h1Count: h1s.length,
    h1: h1s[0] || null,
    ogImage: !!ogImageMatch,
    hasBreadcrumbSchema,
    hasFaqSchema,
    hreflangCount: hreflangs.length,
    wordCount,
    isBlog,
    outboundInternalLinks: inboundHrefs,
  });
}

// --- Inbound link counts (mirrors check-orphans.js logic) ---
const inboundCounts = {};
for (const p of pages) inboundCounts[p.url] = 0;
for (const p of pages) {
  for (let href of p.outboundInternalLinks) {
    if (!href) continue;
    if (!href.endsWith("/") && !href.includes(".")) href += "/";
    if (href in inboundCounts && href !== p.url) inboundCounts[href]++;
  }
}

// --- Orphans / thin / outliers ---
const orphans = pages.filter((p) => !p.noindex && (inboundCounts[p.url] || 0) < 3).map((p) => p.url);
const missingFromSitemap = pages.filter((p) => !p.noindex && !sitemapUrls.has(p.url)).map((p) => p.url);
const sitemapButMissingOnDisk = [...sitemapUrls].filter((u) => !pages.some((p) => p.url === u));
const titleTooLong = pages.filter((p) => p.titleLength > 60).map((p) => ({ url: p.url, length: p.titleLength }));
const descTooLong = pages.filter((p) => p.descriptionLength > 155).map((p) => ({ url: p.url, length: p.descriptionLength }));
const missingDesc = pages.filter((p) => !p.description && !p.noindex).map((p) => p.url);
const multipleH1 = pages.filter((p) => p.h1Count > 1 && !p.noindex).map((p) => ({ url: p.url, count: p.h1Count }));
const zeroH1 = pages.filter((p) => p.h1Count === 0 && !p.noindex).map((p) => p.url);
const missingCanonical = pages.filter((p) => !p.canonical && !p.noindex).map((p) => p.url);
const missingOgImage = pages.filter((p) => !p.ogImage).map((p) => p.url);

// Duplicate title/description checks only matter for pages actually competing for
// indexation — noindex pages (thank-you pages etc.) sharing generic text is harmless.
const titleCounts = {};
for (const p of pages) if (p.title && !p.noindex) titleCounts[p.title] = (titleCounts[p.title] || 0) + 1;
const duplicateTitles = Object.entries(titleCounts).filter(([, n]) => n > 1);

const descCounts = {};
for (const p of pages) if (p.description && !p.noindex) descCounts[p.description] = (descCounts[p.description] || 0) + 1;
const duplicateDescs = Object.entries(descCounts).filter(([, n]) => n > 1);

const thinPages = pages.filter((p) => !p.noindex && !p.isBlog && p.wordCount > 0 && p.wordCount < 600).map((p) => ({ url: p.url, words: p.wordCount }));
const thinBlogs = pages.filter((p) => !p.noindex && p.isBlog && p.wordCount < 1500).map((p) => ({ url: p.url, words: p.wordCount }));
const blogsMissingFaq = pages.filter((p) => p.isBlog && !p.noindex && !p.hasFaqSchema).map((p) => p.url);
const noBreadcrumb = pages.filter((p) => !p.noindex && !p.hasBreadcrumbSchema && p.url !== "/").map((p) => p.url);

const summary = {
  generatedAt: new Date().toISOString(),
  totalPages: pages.length,
  indexablePages: pages.filter((p) => !p.noindex).length,
  noindexPages: pages.filter((p) => p.noindex).length,
  sitemapUrlCount: sitemapUrls.size,
  orphans,
  missingFromSitemap,
  sitemapButMissingOnDisk,
  titleTooLong,
  descTooLong,
  missingDesc,
  multipleH1,
  zeroH1,
  missingCanonical,
  missingOgImage,
  duplicateTitles,
  duplicateDescs,
  thinPages,
  thinBlogs,
  blogsMissingFaq,
  noBreadcrumbCount: noBreadcrumb.length,
};

await mkdir(REPORTS_DIR, { recursive: true });
await writeFile(path.join(REPORTS_DIR, "seo-audit.json"), JSON.stringify({ summary, pages }, null, 2));

const md = [
  "# SEO / Indexation Audit",
  "",
  `Generated ${summary.generatedAt}.`,
  "",
  `- **Total built pages:** ${summary.totalPages} (${summary.indexablePages} indexable, ${summary.noindexPages} noindex)`,
  `- **Sitemap URL count:** ${summary.sitemapUrlCount}`,
  "",
  "## Sitemap parity",
  missingFromSitemap.length ? `**${missingFromSitemap.length} indexable page(s) missing from sitemap:**\n` + missingFromSitemap.map((u) => `- ${u}`).join("\n") : "All indexable pages are in the sitemap.",
  "",
  sitemapButMissingOnDisk.length ? `**${sitemapButMissingOnDisk.length} sitemap URL(s) with no matching built page:**\n` + sitemapButMissingOnDisk.map((u) => `- ${u}`).join("\n") : "No stale sitemap entries.",
  "",
  "## Orphans (< 3 inbound internal links)",
  orphans.length ? orphans.map((u) => `- ${u}`).join("\n") : "None.",
  "",
  "## Title issues",
  titleTooLong.length ? `**Over 60 chars (${titleTooLong.length}):**\n` + titleTooLong.map((t) => `- ${t.url} (${t.length} chars)`).join("\n") : "No over-length titles.",
  duplicateTitles.length ? `\n**Duplicate titles (${duplicateTitles.length}):**\n` + duplicateTitles.map(([t, n]) => `- "${t}" used on ${n} pages`).join("\n") : "No duplicate titles.",
  "",
  "## Description issues",
  descTooLong.length ? `**Over 155 chars (${descTooLong.length}):**\n` + descTooLong.map((t) => `- ${t.url} (${t.length} chars)`).join("\n") : "No over-length descriptions.",
  missingDesc.length ? `\n**Missing description (${missingDesc.length}):**\n` + missingDesc.map((u) => `- ${u}`).join("\n") : "\nAll indexable pages have a description.",
  duplicateDescs.length ? `\n**Duplicate descriptions (${duplicateDescs.length}):**\n` + duplicateDescs.map(([d, n]) => `- "${d.slice(0, 60)}…" used on ${n} pages`).join("\n") : "\nNo duplicate descriptions.",
  "",
  "## H1 issues",
  multipleH1.length ? `**Multiple H1s (${multipleH1.length}):**\n` + multipleH1.map((h) => `- ${h.url} (${h.count})`).join("\n") : "No pages with multiple H1s.",
  zeroH1.length ? `\n**Zero H1 (${zeroH1.length}):**\n` + zeroH1.map((u) => `- ${u}`).join("\n") : "\nAll indexable pages have exactly one H1.",
  "",
  "## Schema / meta completeness",
  `- Missing canonical: ${missingCanonical.length}`,
  `- Missing OG image: ${missingOgImage.length}`,
  `- Missing BreadcrumbList schema (excl. home): ${noBreadcrumb.length}`,
  `- Blog posts missing FAQPage schema: ${blogsMissingFaq.length}${blogsMissingFaq.length ? "\n" + blogsMissingFaq.map((u) => `  - ${u}`).join("\n") : ""}`,
  "",
  "## Thin content",
  thinPages.length ? `**Non-blog pages under 600 words (${thinPages.length}):**\n` + thinPages.map((t) => `- ${t.url} (${t.words} words)`).join("\n") : "No thin non-blog pages.",
  thinBlogs.length ? `\n**Blog posts under 1,500 words (${thinBlogs.length}):**\n` + thinBlogs.map((t) => `- ${t.url} (${t.words} words)`).join("\n") : "\nAll blog posts meet the 1,500-word bar.",
  "",
].join("\n");

await writeFile(path.join(REPORTS_DIR, "seo-audit.md"), md);
console.log(`SEO audit complete. ${summary.indexablePages} indexable pages, ${orphans.length} orphans, ${duplicateTitles.length} duplicate titles, ${thinBlogs.length} thin blogs. See reports/seo-audit.md`);
