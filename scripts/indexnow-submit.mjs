/* Submits changed URLs to IndexNow (Bing/Yandex) after a deploy. Compares the current sitemap
   URL list against the last-submitted snapshot (reports/indexnow-last-submitted.json) and only
   submits the diff. Run with --dry-run to see what would be submitted without calling the API —
   useful in CI/preview builds and required before the real key exists.

   IndexNow key setup (see OWNER_TODO.md): generate a key at https://www.bing.com/indexnow,
   set it in src/_data/site.json -> analytics.indexNowKey, and this script will create the
   required /<key>.txt verification file at the site root on the next build. Until a real key
   is set, this script only ever runs in dry-run mode regardless of the flag, so it can't
   accidentally submit with a placeholder key. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REPORTS_DIR = path.join(ROOT, "reports");
const SNAPSHOT_FILE = path.join(REPORTS_DIR, "indexnow-last-submitted.json");

const isDryRun = process.argv.includes("--dry-run");

const site = JSON.parse(await readFile(path.join(ROOT, "src", "_data", "site.json"), "utf8"));
const key = site.analytics && site.analytics.indexNowKey;
const host = new URL(site.url).host;
const hasRealKey = key && !/TODO/i.test(key);

// --- Gather current indexable URLs from the built sitemaps ---
async function currentUrls() {
  const sitemapFiles = [
    "sitemap-pages.xml",
    "sitemap-products.xml",
    "sitemap-markets.xml",
    "sitemap-blog-en.xml",
    "sitemap-blog-intl.xml",
  ];
  const urls = new Set();
  for (const f of sitemapFiles) {
    try {
      const xml = await readFile(path.join(ROOT, "_site", f), "utf8");
      for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(m[1]);
    } catch (e) {
      /* sitemap not built yet — skip */
    }
  }
  return [...urls];
}

async function loadSnapshot() {
  try {
    return JSON.parse(await readFile(SNAPSHOT_FILE, "utf8"));
  } catch (e) {
    return { urls: [] };
  }
}

function postToIndexNow(urlList) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ host, key, keyLocation: `${site.url}/${key}.txt`, urlList });
    const req = https.request(
      "https://api.indexnow.org/indexnow",
      { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) } },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const current = await currentUrls();
const snapshot = await loadSnapshot();
const previousSet = new Set(snapshot.urls || []);
const changed = current.filter((u) => !previousSet.has(u));

console.log(`IndexNow: ${current.length} indexable URLs total, ${changed.length} new/changed since last submission.`);

if (!hasRealKey) {
  console.log("IndexNow: no real key configured yet (site.json analytics.indexNowKey is still a TODO placeholder) — running in forced dry-run mode.");
}

const effectiveDryRun = isDryRun || !hasRealKey;

if (changed.length === 0) {
  console.log("IndexNow: nothing new to submit.");
} else if (effectiveDryRun) {
  console.log(`IndexNow: [DRY RUN] would submit ${changed.length} URL(s):`);
  changed.forEach((u) => console.log("  " + u));
} else {
  const result = await postToIndexNow(changed);
  console.log(`IndexNow: submitted ${changed.length} URL(s), response ${result.status}`);
}

// Only persist the new snapshot on a real (non-dry) submission, so repeated dry-runs stay idempotent.
if (!effectiveDryRun && changed.length > 0) {
  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(SNAPSHOT_FILE, JSON.stringify({ urls: current, submittedAt: new Date().toISOString() }, null, 2));
}
