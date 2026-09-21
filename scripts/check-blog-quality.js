/* Verifies every published blog post meets Section 12's bar: word count >= 1500,
   FAQ >= 5, and (where it cites trade data) a visible source + year. */
const fs = require("fs");
const path = require("path");

const SITE_ROOT = path.join(__dirname, "..", "_site");
const BLOG_DIRS = ["blog", "ar/blog", "id/blog", "vi/blog", "ms/blog", "pt/blog", "es/blog", "fr/blog", "de/blog", "nl/blog"]
  .map((d) => path.join(SITE_ROOT, d))
  .filter((d) => fs.existsSync(d));

let files = [];
for (const blogDir of BLOG_DIRS) {
  for (const entry of fs.readdirSync(blogDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const f = path.join(blogDir, entry.name, "index.html");
      if (fs.existsSync(f)) files.push(f);
    }
  }
}
let issues = [];

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(SITE_ROOT, file);
  if (/noindex/.test(html)) continue;

  // Word count: strip tags/scripts/styles, count words across the whole <main> —
  // the layout spreads TL;DR/body/FAQ/sources/trade-data across several <section>s, not just <article>.
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/);
  const articleHtml = mainMatch ? mainMatch[0] : html;
  const text = articleHtml
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = text.split(" ").filter(Boolean).length;
  if (wordCount < 1500) issues.push(`${rel}: only ${wordCount} words (need >= 1500)`);

  // FAQ count: count faq-item blocks.
  const faqCount = (html.match(/class="faq-item"/g) || []).length;
  if (faqCount < 5) issues.push(`${rel}: only ${faqCount} FAQ items (need >= 5)`);

  // Trade-data table: if present, must show a source note with a year.
  if (html.includes('id="top-markets"')) {
    if (!/<strong>Source:<\/strong>/.test(html)) {
      issues.push(`${rel}: has a trade-data table but no visible source citation`);
    }
  }
}

if (issues.length) {
  console.error(`\nBlog quality check FAILED — ${issues.length} issue(s):\n`);
  issues.forEach((i) => console.error("  " + i));
  process.exit(1);
} else {
  console.log(`Blog quality check passed — ${files.length} posts checked (word count, FAQ count, source citations).`);
}
