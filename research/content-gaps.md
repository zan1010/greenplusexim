# Content gaps — what importers search that we have no page for

Prepared 1 Oct 2026 for owner approval. **Nothing here is written yet.** Proposed keyword-map rows for all 20 posts are in `research/keyword-map-proposed.csv`. They move into `keyword-map.csv` only when a post is approved and published, because `check-keywords.mjs` requires that map to match the sitemap exactly.

## How the list was built

1. **Demand.** Each candidate is ranked by India's export value for its product (trade-data files: WITS/UN Comtrade, APEDA, MPEDA). Search-volume columns stay blank until you paste Keyword Planner / Bing data and run `npm run reprioritize`.
2. **Ownership.** Each query family is mapped to the intent-ownership table. A gap is a family that no indexable URL owns today. Every proposed primary keyword was checked against all 135 primaries in `keyword-map.csv`; no duplicates.
3. **Data before writing.** Each post lists the primary sources it needs. If those can't be opened and verified at writing time, the post is re-scoped, not hedged.

## Coverage today, by query family

| Query family | Owned today by | Gap |
|---|---|---|
| `[product] exporter/supplier/price india` | 28 product pages | none |
| `import [product] from india to [country]` | 17 blog posts + 14 product × country pages | Thin for high-demand lanes without a guide (e.g. psyllium) |
| `[country] import regulations` | 22 country + 8 region pages | none |
| `what is / [grade] vs [grade]` | 4 spec posts (1121/Pusa, kabuli/desi, guar grades, dehydrated/fresh) | chilli varieties, groundnut grades |
| **Process: how to import [product] from India** | only generic `/resources/import-guide-from-india/` | **no product-level guides** |
| **Cost: price trend, landed cost** | none (`[product] price india` is product-page owned, but pages give no trend) | **all** |
| **Classification: HS code + destination duty** | `/resources/hs-code-finder/` (codes only, no duties) | **duty side** |
| **Threshold: MOQ, trial container** | `/sample-policy/` (samples only) | MOQ / first-container sizing |
| **Risk: LC vs TT, inspection** | `/payment-terms/`, `/quality-compliance/` (company pages, not decision guides) | buyer decision guides |
| **Comparison: India vs [origin]** | origin tables inside buyer guides only | stand-alone origin comparisons |
| **List: "best [product] exporters in india"** | generic verify-an-exporter post | product-specific evaluation checklists |

## The 20 proposed posts, in priority order

The rank is the product's India export value (2024, or 2025-26 for basmati). Generic posts are placed by the largest product they serve.

