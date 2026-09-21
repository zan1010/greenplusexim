# Phase 2 Report — Before/After Metrics

Tracks the new priority-ordered brief (Blocks A–H). Updated as each block completes. One section per block, added in order — nothing here is retroactively reordered.

---

## Block A — Indexation, measurement & pending fixes

**Status: ✅ Complete. All gates passing. Pausing here for review per instruction.**

### A1 — Form internationalization

| | Before | After |
|---|---|---|
| Non-English form labels | Hardcoded English on all localized pages (Arabic, Indonesian, Vietnamese, Malay, Portuguese) | Rendered via `i18n \| t(lang, key)` with English fallback — 64 keys × 6 languages |
| Field `name=` / option `value=` attributes | English | **Unchanged** — still English, byte-identical (required for Netlify Forms routing) |
| Netlify form-name/field-set consistency check | Passing (315 instances / 4 names) | Still passing (315 instances / 4 names) — no regression |
| RTL rendering (Arabic) | Physical `left`/`right` CSS in 5 components (skip-link, dropdown, WhatsApp float, modal-close, consent banner) | Converted to logical properties (`inset-inline-start/end`) — mirrors correctly |
| Mobile/RTL automated check | None existed | `scripts/check-mobile-rtl.mjs` (Playwright) — drawer behaviour at 390px, Arabic `dir`/no-clipped-inputs at 360px. **New gate, passing.** |

### A2 — Audit & indexing tooling

