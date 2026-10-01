/* Builds the per-post table for reports/keyword-insight-pass.md from the keyword map (old vs new
 * title, primary keyword) and check-blog-insight.mjs --report (insight types, question H2s, term
 * coverage). Prints Markdown to stdout; the narrative sections of the report are hand-written.
 *   node scripts/keyword-insight-report.mjs > /tmp/table.md
 */
import fs from "node:fs";
import { execFileSync } from "node:child_process";

function parseCsv(text) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; } else if (c !== "\r") f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1);
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

const map = Object.fromEntries(parseCsv(fs.readFileSync("research/keyword-map.csv", "utf8")).map((r) => [r.url, r]));
let raw;
try { raw = execFileSync("node", ["scripts/check-blog-insight.mjs", "--report"], { encoding: "utf8" }); }
catch (e) { raw = e.stdout; } // the gate exits non-zero while posts are pending; the JSON is still printed
const report = JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1));

const rows = report.sort((a, b) => a.slug.localeCompare(b.slug)).map((p) => {
  const m = map[`/blog/${p.slug}/`] || {};
  const esc = (s) => (s || "").replace(/\|/g, "\\|");
  return `| ${p.slug} | ${esc(m.current_title)} | ${esc(m.proposed_title)} | ${esc(m.primary_keyword)} | ${p.insights.length} (${p.insights.join(", ")}) | ${p.questionH2} | ${p.takeaways} | ${p.termCoverage}% |`;
});
console.log("| Post | Old title | New title | Primary keyword | Insights | Question H2s | Takeaways | Term coverage |");
console.log("|---|---|---|---|---|---|---|---|");
rows.forEach((r) => console.log(r));
