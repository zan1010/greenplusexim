/* Shared by check-heading-overlap.mjs and check-blog-standard.js: flags pairs of H2s on one page
   whose content-word sets overlap >= 60% (overlap coefficient: shared / smaller set), which is
   the signature of a prose section duplicating a structured block (e.g. "Documentation" vs
   "Documentation checklist for the United States"). */
const STOP = new Set(
  ("a an the of for to in on and or vs versus from with by at as your you we our what which how " +
   "why when where is are do does it its this that need needs india indian s " +
   "export exports exporter exporting get request quote").split(" ")
);

function tokens(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/&[a-z#0-9]+;/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w && !STOP.has(w))
  );
}

function h2s(html) {
  return [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());
}

// Fixed headings emitted by layout partials. They necessarily repeat the product name, so a
// pair of two of them isn't duplication; they're still compared against the post's own H2s.
const TEMPLATE_H2 = [
  /commercial facts$/i, /^where india exports /i, /^frequently asked questions$/i, /^sources$/i,
  /^related reading$/i, /^request an? .* quote$/i, /^get your export quote$/i,
];
const isTemplate = (t) => TEMPLATE_H2.some((re) => re.test(t));

function overlappingH2s(html, threshold = 0.6) {
  let heads = h2s(html).map((t) => ({ text: t, set: tokens(t) }));
  // Words in 3+ H2s on the page are its topic (the product name in "Where India exports X",
  // "X — Commercial Facts", "Request an X Quote"), not a sign of duplication — ignore them.
  const df = new Map();
  heads.forEach((h) => h.set.forEach((w) => df.set(w, (df.get(w) || 0) + 1)));
  heads = heads
    .map((h) => ({ text: h.text, set: new Set([...h.set].filter((w) => df.get(w) < 3)) }))
    .filter((h) => h.set.size);
  const pairs = [];
  for (let i = 0; i < heads.length; i++) {
    for (let j = i + 1; j < heads.length; j++) {
      if (isTemplate(heads[i].text) && isTemplate(heads[j].text)) continue;
      const a = heads[i].set, b = heads[j].set;
      const shared = [...a].filter((w) => b.has(w)).length;
      const score = shared / Math.min(a.size, b.size);
      if (score >= threshold) pairs.push({ a: heads[i].text, b: heads[j].text, score });
    }
  }
  return pairs;
}

module.exports = { overlappingH2s, h2s, tokens };