| | Before | After |
|---|---|---|
| SEO/indexation audit | None | `scripts/seo-audit.mjs` → `reports/seo-audit.json` + `.md`. Read-only, non-gating, run on demand or monthly. |
| IndexNow submission | None | `scripts/indexnow-submit.mjs` — diffs current sitemap URLs against last-submitted snapshot, submits only the delta. Forces dry-run automatically until a real key replaces the `TODO` placeholder in `site.json` (see `OWNER_TODO.md` #3). Wired into `netlify.toml`'s build command as a non-blocking post-build step. |
| IndexNow key verification file | N/A | `src/indexnow-key.njk` — serves `/<key>.txt` once a real key is set; harmless placeholder path until then. |
| Crawler access verification | Manual/assumed | `scripts/check-crawler-access.mjs` — confirms all 9 required bots allowed in built `robots.txt`, no blocking `X-Robots-Tag`, spot-checks that content is server-rendered (not JS-dependent). **New gate, passing.** |
| **Blog-post sitemaps** (bug found via new tooling) | `sitemap-blog-en.xml` / `sitemap-blog-intl.xml` silently contained **0 URLs** — Eleventy collection globbed `**/*.md`, every post is `.njk` | Fixed glob to `**/*.njk` filtered by `data.slug` presence. Sitemaps now correctly list all 26 English + 12 international posts. |
| **Hub pages in sitemap** (bug found via new tooling) | `/products/`, `/markets/`, `/blog/` excluded from every sitemap via a stray `eleventyExcludeFromCollections: true` | Flag removed from all three; `corePages` collection glob expanded to cover them explicitly. |

### A3 — Uniqueness ratio gate

Thresholds: unique ratio ≥45% (product/category/country/region), ≥60% (blog); max pairwise similarity <25% for all — 5-gram shingle Jaccard on boilerplate-stripped `<main>` content.

| | Before (first run, buggy stripper) | After (fixed stripper) |
|---|---|---|
| Boilerplate stripper | Runaway regex ate ~95% of real page content, leaving ~68-70 words/page | Rewritten to extract `<main id="main">` directly — real word counts (600-1,030 per page) |
| Reported failures | 78 pages "failing" (false positives caused by the stripper bug) | **0 failures** |
| Region pages specifically | 7.9-10.9% unique / 82-85% max pairwise (genuinely too templated, not just a measurement artifact) | 75.5-83.1% unique / 9.9-12.4% max pairwise — fixed by adding real per-region aggregated trade-data tables (`_data/regionCountryMap.js` + `regionTopProducts` filter), not just re-measuring |
| Pages measured / passing | — | **70 / 70 pass** across blog, category, country, region, product families |

Full page-by-page table: `reports/uniqueness.md`. No pages required 301 consolidation — none were duplicate-content-only.

### A4 — OWNER_TODO.md

| | Before | After |
|---|---|---|
| Structure | Flat list of findings (compliance, DGFT, translation-review) — no setup sequence | New numbered "Do this today" section (8 steps: GSC, Bing Webmaster, IndexNow, GA4, Clarity, Netlify Forms, Google Business Profile, git/Xcode CLT) with exact click paths as of Sept 2026, plus a "first 30 days" measurement plan |
| Prior content | — | **Fully preserved** — all DGFT findings, compliance items, translation-review gate, and Phase 1 photography/registration notes remain, just renumbered under the existing headings below the new setup section |

### Gate suite — full before/after

| Gate | Before this block | After |
|---|---|---|
| HTML validation | Pass | Pass |
| Forms consistency | Pass (315/4) | Pass (315/4) |
| Compliance lint | Pass (126 files, 0 violations) | Pass (126 files, 0 violations) |
| Orphan check | Pass | Pass |
| Broken links | Pass | Pass |
| Blog quality | Pass (38 posts) | Pass (38 posts) |
| Mobile nav + RTL | **Did not exist** | **Pass (new gate)** |
| Crawler access | **Did not exist** | **Pass (new gate)** |
| Uniqueness ratio | **Did not exist** | **Pass — 70/70 pages (new gate)** |

**Indexable pages: 101. Noindex pages: 24. Sitemap URL count: 101 (was silently under-counting by 33 before the blog/hub sitemap bugs were fixed).**

### Known, logged, non-blocking issues (not fixed in this pass)

- 44 pages have meta descriptions over the 155-character soft limit — report-only finding in `reports/seo-audit.md`, not a build gate. Candidate for a future quick-trim pass.
- 27 non-home pages (mostly author/legal/resource pages predating the breadcrumb partial) lack `BreadcrumbList` schema.

---

## Block B — Money pages

**Status: ✅ Complete. All gates passing. Pausing here for review per instruction.**

### Coverage

| | Before Block B | After Block B |
|---|---|---|
| Product pages | 9 | **28** (+19) |
| Country pages | 15 | **22** (+7: Yemen, Kuwait, Japan, Italy, France, Russia, Uzbekistan) |
| Product×country landing pages | 0 | **20** (new page type — top 20 demand pairs by verified export value with both a product and country page already published) |
| Spec-sheet PDFs | 0 | **28** (one per product, generated at build time via Playwright, `_site/spec-sheets/<slug>.pdf`) |
| `/products/compare/` tool | Did not exist | **Live** — filterable/searchable table of all 28 products |
| Indexable pages sitewide | 101 | **148** |
| HS codes with a published, DGFT-policy-checked product page | 9 of 63 in `hsCodes.json` | **28 of 63** |

### DGFT verification (all 19 new product pages individually checked before publishing)

- **Confirmed Free, published:** all 6 core spices (turmeric, red chilli, cumin, coriander, black pepper, cardamom — DGFT Schedule 2 has no restricted/prohibited entries anywhere in the spices chapter), chickpeas, masoor lentils, groundnut kernels, guar gum, dehydrated onion & garlic powder, fish meal, garlic, mango, squid & cuttlefish, psyllium husk, dried ginger.
- **Pulses ban-lift reconciled:** a policy-schedule mirror initially showed chickpeas/masoor as "Prohibited" — traced to a stale, pre-September-2017 snapshot. A 2017 news report confirms DGFT lifted the general pulses export ban that year "till further orders," corroborated by Phase 2b's own 2024 WITS data (chickpeas USD 283M, lentils USD 149M — flows that couldn't exist under an active ban). Published on that basis, with the history stated as page content rather than hidden.
- **Maize published with a deliberate caution, not a flat "Free":** the same policy-schedule source showed maize (non-seed) as flatly Prohibited, directly contradicted by current USDA reporting of real, growing 2025-26 Indian maize exports (~2.4M tonnes estimated, mostly to Nepal/Bhutan/Bangladesh/Sri Lanka/Vietnam). Built the page treating export as currently active, but explicitly frames the government's ethanol-blending programme as an ongoing constraint and states terms are confirmed at time of order — the same pattern already used successfully for onion. Flagged in `OWNER_TODO.md` for direct owner verification against the primary DGFT document.
- **DORB vs. raw rice bran, kept distinct:** confirmed raw/boiled rice bran (HS 2302.20) is Restricted/licensed-only — a separate code from DORB (2306.90/2302.40), which Phase 2b already verified is Free since October 2025. The new DORB page states both facts so a buyer can't conflate the two.
- **Confirmed Restricted, not published:** groundnut cake (HS 2305 — licence-only export) and fresh ginger specifically (the ginger page is explicitly the dried-form product, since fresh ginger carries a separate restriction).
- **Source-quality caveat carried into `OWNER_TODO.md`:** this pass used a third-party mirror of the DGFT Schedule 2 tables, not the DGFT PDF itself (still no working PDF text extractor on this machine — same Xcode Command Line Tools gap blocking `git`). Worth a periodic spot-check against the primary document, particularly for maize.

