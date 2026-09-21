/* Fails the build if banned compliance-claim phrases appear anywhere in the built HTML. */
const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "..", "_site");

const BANNED = [
  "FSSAI certified",
  "ISO certified",
  "ISO 9001",
  "HACCP certified",
  "MPEDA registered",
  "certified organic",
  "organic certified",
  "Halal certified",
  "BRC",
  "GlobalGAP certified",
  "aggregateRating",
  "reviewCount",
  "not certified",
  "no certification",
  "XXXXXXXX",
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

if (!fs.existsSync(SITE_DIR)) {
  console.error("No _site directory found. Run `npm run build` first.");
  process.exit(1);
}

const files = walk(SITE_DIR);
let violations = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  for (const phrase of BANNED) {
    if (content.includes(phrase)) {
      violations.push({ file: path.relative(SITE_DIR, file), phrase });
    }
  }
}

if (violations.length) {
  console.error(`\nCompliance lint FAILED — ${violations.length} violation(s):\n`);
  violations.forEach((v) => console.error(`  ${v.file}: contains "${v.phrase}"`));
  process.exit(1);
} else {
  console.log(`Compliance lint passed — ${files.length} HTML files checked, 0 banned phrases found.`);
}
