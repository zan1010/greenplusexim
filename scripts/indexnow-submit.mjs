/* Submits changed URLs to IndexNow (Bing, Yandex, Seznam, Naver — and, via Bing, the AI
 * assistants that use Bing's index) after a production build.
 *
 * How "changed" is decided: Netlify runs this during the build, while the PREVIOUS deploy is
 * still the one being served. So for every URL in the freshly built sitemaps we compare a hash of
 * the page's <main> content in _site against the same hash of the live page. New URLs (live 404)
 * and URLs whose content differs are submitted; unchanged pages are not. No state file is needed,
 * which matters because Netlify build containers are thrown away after every deploy.
 *
 *   node scripts/indexnow-submit.mjs            # production builds only (CONTEXT=production)
 *   node scripts/indexnow-submit.mjs --dry-run  # compute + print the diff, never POST
 *   node scripts/indexnow-submit.mjs --all      # submit every sitemap URL (first-time seeding)
 *
 * The key lives in site.base.json → analytics.indexNowKey; src/indexnow-key.njk publishes it at
 * /<key>.txt, which is how IndexNow verifies ownership. Responses are appended to
 * reports/indexnow.log (and printed, so they also appear in the Netlify deploy log).
 */
import { readFile, appendFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PRODUCTION_URL } = require("./site-url.js");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SITE_DIR = process.env.INDEXNOW_SITE_DIR || path.join(ROOT, "_site");
const LOG_FILE = path.join(ROOT, "reports", "indexnow.log");

const dryRun = process.argv.includes("--dry-run");
const submitAll = process.argv.includes("--all");
const context = process.env.CONTEXT || "";

const site = JSON.parse(await readFile(path.join(ROOT, "src", "_data", "site.base.json"), "utf8"));
const key = site.analytics && site.analytics.indexNowKey;
const base = PRODUCTION_URL;
const host = new URL(base).host;

async function log(line) {
  const stamped = `${new Date().toISOString()} ${line}`;
  console.log(`IndexNow: ${line}`);
  try {
    await mkdir(path.dirname(LOG_FILE), { recursive: true });
    await appendFile(LOG_FILE, stamped + "\n");
  } catch {
    /* logging must never fail the deploy */
  }
}

if (!key || /TODO/i.test(key)) {
  await log("no key configured (analytics.indexNowKey) — nothing submitted.");
  process.exit(0);
}
if (context && context !== "production" && !dryRun) {
  await log(`CONTEXT=${context} — only production deploys submit; nothing submitted.`);
  process.exit(0);
}

// Key file must be in the build, or IndexNow rejects the submission (403).
try {
  const served = (await readFile(path.join(SITE_DIR, `${key}.txt`), "utf8")).trim();
  if (served !== key) throw new Error("content mismatch");
} catch (e) {
  await log(`key file _site/${key}.txt missing or wrong (${e.message}) — nothing submitted.`);
  process.exit(0);
}

// ---- URLs from the built sitemaps (the index decides which children are live) ----
const indexXml = await readFile(path.join(SITE_DIR, "sitemap-index.xml"), "utf8");
const children = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, ""));
const urls = [];
for (const child of children) {
  const xml = await readFile(path.join(SITE_DIR, child), "utf8");
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.push(m[1]);
}

// ---- Content diff against the live site ----
const mainHash = (html) => {
  const main = (html.match(/<main[^>]*>([\s\S]*?)<\/main>/) || [, html])[1];
  // Compare text + element structure only. Attributes are dropped because Netlify rewrites every
  // <form> tag on the served page (removes data-netlify, injects a hidden form-name <input>), and
  // chart ids are random per build — neither is a content change worth re-crawling.
  const normalized = main
    .replace(/<input\b[^>]*>/gi, "")
    .replace(/<([a-z0-9]+)\b[^>]*>/gi, "<$1>")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha1").update(normalized).digest("hex");
};
const builtFile = (url) => {
  const p = new URL(url).pathname;
  return path.join(SITE_DIR, p.endsWith("/") ? p + "index.html" : p);
};

async function changedUrls() {
  if (submitAll) return urls;
  const out = [];
  const queue = [...urls];
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      try {
        const built = mainHash(await readFile(builtFile(url), "utf8"));
        const res = await fetch(url, { redirect: "manual", headers: { "user-agent": "GreenPlusEXIM-IndexNow/1.0" } });
        if (res.status !== 200) { out.push(url); continue; }
        if (mainHash(await res.text()) !== built) out.push(url);
      } catch {
        out.push(url); // can't compare → safer to submit than to miss a change
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  return out;
}

const changed = await changedUrls();
await log(`${urls.length} sitemap URLs, ${changed.length} new or changed vs. live${submitAll ? " (--all)" : ""}.`);
if (!changed.length) process.exit(0);

if (dryRun) {
  changed.forEach((u) => console.log("  [dry-run] " + u));
  process.exit(0);
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation: `${base}/${key}.txt`, urlList: changed.slice(0, 10000) }),
});
const body = (await res.text()).slice(0, 300).replace(/\s+/g, " ");
// 200 = accepted, 202 = accepted, key validation pending. Anything else is worth reading.
await log(`submitted ${changed.length} URL(s) → HTTP ${res.status}${body ? ` ${body}` : ""}`);
changed.forEach((u) => console.log("  " + u));
