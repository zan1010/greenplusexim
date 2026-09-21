/* Runs the full quality-gate suite (Section 12 of the build spec). Exits non-zero on first failing gate. */
const { execSync } = require("child_process");

const steps = [
  ["Build", "npx eleventy"],
  ["Spec-sheet PDFs", "node scripts/generate-spec-sheets.mjs"],
  ["HTML validation", "npm run check:html"],
  ["Forms check", "node scripts/check-forms.js"],
  ["Compliance lint", "node scripts/check-compliance.js"],
  ["Orphan check", "node scripts/check-orphans.js"],
  ["Broken links", "node scripts/check-broken-links.js"],
  ["Blog quality", "node scripts/check-blog-quality.js"],
  ["Mobile nav + RTL", "node scripts/check-mobile-rtl.mjs"],
  ["Crawler access", "node scripts/check-crawler-access.mjs"],
  ["Uniqueness ratio", "node scripts/uniqueness.mjs"],
];

let failed = false;
for (const [label, cmd] of steps) {
  console.log(`\n=== ${label} ===`);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (e) {
    console.error(`\n✖ ${label} FAILED`);
    failed = true;
    break;
  }
}

if (failed) {
  console.error("\nQuality gates FAILED. Fix the issue above before continuing.");
  process.exit(1);
} else {
  console.log("\nAll quality gates passed.");
}
