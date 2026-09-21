/* Loads every src/_data/trade-data/*.json file into a single map keyed by filename (minus .json),
   so templates can do tradeDataFiles["banana-0803"]. New files added by research passes are
   picked up automatically on the next build. */
const fs = require("fs");
const path = require("path");

module.exports = function () {
  const dir = path.join(__dirname, "trade-data");
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    try {
      out[file.replace(/\.json$/, "")] = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    } catch (e) {
      console.warn(`[trade-data] Skipping unparseable file ${file}: ${e.message}`);
    }
  }
  return out;
};