### Uniqueness gate — the real risk in this block

The 20 product×country pages were the highest uniqueness risk in Block B: five of them are all "basmati rice to a different Gulf/US market," structurally identical combinations of two already-published pages. Mitigation: dispatched forks with an explicit instruction to read both parent pages and synthesize genuinely distinguishing content (specific ports, buyer profiles, policy nuances already documented there) rather than swap a country name in a template, and to omit the full trade-data table (already shown on both parent pages) to avoid duplicate-boilerplate similarity. Result: **all 117 measured pages passed on the first full gate run** after one round of manual content-divergence fixes on a France/Italy country-page pair that came in at 26.5% pairwise (just over the 25% limit) — resolved by replacing their most-similar shared section with country-specific content (Italy's black-pepper/culinary-market angle; France's Le Havre-vs-Marseille routing angle) rather than by trimming length.

### Two real bugs found and fixed during this block (not part of the original scope, but blocking accurate builds)

1. The 20 product×country pages initially inherited `type: "product"` from the products directory's front-matter default, colliding with their parent pages inside `collections.products` — would have produced duplicate PDFs and duplicate compare-tool rows. Fixed with an explicit `type: "product-country"` override, caught by a fork's own build-verification step before it ever reached the coordinator.
2. That fix then made the 20 pair pages invisible to `sitemap-products.xml` (which reads `collections.products`) — caught by re-running `seo-audit.mjs` after the fix, which flagged "20 indexable pages missing from sitemap." Fixed with a dedicated `productCountryPairs` Eleventy collection, now included in the sitemap template.

### Gate suite — full before/after

| Gate | Before this block | After |
|---|---|---|
| HTML validation | Pass | Pass (4 rounds of title-length/entity-escaping fixes along the way — see below) |
| Forms consistency | Pass (315/4) | Pass (455/4) |
| Compliance lint | Pass (152 files) | Pass (201 files, 0 violations) |
| Orphan check | Pass | Pass (2 rounds of inbound-link fixes for newly-built pages with too few cross-links) |
| Broken links | Pass | Pass |
| Blog quality | Pass (38 posts) | Pass (38 posts, unchanged — Block B didn't touch blogs) |
| Mobile nav + RTL | Pass | Pass |
| Crawler access | Pass | Pass |
| Uniqueness ratio | Pass (70 pages) | **Pass (117 pages)** |

**Indexable pages: 148 (up from 101). Sitemap URL count: 148 (parity confirmed after the collection fix above).**

### Real, non-gating fixes made along the way
- 8 pages had `<title>` tags over the 60-character limit once the " | Green Plus EXIM" suffix was counted — shortened all 8.
- 2 raw, un-escaped `&` characters in guar gum's FAQ/body content (both inside `| safe`-filtered output, which doesn't auto-escape) — fixed to `&amp;`.
- 1 literal "not certified" phrase in a coriander FAQ (about planting-seed vs. culinary use, not a quality certification) tripped the compliance lint's substring match — rephrased, consistent with the standing rule that even semantically-harmless mentions of a banned phrase must be reworded.

### Not built this pass (deliberate, logged in `research/unverified.md` and `OWNER_TODO.md`)
Toor dal, moong, urad (policy understood as Free, but still no per-country trade-data file); millets, makhana, jaggery (still ambiguous or unconfirmed); a dozen vegetables/fruits with no verified data yet (potato, tomato, okra, drumstick, green chilli, papaya, watermelon, lemon/lime, coconut); vermicompost, poultry manure, bio-fertilizer, seaweed fertilizer, compost (share organic manure's HS code and data — not built separately this pass to avoid a near-duplicate-content cluster; worth doing once each has genuinely distinct sourcing content).

---

*Block C report will be appended here once started, per the same before/after format.*
