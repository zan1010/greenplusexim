# Blog Overhaul — Progress Report

Tracks the blog content-standard rebuild (26 posts) against the brief. Updated per batch. Nothing here is retroactively reordered — new sections are appended.

---

## Step 0 — Blocking fixes ✅ (2026-09-28)

| Item | Status |
|---|---|
| Single-source base URL | **Fixed.** New `scripts/site-url.js` computes the canonical base URL once: `SITE_URL` env var → Netlify's own `URL`/`DEPLOY_PRIME_URL` (so preview/branch deploys self-canonicalize) → production domain as the final fallback. `src/_data/site.js` (replaces the static `site.json`, now `site.base.json`) and the `absUrl` Nunjucks filter in `.eleventy.js` both read from this single function. Verified: with `SITE_URL` set to a fake deploy-preview URL, canonical/OG/sitemap output all followed it; with no override, everything resolves to `https://www.greenplusexim.com`. |
| `/sitemap.xml` → `/sitemap-index.xml` | **Fixed.** 301 redirect added to `netlify.toml`. |
| Empty `sitemap-blog-intl.xml` in the index | **Fixed.** New `indexableIntl` Eleventy filter checks whether any localized post is both `reviewed: true` and not `noindex` before `sitemap-index.xml` lists it. Currently 0 such posts exist (all localized posts are still `reviewed: false` from the earlier translation pass), so the index correctly omits it rather than publishing an empty `<urlset>`. |
| Re-run uniqueness gate, publish baseline | **Done.** `reports/uniqueness.md` regenerated — 117 pages / 5 template families, all passing. Two real bugs found and fixed along the way (see below), neither of which changes the pass/fail outcome once fixed, but both would have quietly broken the measurement for any future content that touches `<main>` attributes or the SVG chart. |

**Bugs found and fixed while doing Step 0 / infrastructure work (not in original scope, but blocking or silently breaking things):**
1. `scripts/uniqueness.mjs` boilerplate-stripper regex required an *exact* `<main id="main">` tag with no other attributes — adding `data-category` to `<main>` (needed for the new word-count-by-category gate) silently broke the regex, causing it to fall back to diffing whole-page HTML (headers/footers/nav included) for any page with a `category` field, which is most product pages. Caught immediately because it flipped two previously-passing spice product pages to a false "28.5% similarity" failure. Fixed the regex to tolerate attributes.
2. `barChart` Eleventy shortcode (used by every product page and now every migrated blog post) had a latent bug: when a chart falls back to charting quantity instead of USD value (e.g. the shrimp dataset, which has no per-country USD split), the value label rendered `fmt(r.value_usd)` — always `undefined` — instead of `fmt(r[field])`. Never surfaced before because no shipped page had used the quantity-fallback path with a rendering user would notice in this pass. Fixed, and added `<title>`/`<desc>` elements to every chart for accessibility (required by the new gate). First version of the `<desc>` used a fixed boilerplate sentence structure that inflated cross-page shingle similarity — rewritten to describe the actual data as a compact "country value, country value" list instead.
3. **Pre-existing, sitewide, not something I introduced:** every one of the 38 existing blog posts sets `trade_data:` (snake_case, the schema `CONTENT_GUIDE.md` documents) in front matter, but `layouts/blog.njk` checked `tradeData` (camelCase, the product-page convention) — a mismatch that meant **the market-data table and chart have never rendered on any blog post**, ever, despite `CONTENT_GUIDE.md` listing it as required item #3 and the old `check-blog-quality.js` gate silently treating it as optional. Fixed by changing `blog.njk` to read `trade_data`, matching the documented blog schema (rather than renaming 38 files to match the product convention). This is the single highest-impact fix in this pass — it means content that was already researched and cited in `src/_data/trade-data/*.json` for all 26 English posts was invisibly absent from the published pages until now.

---

## New content-standard infrastructure ✅ (2026-09-28)

