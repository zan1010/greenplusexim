/* Loads every src/_data/i18n/*.json into one map keyed by language code, e.g. i18n.ar.fullName.
   Templates look up `{{ i18n[lang][key] | default(i18n.en[key]) }}` so any missing translation
   falls back to English rather than rendering blank. */
const fs = require("fs");
const path = require("path");

module.exports = function () {
  const dir = path.join(__dirname, "i18n");
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    try {
      out[file.replace(/\.json$/, "")] = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    } catch (e) {
      console.warn(`[i18n] Skipping unparseable file ${file}: ${e.message}`);
    }
  }
  return out;
};
