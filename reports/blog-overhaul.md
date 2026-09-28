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

**Full gate suite after Batch 1:** all 11 checks pass — HTML validation, forms, compliance (0 violations across 201 files, including the "organic" vs "certified organic" wording check on the manure post), orphans, broken links, blog quality, blog content standard (5/5 migrated posts), mobile/RTL, crawler access, SEO integrity, uniqueness (117 pages, 0 failures).

---

## Batch 2–5 and beyond

Not started. Per the brief's priority order: Batch 2 (cardamom-GCC, turmeric-UAE, cumin-China, dried-red-chilli-China, grapes-Netherlands), Batch 3 (red-onion-Bangladesh, chickpeas-UAE, masoor-lentils-Bangladesh, groundnut-Indonesia, fish-meal-Vietnam), Batch 4 (Alphonso mango-UK, dehydrated-onion-Brazil, DORB ban-lift, spice-market-overview-2024), Batch 5 (1121-basmati grades, kabuli-vs-desi chickpeas, guar gum food-vs-industrial, dehydrated-vs-fresh onion, Incoterms guide, verify-an-exporter, how-exporting-works). The 1121 post's known rice-news-blog citation for APEDA data (flagged in the original brief) has not yet been addressed — scheduled for Batch 5.

Special-handling items (data-study flagship post, `how-exporting-with-green-plus-exim-works` vs `/export-process/` consolidation, Incoterms cannibalization check) also not yet started — the cannibalization gate (`check-seo-integrity.mjs`) currently reports 0 conflicts, but it only checks the `primary_keyword` field, not full topical overlap, so the Incoterms pair still needs a manual read-through in Batch 5.

Localized-post program (§4 of the brief) not started.