- **Partials:** `partials/blog-commercial-facts.njk` (13-field commercial-facts table — HS code and per-post fields from a new `commercialFacts` front-matter object; MOQ/loading-ports/Incoterms/payment-terms pulled from `site.base.json` so they're stated identically everywhere) and `partials/blog-documentation-checklist.njk` (exporter/importer-split document table + destination-authority outbound link, from new `docChecklist`/`destinationAuthority` front-matter fields).
- **`layouts/blog.njk` restructured** to the required order: quick-answer → commercial-facts table → market-data table + chart → documentation checklist → body (intro, price-behaviour section, operator-detail section, compare-options table) → key facts → FAQ → sources → related reading → CTA.
- **Body-content convention:** price-behaviour and operator-detail sections are wrapped in `<!-- price-behaviour:start/end -->` / `<!-- operator-detail:start/end -->` HTML comments so the gate can locate and validate them regardless of how the heading is worded per product; compare-options tables use `<div id="compare-options">`.
- **New config fields** in `site.base.json`: `loadingPortsShort`, `incotermsShort`, `paymentTermsShort` (existing `defaultMoq` reused) — so every post states MOQ/ports/Incoterms/payment terms identically, sourced from one place.
- **New gate `scripts/check-blog-standard.js`** (wired into `npm run check` as "Blog content standard"), scoped to posts that have opted in by declaring `commercialFacts` (i.e. posts actually migrated) so the build doesn't break for the 21 not-yet-touched posts mid-overhaul. Enforces: word count (≥2000 buyer-guides / ≥1600 other), all 13 commercial-facts fields present with ≤2 "On request"/"Varies by season" rows, market-data table ≥5 rows + citation + retrieval date, SVG chart `<title>`/`<desc>`, documentation checklist with an outbound link to an allowlisted official-authority domain, price-behaviour section with no absolute-price regex match, operator-detail section ≥200 words, compare-options table present, FAQ ≥7 with `FAQPage` schema, and a denylist check against known aggregator source domains.
- **New gate `scripts/check-seo-integrity.mjs`** ("SEO integrity"): canonical host is a single consistent value sitewide, the `/sitemap.xml` redirect exists, no sitemap listed in `sitemap-index.xml` is empty, and no two blog posts in the same language share a `primary_keyword` (the cannibalization guardrail `CONTENT_GUIDE.md` already documented, now enforced in code).
- Full `npm run check` (11 gates) passes.

---

## Batch 1 — top-value buyer guides ✅ (2026-09-28)

All 5 posts migrated to the full standard, all passing `check:blog-standard`, `check:blog-quality`, compliance, and uniqueness (max pairwise similarity well under the 25% limit even between the two shrimp posts, which share a product and trade-data file).

| Post | Words before → after* | Tables | FAQs | Missing fields |
|---|---|---|---|---|
| `frozen-vannamei-shrimp-exporter-usa` | 461 → 3,317 | 4 (commercial-facts, market-data+chart, docs, compare) | 6 → 9 | 0 |
| `frozen-shrimp-import-from-india-to-china` | 475 → 3,456 | 4 | 9 | 0 |
| `guar-gum-exporter-india-usa` | 434 → 2,864 | 4 | 8 | 0 |
| `soybean-meal-exporter-from-india-germany` | 491 → 3,209 | 4 | 8 | 0 |
| `organic-cow-manure-exporter-from-india` | 501 → 3,275 | 4 | 8 | 0 |

*"Before" is the raw body-HTML word count from the pre-rebuild source file (comparable across posts); "after" is the full rendered `<main>` word count including the now-correctly-rendering market-data table, FAQ and sources, per `check-blog-standard.js`'s own measurement method — so the increase reflects both new required sections and the trade_data bug fix (item 3 above) making the market-data table appear at all for the first time.

**Data-sourcing work done alongside the content rewrite (not just copy — verified primary sources):**
- **`frozen-shrimp-030617.json`** (used by both shrimp posts): replaced an aggregator citation (agritimes.co.in) with MPEDA's own official Press Release Note PDF, read directly and cross-checked line-by-line against the figures already in the dataset — all matched. Added the total-seafood-by-destination USD figures from the same PDF to the file's notes (not the per-country shrimp table itself, since the PDF only gives shrimp quantities by destination, not shrimp-specific USD by destination — left `value_usd: null` rather than estimate one, per the site's "never invent a number" rule).
- **`organic-manure-3101.json`**: replaced a thin, lower-confidence 3-country dataset (private aggregator, SeAir/ExportImportData.in) with a verified 10-country WITS/UN Comtrade pull (Nepal, USA, Philippines, Kenya, Bangladesh, China, Sri Lanka, Vietnam, Tanzania, Indonesia — real USD values and kg quantities, 2023). This also meant rewriting the post's market narrative, which previously led with Italy/France (no longer in the dataset) — now correctly leads with Nepal/USA/Philippines.
- **Destination-authority links** verified for real, official URLs rather than guessed: FDA/FSVP (both shrimp-USA and, differently, as the representative case for the manure post), GACC's CIFER portal (`cifer.singlewindow.cn` — verified as GACC's sole official registration portal, not a gacc.gov.cn URL, so added to the gate's authority allowlist), and destination-authority pages for guar gum (FDA/GRAS) and soybean meal (EU import-control reference).

**Coordination notes (for honesty, not just tidiness):** Batch 1 was dispatched as 5 parallel background forks, each scoped to one file. Two of the five (shrimp-USA, shrimp-China) initially returned *without actually editing their assigned file* — their first response summarized overall session status instead of doing the rewrite. Caught by directly checking the file (line count, presence of `commercialFacts:`) rather than trusting the self-report, then pushed via a follow-up message; both then completed the actual rewrite correctly. Separately, one fork misread an unrelated tool result and, believing forks were unavailable, spawned 4 duplicate general-purpose agents to redo work already in flight — caught via `ListAgents` and stopped before any file was touched twice. No content was lost or corrupted; every post in the table below was verified by direct file read and a clean build, not by trusting any agent's summary.

**Batch 1 before/after** (word counts from the built `<main>`, matching `check-blog-standard.js`'s own method):

| Post | Words before → after | Tables before → after | FAQs before → after |
|---|---|---|---|
| frozen-vannamei-shrimp-exporter-usa | 1,619 → 3,317 | 0 → 4 | 6 → 9 |
| frozen-shrimp-import-from-india-to-china | 1,583 → 3,456 | 0 → 4 | 5 → 9 |
| guar-gum-exporter-india-usa | 1,580 → 2,864 | 0 → 4 | 5 → 8 |
| soybean-meal-exporter-from-india-germany | 1,572 → 3,209 | 0 → 4 | 5 → 8 |
| organic-cow-manure-exporter-from-india | 1,630 → 3,275 | 0 → 4 | 6 → 8 |

The "0 tables before" isn't a rewrite choice — it's the sitewide `tradeData`/`trade_data` bug (§1 above): every one of the 38 existing posts was silently missing its market-data table and chart before this session, not just these 5. The 4 tables after are: commercial-facts, market-data (+ SVG chart), documentation checklist, compare-options.

**Missing fields:** 0 across all 5 posts — `check-blog-standard.js` passed clean on the first full run after the rewrite (no iteration needed).

---

## Batch 2 (2026-09-28)

Posts: `cardamom-exporter-india-gcc`, `turmeric-exporter-india-to-uae`, `india-cumin-seed-exporter-china`, `dried-red-chilli-exporter-india-to-china`, `fresh-grapes-exporter-from-india-netherlands`.

**Trade-data fix made before the rewrite:** `grapes-0806.json` had 5 country names but every `value_usd`/`qty` field was `null` (a private aggregator gave only an ordered destination list, no verifiable figures — unusable for a market-data table). Replaced with a verified WITS/UN Comtrade 2023 pull, 10 countries with real USD values and kg quantities (Netherlands ~39% of total value alone). The other four products (cardamom, turmeric, cumin, red chilli) already had 10-row WITS 2024 data from earlier research — no fix needed.

**Destination authorities reused across posts** (verified once, cited consistently): GACC's CIFER registration portal (`cifer.singlewindow.cn`, verified in Batch 1) for both China-bound posts; UAE's MOCCAE import-permit page (`moccae.gov.ae/en/services/import-permit`, newly verified) for turmeric-UAE and cardamom-GCC; EU TRACES NT (verified in Batch 1) for grapes-Netherlands.

**Coordination note:** dispatched as 5 parallel forks with hardened instructions (explicit "you are a worker, not the coordinator," don't spawn sub-agents, don't touch shared files) based on Batch 1's friction. Improved but not eliminated: 2 of 5 forks (cardamom, and briefly grapes/cumin in their final response) still narrated overall batch status instead of confirming their own edit on the first report back — caught the same way as Batch 1, by reading the file directly rather than trusting the summary, and cardamom's fork needed one explicit push via `SendMessage` before it actually wrote the file. One fork's self-report also surfaced a useful, real system fact: a fork cannot launch its own nested forks ("Fork is not available inside a forked worker") — it no-ops cleanly rather than erroring or duplicating, which is why no duplicate-agent cleanup was needed this batch (unlike Batch 1).

**Batch 2 before/after:**

| Post | Words before → after | Tables before → after | FAQs before → after |
|---|---|---|---|
| cardamom-exporter-india-gcc | 1,831 → 3,091 | 1 → 4 | 5 → 8 |
| turmeric-exporter-india-to-uae | 1,780 → 2,986 | 1 → 4 | 5 → 8 |
| india-cumin-seed-exporter-china | 1,777 → 2,806 | 1 → 4 | 5 → 8 |
| dried-red-chilli-exporter-india-to-china | 1,785 → 2,878 | 1 → 4 | 5 → 8 |
| fresh-grapes-exporter-from-india-netherlands | 1,711 → 3,127 | 1 → 4 | 5 → 8 |

("1 table before" here, vs. "0" in Batch 1's before-column, is expected and correct — these five were measured after the Batch 1 commit already fixed the sitewide `trade_data` chart bug, so their market-data table was already rendering; they just hadn't been rebuilt to the full standard yet.)

**Missing fields:** 0 across all 5 posts. **Full gate suite after Batch 2: all 11 checks pass**, `check:blog-standard` reports 10/10 migrated posts clean, uniqueness 117/117.

---

## Batch 3 (2026-09-28)

Posts: `red-onion-exporter-from-india-bangladesh`, `chickpeas-exporter-india-to-uae`, `masoor-lentils-exporter-india-bangladesh`, `groundnut-kernels-exporter-india-indonesia`, `fish-meal-exporter-india-vietnam`.

**Trade-data fix made before the rewrite:** `red-onion-0703.json` had imprecise/blended year attribution and 3 of 6 rows entirely null (private aggregator, seair.co.in/tradeimex.in). Replaced with a verified WITS/UN Comtrade 2023 pull, 10 countries with real USD values and kg quantities (Bangladesh ~33% of total value alone, then Malaysia, UAE, Sri Lanka, Nepal, Indonesia, Vietnam, Qatar, Iraq, Kuwait). The other four products (chickpeas, masoor lentils, groundnut kernels, fish meal) already had 10-row WITS 2024 data — no fix needed.

**Real gate bug found and fixed while sourcing Indonesia's destination authority:** `check-blog-standard.js`'s allowlist had `/bpom\.go\.id/i` — but that domain doesn't exist. Indonesia's government TLD is `.go.id` (not `.gov.id`), and BPOM's real domain is `pom.go.id` (no "b" prefix) — confirmed by resolving `https://www.pom.go.id` directly (HTTP 200) before `bpom.go.id` was ever going to match anything. Fixed the allowlist to `/\.go\.id/i` (any Indonesian government domain) instead of the never-matching literal. Also newly verified and added to the destination-authority set this batch: Bangladesh's BSTI (`bangladeshtradeportal.gov.bd`, reused for both Bangladesh-market posts) and Vietnam's plant-protection/import-quarantine authority (`ppd.gov.vn`).

**Coordination note:** same pattern as Batches 1–2, further improved. All 5 forks' first reports were correctly scoped to their own file this time (no coordinator-narration relapse), and all 5 had actually made the edit before reporting completion — no `SendMessage` push-backs needed this batch. Every file was still independently verified by direct read before trusting the reports.

**Batch 3 before/after:**

| Post | Words before → after | Tables before → after | FAQs before → after |
|---|---|---|---|
| red-onion-exporter-from-india-bangladesh | 1,802 → 3,100 | 1 → 4 | 5 → 8 |
| chickpeas-exporter-india-to-uae | 1,857 → 3,013 | 1 → 4 | 5 → 8 |
| masoor-lentils-exporter-india-bangladesh | 1,753 → 2,950 | 1 → 4 | 5 → 9 |
| groundnut-kernels-exporter-india-indonesia | 1,766 → 2,972 | 1 → 4 | 5 → 8 |
| fish-meal-exporter-india-vietnam | 1,775 → 2,914 | 1 → 4 | 5 → 8 |

**Missing fields:** 0 across all 5 posts. **Full gate suite after Batch 3: all 11 checks pass**, `check:blog-standard` reports 15/15 migrated posts clean, uniqueness 117/117.

---

## Template fixes, section order and Batches 4–5 ✅ (2026-09-30 – 10-01)

**Template defects fixed before continuing (all 15 earlier posts re-rendered):**
- Commercial-facts heading used the product slug ("guar-gum — commercial facts"). Now uses a required `productName` ("Guar Gum — Commercial Facts").
- Section order is now enforced by the layout. Post bodies carry `<!-- slot:facts -->` and `<!-- slot:docs -->` markers, and `layouts/blog.njk` places the structured blocks around them in this order:
  1. Quick answer
  2. Orientation
  3. Commercial facts
  4. Market data + chart
  5. Spec/grades
  6. Documentation (checklist + post notes)
  7. Price behaviour
  8. What goes wrong
  9. Comparison
  10. Key facts, FAQ, sources, related, CTA
- Duplicated sections (prose "Documentation" next to the checklist, grade explanations repeated as the comparison) were merged in every post. New gate: no two H2s on a page may share ≥60% of their content words (`scripts/heading-overlap.js`).
- Charts: every buyer-guide already had its build-time SVG bar chart (the "text bars" report was mistaken; verified on the live page).
  - Added a `lineChart` trend component with a data-table fallback. It renders only when a trade-data file has a verified `india_world_total_by_year` series.
  - Series added from WITS for chickpeas, guar gum and dehydrated onion. Figures spot-checked against WITS.
- Share-only sources (APEDA basmati publishes % by destination, not values) render as a "Share of India's exports" column instead of an empty value column.

**Batch 4:** Alphonso mango–UK, dehydrated onion–Brazil and DORB were finished from the owner's drafts.
- Onion–Brazil got its missing price, what-goes-wrong and comparison sections.
- DORB's "table below/above" contradiction was fixed.
- DORB's DGFT citation is now labelled as the export-policy authority, since the post has no destination market.

**Batch 5:**
- **1121 vs Pusa basmati, kabuli vs desi, guar gum food vs industrial, dehydrated vs fresh onion:** migrated to the full standard.
- **Basmati data:** moved from an aggregator news site to APEDA's primary page (6.52 million MT, US$5.67bn, 2025-26).
  - Every page quoting the old figures was corrected. Iraq was corrected from #2 to #3 market.
  - The unsourced "India ≈80% of world basmati trade" claim was removed sitewide.
- **Onion ban length:** corrected to "almost five months" (Dec 2023–May 2024, per PIB) on all onion pages, including the Portuguese post.
- **Education standard:** spice market overview, verify-an-exporter and how-exporting-works have no single product, so they meet a new education tier in `check-blog-standard.js` (1600+ words, 7+ FAQs, primary sources, charts with any market table, no duplicate H2s). No post is exempt from both tiers.
- **Owner decisions (1 Oct):**
  - The Incoterms blog post was merged into `/resources/incoterms-guide/` and its URL 301s there.
  - How-exporting-works was kept and rewritten as a first-order walkthrough, distinct from `/export-process/`.

**Coordination:** 9 sequential general-purpose agents (no parallel forks), each scoped to named files. Every agent's output was verified directly rather than trusted:
- a number-diff of old source vs new page for every post;
- a compliance scan;
- a rerun of the gates;
- spot-checks of new figures against WITS/APEDA.

Issues caught this way:
- A spec-section off-by-one in the order gate. The agent reported it; the fix was confirmed against the code.
- A HACCP implication in a shrimp FAQ that an agent missed.
- "Organic-certified" phrasing that slipped past the lint. The lint now bans the hyphenated forms.
- One agent stalled after finishing its edits (work verified and committed).
- A crawler-access fixture that pointed at a heading the rewrite removed.

**Final state:** 25 English posts, all passing. `npm run check` passes all 15 gates, including the new sitemap-health gate.

| Post | Words | Tables | Chart | MOQ | Ports | Transit | Payment | Docs | FAQs | Op-detail words |
|---|---|---|---|---|---|---|---|---|---|---|
| 1121-basmati-vs-pusa-basmati-grades-length-aging | 3,989 | 5 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 9 | 290 |
| alphonso-mango-exporter-india-uk | 3,344 | 4 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 361 |
| cardamom-exporter-india-gcc | 3,094 | 4 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 293 |
| chickpeas-exporter-india-to-uae | 3,052 | 5 | ✓ (2) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 310 |
| dehydrated-onion-exporter-india-brazil | 3,561 | 5 | ✓ (2) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 347 |
| dehydrated-onion-vs-fresh-onion-mep | 4,255 | 6 | ✓ (2) | ✓ | ✓ | ✓ | ✓ | ✓ | 9 | 314 |
| dorb-export-ban-lifted-what-buyers-need-to-know | 3,318 | 5 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 257 |
| dried-red-chilli-exporter-india-to-china | 2,915 | 4 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 329 |
| fish-meal-exporter-india-vietnam | 2,984 | 4 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 278 |
| fresh-grapes-exporter-from-india-netherlands | 3,077 | 4 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 336 |
| frozen-shrimp-import-from-india-to-china | 3,468 | 4 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 9 | 360 |
| frozen-vannamei-shrimp-exporter-usa | 3,351 | 4 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 9 | 341 |
| groundnut-kernels-exporter-india-indonesia | 2,960 | 4 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 308 |
| guar-gum-exporter-india-usa | 2,928 | 5 | ✓ (2) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 283 |
| guar-gum-food-vs-industrial-grade | 4,511 | 6 | ✓ (2) | ✓ | ✓ | ✓ | ✓ | ✓ | 9 | 329 |
| how-exporting-with-green-plus-exim-works | 3,156 | 2 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | 8 | — |
| how-to-verify-an-indian-exporter-before-you-pay | 2,624 | 1 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | 10 | — |
| india-cumin-seed-exporter-china | 2,793 | 4 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 293 |
| india-spice-export-market-overview-2024 | 2,960 | 3 | ✓ (2) | ✗ | ✗ | ✗ | ✗ | ✗ | 9 | — |
| kabuli-vs-desi-chickpeas-buyer-guide | 3,539 | 6 | ✓ (2) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 257 |
| masoor-lentils-exporter-india-bangladesh | 2,950 | 4 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 9 | 276 |
| organic-cow-manure-exporter-from-india | 3,133 | 4 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 292 |
| red-onion-exporter-from-india-bangladesh | 3,151 | 4 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 303 |
| soybean-meal-exporter-from-india-germany | 3,086 | 4 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 290 |
| turmeric-exporter-india-to-uae | 3,045 | 4 | ✓ (1) | ✓ | ✓ | ✓ | ✓ | ✓ | 8 | 312 |

(Education posts have no commercial-facts table by design, hence the ✗ in those columns.)

### Still open
- Localized-post program (13 translated posts await native review; see `research/translation-review.md`).
- Packaging/loading-diagram SVG and photo shot list (`IMAGES_TODO.md`).
- 31 meta descriptions outside 70–160 characters and 12 pages with fewer than 3 in-content inbound links (see `reports/launch-checklist.md`).
- Product pages have their own duplicated-H2 pairs (e.g. guar gum "Guar gum export policy and EU documentation" vs "Export documentation"). The blog gate doesn't cover them.
