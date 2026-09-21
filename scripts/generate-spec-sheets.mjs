/* Generates one PDF spec sheet per product (Block B) by rendering each build-time
   src/spec-sheets/*.njk page (already noindex HTML in _site/spec-sheets/<slug>/) with
   Playwright and printing it to PDF at _site/spec-sheets/<slug>.pdf. Runs after `eleventy`
   in the build chain — see package.json's `build` script. Never fails the deploy: if
   Playwright/Chromium isn't available in a given environment, it logs and exits 0 so a
   missing spec-sheet PDF never blocks a site deploy (product pages link to it, but the
   page itself still works without the PDF present). */
import { chromium } from "playwright";
import http from "node:http";
import { readFile, stat, readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.join(__dirname, "..", "_site");
const SPEC_DIR = path.join(SITE_DIR, "spec-sheets");
const PORT = 8792;

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".svg": "image/svg+xml" };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      let urlPath = decodeURIComponent(req.url.split("?")[0]);
      if (urlPath.endsWith("/")) urlPath += "index.html";
      const filePath = path.join(SITE_DIR, urlPath);
      try {
        const body = await readFile(filePath);
        res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
        res.end(body);
      } catch (e) {
        res.writeHead(404);
        res.end("Not found");
      }
    });
    server.listen(PORT, () => resolve(server));
  });
}

async function main() {
  let entries;
  try {
    entries = await readdir(SPEC_DIR, { withFileTypes: true });
  } catch (e) {
    console.log("generate-spec-sheets: no _site/spec-sheets directory found (build may not have run) — skipping.");
    return;
  }
  const slugs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  if (!slugs.length) {
    console.log("generate-spec-sheets: no spec-sheet pages found — skipping.");
    return;
  }

  const server = await serve();
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    console.warn(`generate-spec-sheets: Chromium unavailable (${e.message}) — skipping PDF generation, HTML spec sheets are still published.`);
    server.close();
    return;
  }

  const page = await browser.newPage();
  let ok = 0;
  for (const slug of slugs) {
    try {
      await page.goto(`http://localhost:${PORT}/spec-sheets/${slug}/`, { waitUntil: "networkidle" });
      await page.pdf({
        path: path.join(SPEC_DIR, `${slug}.pdf`),
        format: "A4",
        printBackground: true,
        margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
      });
      ok++;
    } catch (e) {
      console.warn(`generate-spec-sheets: failed for "${slug}": ${e.message}`);
    }
  }

  await browser.close();
  server.close();
  console.log(`generate-spec-sheets: generated ${ok}/${slugs.length} PDF spec sheets in _site/spec-sheets/.`);
}

main().catch((e) => {
  console.warn(`generate-spec-sheets: unexpected error (${e.message}) — continuing without failing the build.`);
});