| # | Proposed post (working title) | Primary keyword | Intent family | Demand basis | Primary sources needed | Cannibalization check |
|---|---|---|---|---|---|---|
| 1 | How to Import Basmati Rice from India: Contract to Port | how to import basmati rice from india | Process | Basmati US$5.67bn (APEDA 2025-26), #1 | APEDA RCAC trade notice; SFDA / MOCCAE / FDA import pages | Generic import guide owns "how to import from india"; 1121 post owns grades. Link both, no overlap. |
| 2 | India vs Pakistan Basmati: Which Origin for Your Market? | india vs pakistan basmati rice | Comparison | #1 | APEDA; Pakistan TDAP/PBS export data; EU GI register | New family. Must be balanced: Pakistan wins on some traditional/Super Kernel demand. |
| 3 | HS Code for Basmati Rice and Import Duty by Market | hs code for basmati rice | Classification | #1 | ITC-HS 1006 30; GCC common tariff; US HTS 1006.30; UK Global Tariff | HS finder owns the generic code lookup; this owns basmati + duty. |
| 4 | Indian Red Chilli Price Trend: Guntur Arrivals and Drivers | red chilli price trend india | Cost | Red chilli US$1.30bn, #2 | Agmarknet (Guntur APMC arrivals/prices); Spices Board monthly prices | Product page owns "price india" (spot); this owns "trend" (history + drivers). |
| 5 | How to Import Frozen Shrimp from India: Plant to Port | how to import frozen shrimp from india | Process | Shrimp US$5.18bn (MPEDA FY2024-25, cited in shrimp posts) | MPEDA; EIC-approved establishment lists; FDA/GACC pages | USA and China posts own country queries; this is the multi-market process. |
| 6 | India vs Ecuador Shrimp: What US and China Buyers Trade Off | india vs ecuador shrimp | Comparison | Shrimp | NOAA Fisheries US import data by country; MPEDA; Ecuador CNA/BCE export data | New. Balanced: Ecuador wins on head-on large counts to China. |
| 7 | Teja vs Guntur S4 Chilli: Heat, Colour and End Use | teja vs s4 chilli | Grade vs grade | Red chilli #2 | Spices Board grade specs; Agmarknet variety-wise prices | Chilli–China post mentions varieties briefly; this is the deep-dive and the guide links to it. |
| 8 | Indian Soybean Meal Price Trend: Crush Season and SOPA Data | indian soybean meal price trend | Cost | Soybean meal US$1.12bn, #3 | SOPA monthly export volumes and DOC prices | Product page owns "price india". |
| 9 | How to Import Groundnut Kernels from India: Aflatoxin to Port | how to import groundnut from india | Process | Groundnut US$823m, #4 | APEDA groundnut export procedure / Peanut.Net traceability; EU 2023/915 aflatoxin limits; BPOM | Indonesia post owns the country query. |
| 10 | Bold vs Java Groundnut: Counts, Uses and Prices | bold vs java groundnut | Grade vs grade | Groundnut #4 | APEDA / IOPEPC grade notes; Agmarknet | New. |
| 11 | Indian Cumin Price Trend: Unjha Arrivals, Crop Size, NCDEX | cumin price trend india | Cost | Cumin US$785m, #5 | Agmarknet (Unjha APMC); NCDEX jeera contract data | Product page owns "price india". |
| 12 | How to Import Psyllium Husk from India: Purity Grades and Rules | import psyllium husk from india | Process / commercial | Psyllium US$535m, #7, **no blog guide today** | WITS; FDA/EU rules for psyllium as food/supplement; APEDA | Product × country USA page owns "exporter india to usa"; this is multi-market. |
| 13 | Landed Cost from India: A Worked 20ft Example | landed cost import from india | Cost | Generic; serves every product | Site container loads; a public freight index (Drewry WCI / Freightos FBX); one destination's published duty rate | Uses only sourced layers, labelled indicative. If no freight index is citable when writing, it's re-scoped to a cost template without dollar figures. |
| 14 | LC vs TT for Your First Order from an Indian Exporter | lc vs tt first order from india | Risk | Generic | ICC UCP 600; RBI export-receipt rules | `/payment-terms/` owns "payment terms indian exporters" (what we accept); this is the buyer's decision guide. |
| 15 | How to Evaluate Basmati Rice Exporters in India: Buyer's Checklist | how to evaluate basmati rice exporters in india | List (honest answer to "best … exporters") | Basmati #1 | APEDA RCAC register; DGFT IEC; GI rules | Verify-an-exporter post is generic; this adds basmati-specific checks. No self-ranking. |
| 16 | How to Evaluate Spice Exporters in India: Buyer's Checklist | how to evaluate spice exporters in india | List | Chilli + cumin + turmeric | Spices Board exporter registration (CRES); DGFT; APEDA | Same split as #15. |
| 17 | HS Codes for Indian Spices and Import Duties in Top Markets | hs codes for indian spices | Classification | Spices combined | ITC-HS chapter 09; destination tariffs (CN, US, AE, BD) | HS finder owns the generic lookup. |
| 18 | India Onion Export Policy Since 2019: MEP, Duty and Bans | india onion export policy | Policy | Red onion US$643m, #6 | DGFT notifications; PIB releases | **Risk:** dehydrated-vs-fresh post covers recent controls. This post owns the full timeline, and that post's section shrinks to a summary + link. |
| 19 | Third-Party Inspection Before Shipment from India: How to Book It | third party inspection before shipment india | Risk | Generic | SGS / BV / Intertek service pages; ISO/IEC 17020 | `/quality-compliance/` owns "pre-shipment inspection india" (our process); this is the buyer's how-to. |
| 20 | Trial Container from India: MOQ, Samples and First-Order Size | minimum order quantity import from india | Threshold | Generic | Site MOQ and loads | **Risk:** the first-order walkthrough covers timeline; this covers sizing only. Re-scope or merge if the uniqueness gate flags them. |

## Not proposed yet, and why

- **Banana, pomegranate, sesame.** Their trade-data files still cite aggregator or trade-press sources (`source_name` in each JSON). Pull primary WITS/APEDA data first; any post now would carry unsourced numbers.
- **Per-product "how to import" for every product.** After #1, #5, #9 and #12, more of these would start repeating each other and trip the uniqueness gate. Add them product by product if Search Console shows demand.
- **"Best [product] exporters in India" as a ranking.** We can't credibly rank ourselves against competitors. #15/#16 answer the same query honestly.

## What I need from you

Approve, strike or reorder the 20. Once approved, each post is written to the same standard as the current posts: buyer-guide or education tier, insight sections, term coverage, takeaways and all gates. Writing runs 5 posts per batch, sequentially.
