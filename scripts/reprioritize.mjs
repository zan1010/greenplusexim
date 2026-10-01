/* Re-sorts research/keyword-map.csv by real search volume once you paste a keyword export into
 * research/kw-volumes.csv.
 *
 *   npm run reprioritize
 *
 * Accepts Google Keyword Planner exports (UTF-16, tab-separated, two title rows above the header)
 * and Bing Webmaster Tools keyword-research exports (UTF-8 CSV) as-is. Columns are found by name:
 *   keyword    — "Keyword"
 *   volume     — "Avg. monthly searches" (Google) or "Impressions"/"Search volume" (Bing)
 *   difficulty — "Competition (indexed value)" or "Competition" (Google) / "Difficulty" if present
 * Matching is case-insensitive on the map's primary_keyword. Several exports can be concatenated
 * into the one file; the highest volume per keyword wins. Nothing is estimated: rows with no match
 * keep blank kw_volume/kw_difficulty and sort after matched rows, by trade_data_demand_rank.
 */
import fs from "node:fs";
import path from "node:path";

const MAP = path.resolve("research/keyword-map.csv");
const VOL = path.resolve("research/kw-volumes.csv");

function decode(buf) {
  if (buf[0] === 0xff && buf[1] === 0xfe) return buf.subarray(2).toString("utf16le");
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return buf.subarray(3).toString("utf8");
  return buf.toString("utf8");
}

function parse(text, delim) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

const toCsv = (rows) =>
  rows.map((r) => r.map((f) => (/[",\n]/.test(f) ? `"${String(f).replace(/"/g, '""')}"` : f)).join(",")).join("\n") + "\n";

if (!fs.existsSync(VOL)) {
  console.log(`reprioritize: ${path.relative(process.cwd(), VOL)} not found — paste a Keyword Planner or Bing export there first. Map unchanged.`);
  process.exit(0);
}

// ---- Volumes ----
const volText = decode(fs.readFileSync(VOL));
// Header line is the one whose first cell is exactly "Keyword" (Planner puts title rows above it).
const headerLine = volText.split(/\r?\n/).find((l) => /^\s*"?keyword"?\s*[\t,]/i.test(l)) || "";
const delim = headerLine.includes("\t") ? "\t" : ",";
const vrows = parse(volText, delim);
const hIdx = vrows.findIndex((r) => r.some((c) => /^\s*keyword\s*$/i.test(c)));
if (hIdx < 0) { console.error("reprioritize: no 'Keyword' header found in kw-volumes.csv"); process.exit(1); }
const head = vrows[hIdx].map((c) => c.trim().toLowerCase());
// First name in priority order that matches a header wins (so "Competition (indexed value)" beats "Competition").
const col = (...names) => {
  for (const n of names) {
    const i = head.findIndex((h) => h === n);
    if (i >= 0) return i;
  }
  for (const n of names) {
    const i = head.findIndex((h) => h.startsWith(n));
    if (i >= 0) return i;
  }
  return -1;
};
const kCol = col("keyword");
const vCol = col("avg. monthly searches", "search volume", "impressions", "volume");
const dCol = col("competition (indexed value)", "difficulty", "keyword difficulty", "competition");
if (vCol < 0) { console.error("reprioritize: no volume column (Avg. monthly searches / Impressions / Search volume)"); process.exit(1); }

const one = (t) => {
  const m = String(t).replace(/,/g, "").trim().match(/^(\d+(?:\.\d+)?)\s*([km]?)$/i);
  return m ? +m[1] * (/k/i.test(m[2]) ? 1e3 : /m/i.test(m[2]) ? 1e6 : 1) : null;
};
// Planner gives ranges ("1K – 10K", "100 – 1K"): use the midpoint, each side scaled by its own unit.
const num = (s) => {
  if (s == null || String(s).trim() === "") return null;
  const parts = String(s).split(/\s*[–-]\s*/);
  if (parts.length === 2) {
    const [a, b] = parts.map(one);
    return a != null && b != null ? Math.round((a + b) / 2) : null;
  }
  const v = one(s);
  return v == null ? null : Math.round(v);
};
const vols = new Map();
for (const r of vrows.slice(hIdx + 1)) {
  const k = (r[kCol] || "").trim().toLowerCase();
  const v = num(r[vCol]);
  if (!k || v == null) continue;
  const prev = vols.get(k);
  if (!prev || v > prev.v) vols.set(k, { v, d: dCol >= 0 ? (r[dCol] || "").trim() : "" });
}

// ---- Map ----
const mrows = parse(fs.readFileSync(MAP, "utf8"), ",");
const [mhead, ...body] = mrows;
const ix = (n) => mhead.indexOf(n);
const [pk, kv, kd, rank] = ["primary_keyword", "kw_volume", "kw_difficulty", "trade_data_demand_rank"].map(ix);
let matched = 0;
for (const r of body) {
  const hit = vols.get((r[pk] || "").trim().toLowerCase());
  if (hit) { r[kv] = String(hit.v); r[kd] = hit.d; matched++; }
}
body.sort((a, b) => {
  const va = a[kv] === "" ? -1 : +a[kv], vb = b[kv] === "" ? -1 : +b[kv];
  if (va !== vb) return vb - va;
  const ra = a[rank] === "" ? Infinity : +a[rank], rb = b[rank] === "" ? Infinity : +b[rank];
  return ra - rb;
});
fs.writeFileSync(MAP, toCsv([mhead, ...body]));
console.log(`reprioritize: ${vols.size} keywords in export, ${matched}/${body.length} map rows matched; map re-sorted by volume, then trade-data demand.`);
const unmatched = body.filter((r) => r[pk] && r[kv] === "").slice(0, 10).map((r) => r[pk]);
if (unmatched.length) console.log(`  first unmatched primaries (add them to your Planner list): ${unmatched.join("; ")}`);
