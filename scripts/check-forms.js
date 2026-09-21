/* Verifies every <form> in the built site: data-netlify="true", form-name hidden input matches
   the form's name attribute, and every instance of a given form name has an identical field set. */
const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "..", "_site");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function extractForms(html) {
  const forms = [];
  const formRegex = /<form\b([^>]*)>([\s\S]*?)<\/form>/g;
  let match;
  while ((match = formRegex.exec(html))) {
    const attrs = match[1];
    const body = match[2];
    const nameMatch = attrs.match(/\bname="([^"]*)"/);
    const netlifyMatch = attrs.match(/\bdata-netlify="true"/);
    const formNameHidden = body.match(/<input[^>]*name="form-name"[^>]*value="([^"]*)"/);
    // Client-side-only utility forms (e.g. the container calculator) have neither
    // data-netlify nor a form-name hidden field — they're not Netlify forms, skip them.
    if (!netlifyMatch && !formNameHidden) continue;
    const fieldNames = [...body.matchAll(/<(?:input|select|textarea)\b[^>]*\bname="([^"]*)"/g)].map((m) => m[1]).sort();
    forms.push({
      name: nameMatch ? nameMatch[1] : null,
      hasNetlify: !!netlifyMatch,
      formNameHiddenValue: formNameHidden ? formNameHidden[1] : null,
      fields: fieldNames,
    });
  }
  return forms;
}

if (!fs.existsSync(SITE_DIR)) {
  console.error("No _site directory found. Run `npm run build` first.");
  process.exit(1);
}

const files = walk(SITE_DIR);
const byName = {};
let errors = [];
let totalForms = 0;

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const forms = extractForms(html);
  for (const form of forms) {
    totalForms++;
    const rel = path.relative(SITE_DIR, file);
    if (!form.name) {
      errors.push(`${rel}: <form> has no name attribute`);
      continue;
    }
    if (!form.hasNetlify) {
      errors.push(`${rel}: form "${form.name}" is missing data-netlify="true"`);
    }
    if (form.formNameHiddenValue !== form.name) {
      errors.push(`${rel}: form "${form.name}" hidden form-name value ("${form.formNameHiddenValue}") does not match form name`);
    }
    byName[form.name] = byName[form.name] || [];
    byName[form.name].push({ file: rel, fields: form.fields });
  }
}

for (const [name, instances] of Object.entries(byName)) {
  const first = instances[0].fields.join(",");
  for (const inst of instances.slice(1)) {
    if (inst.fields.join(",") !== first) {
      errors.push(
        `Field-set mismatch for form "${name}": ${instances[0].file} has [${first}] but ${inst.file} has [${inst.fields.join(",")}]`
      );
    }
  }
}

if (errors.length) {
  console.error(`\nForms check FAILED — ${errors.length} issue(s):\n`);
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
} else {
  console.log(`Forms check passed — ${totalForms} form instance(s) across ${Object.keys(byName).length} form name(s), all consistent.`);
}
