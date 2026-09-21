/* Confirms every AI/search crawler the build spec requires is explicitly allowed in the built
   robots.txt, that no Netlify header rule adds an X-Robots-Tag blocking them, and that core
   content renders without JS (spot-checks a few representative pages for server-rendered text). */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const REQUIRED_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
];

const issues = [];

// --- robots.txt ---
const robotsPath = path.join(ROOT, "_site", "robots.txt");
let robotsTxt;
try {
  robotsTxt = await readFile(robotsPath, "utf8");
} catch (e) {
  console.error("No built robots.txt found — run `npm run build` first.");
  process.exit(1);
}

// Parse into { userAgent: [directives] } blocks, respecting blank-line-separated groups.
const blocks = robotsTxt.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
const agentAllow = {};
for (const block of blocks) {
  const lines = block.split("\n").map((l) => l.trim());
  const agents = lines.filter((l) => /^User-agent:/i.test(l)).map((l) => l.split(":")[1].trim());
  const hasAllowRoot = lines.some((l) => /^Allow:\s*\/\s*$/i.test(l));
  const hasDisallowRoot = lines.some((l) => /^Disallow:\s*\/\s*$/i.test(l));
  for (const agent of agents) {
    agentAllow[agent] = hasAllowRoot && !hasDisallowRoot;
  }
}

for (const bot of REQUIRED_BOTS) {
  if (!agentAllow[bot]) {
    issues.push(`robots.txt does not explicitly Allow: / for "${bot}"`);
  }
}

// --- netlify.toml header rules: make sure no X-Robots-Tag: noindex is set globally ---
const netlifyToml = await readFile(path.join(ROOT, "netlify.toml"), "utf8");
if (/X-Robots-Tag/i.test(netlifyToml)) {
  const match = netlifyToml.match(/X-Robots-Tag\s*=\s*"([^"]*)"/i);
  if (match && /noindex/i.test(match[1])) {
    issues.push(`netlify.toml sets a global X-Robots-Tag that includes "noindex": ${match[1]}`);
  }
}

// --- CSP note: CSP only restricts what a page's own client-side JS may load: it has no effect
// on a bot fetching and reading the server-rendered HTML response body, so it can't block crawlers
// from reading content. Confirmed by inspection; no runtime check needed.

// --- Server-rendered content spot-check (no-JS content parity) ---
const SPOT_CHECK_PAGES = [
  { file: "index.html", marker: "India's Export House" },
  { file: "products/fresh-fruits/banana/index.html", marker: "Cavendish" },
  { file: "blog/how-exporting-with-green-plus-exim-works/index.html", marker: "Send your requirement" },
];
for (const { file, marker } of SPOT_CHECK_PAGES) {
  try {
    const html = await readFile(path.join(ROOT, "_site", file), "utf8");
    if (!html.includes(marker)) {
      issues.push(`${file}: expected content "${marker}" not found in raw server-rendered HTML (may require JS to appear)`);
    }
  } catch (e) {
    issues.push(`${file}: could not read built file (${e.message})`);
  }
}

if (issues.length) {
  console.error(`\nCrawler access check FAILED — ${issues.length} issue(s):\n`);
  issues.forEach((i) => console.error("  " + i));
  process.exit(1);
} else {
  console.log(`Crawler access check passed — all ${REQUIRED_BOTS.length} required bots explicitly allowed, no blocking headers, content is server-rendered.`);
}
