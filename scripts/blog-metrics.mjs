/* Per-post metrics for the blog overhaul reports. Reads the built HTML in _site (or --site DIR).
 *   node scripts/blog-metrics.mjs [--site DIR] [slug ...]     (no slugs = every English post)
 * Prints a Markdown table: words, tables, charts, whether the commercial-facts table states MOQ /
 * loading ports / transit / payment terms, whether the documentation checklist is present, FAQ
 * count and operator-detail ("what goes wrong") word count. Word count uses the same method as
 * check-blog-standard.js (text inside <main>).
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const siteIdx = args.indexOf("--site");
const SITE = path.resolve(siteIdx >= 0 ? args.splice(siteIdx, 2)[1] : "_site");
const BLOG = path.join(SITE, "blog");
const slugs = args.length ? args : fs.readdirSync(BLOG).filter((d) => fs.existsSync(path.join(BLOG, d, "index.html")));

const words = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .split(/\s+/)
    .filter(Boolean).length;

const cfRow = (html, label) => {
  const block = (html.match(/id="commercial-facts"[\s\S]*?<\/table>/) || [""])[0];
  const row = block.match(new RegExp(`<t[dh][^>]*>\\s*${label}[^<]*</t[dh]>\\s*<td[^>]*>([\\s\\S]*?)</td>`, "i"));
  return row && row[1].replace(/<[^>]+>/g, "").trim() ? "✓" : "✗";
};

const rows = [];
for (const slug of slugs) {
  const file = path.join(BLOG, slug, "index.html");
  if (!fs.existsSync(file)) { rows.push(`| ${slug} | not built |||||||||`); continue; }
  const html = fs.readFileSync(file, "utf8");
  const main = (html.match(/<main[^>]*>([\s\S]*?)<\/main>/) || [, html])[1];
  const op = (html.match(/<!--\s*operator-detail:start\s*-->([\s\S]*?)<!--\s*operator-detail:end\s*-->/) || [])[1];
  const charts = (html.match(/aria-labelledby="(chart|trend)-title-/g) || []).length;
  rows.push(
    `| ${slug} | ${words(main).toLocaleString("en-US")} | ${(main.match(/<table\b/g) || []).length} | ` +
      `${charts ? `✓ (${charts})` : "✗"} | ${cfRow(html, "MOQ")} | ${cfRow(html, "Loading port")} | ` +
      `${cfRow(html, "Transit time")} | ${cfRow(html, "Payment terms")} | ` +
      `${html.includes('id="documentation"') ? "✓" : "✗"} | ${(html.match(/class="faq-item"/g) || []).length} | ` +
      `${op ? words(op) : "—"} |`
  );
}

console.log("| Post | Words | Tables | Chart | MOQ | Ports | Transit | Payment | Docs | FAQs | Op-detail words |");
console.log("|---|---|---|---|---|---|---|---|---|---|---|");
rows.forEach((r) => console.log(r));
