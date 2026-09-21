# Unverified / Low-Confidence Data — Phase 2 Research

Rule zero for this project: never invent a number. Anything below could not be confirmed against a primary source (DGCI&S/TradeStat, APEDA AgriExchange, MPEDA, UN Comtrade, ITC Trade Map, WITS) in this research session, either because the primary source's site could not be fetched (JS-rendered dashboards, PDF export tools, or 403-blocked pages), or because only secondary/aggregator blogs carried the figure. Do not use anything in this file as a cited fact on the live site — use it only as a lead for a follow-up session with better data access, or exclude the claim and write around it qualitatively.

## Primary-source access problems encountered
- **oec.world (OEC)** — client-side rendered (React SPA); WebFetch returns only the page shell, no data. Would need a headless browser or their public API.
- **tradestat.commerce.gov.in / DGCI&S** — not reachable as simple GET requests in the time available; likely requires form-based querying.
- **agriexchange.apeda.gov.in** — request timed out (300s) in this session; worth retrying with a longer budget or a more direct deep link.
- **mpeda.gov.in PDF export-performance reports** — downloadable but image-based/encoded; text extraction failed (no `pdftoppm`/poppler installed in this environment). The raw PDF was saved locally during this session but not parsed.
- **pib.gov.in** — returned HTTP 403 to the fetch tool.

Given these blocks, most trade-data figures in `src/_data/trade-data/` are sourced from trade-press/aggregator sites (SeAir, ExportImportData.in, TradeImeX, Volza-adjacent blogs, MPEDA data as *republished* by news outlets) rather than directly from the primary databases. Each JSON file's `notes` field says so explicitly and flags a confidence level. Treat every number on the live site as needing a periodic re-verification pass against the primary sources once better access is available (e.g., a session with a working PDF parser, or Comtrade API credentials).

## Products with no trade-data JSON written (data too weak to publish)
- **Rice bran / de-oiled rice bran (DORB), HS 2302** — search results kept returning rice bran *oil* (HS 1515) data instead of DORB/rice bran meal. One weak mention: "de-oiled bran and rice-bran oil market is worth US $200 million" (source unclear, no country breakdown, no year). Not enough to write a JSON file. Needs a dedicated follow-up search focused on animal-feed trade classifications (HS 2302), not the edible-oil side of rice bran.
- **Groundnut cake, mustard/rapeseed meal, cottonseed cake, maize DDGS, fish meal, cattle & poultry feed** — not researched in this session; time was prioritized on the 10 products named in the master brief's priority list. All are still on the "to research" list before their product/blog pages go live.
- **Most spices (turmeric, red chilli, cumin, coriander, black pepper, cardamom)** — not researched this session beyond a general policy scan; no country-level trade data pulled yet.
- **Most vegetables besides onion** (potato, garlic, green chilli, drumstick, okra, tomato, ginger) — not researched.
- **Pulses** (chickpeas, toor dal, moong, urad, masoor) — not researched.
- **Millets, maize, wheat as commodities** (beyond the DGFT policy check) — no country-level export data pulled.
- **Makhana, jaggery, dehydrated onion/garlic powder, guar gum, psyllium husk** — not researched.
- **Mango, papaya, watermelon, lemon/lime, coconut** — not researched beyond being on the master product list.

None of the above should get a product page with country-specific trade claims until they have a real `trade-data/*.json` file. Product pages can still be built with specs/HS-code/process content — just without a fabricated "top importers" table.

## Specific low-confidence figures already captured (see each JSON's `notes` for full caveats)
- **Organic manure (HS 3101)** — Italy/France/USA figures are from a private aggregator (SeAir), not confirmed against APEDA/DGCI&S. This is the flagship "Organic Cow Manure Exporter from India" cluster from the brief's seed titles — worth a dedicated re-verification pass given its priority.
- **Red onion** — the aggregate export total (~1,147,721.91 MT / ~USD 453.95M) blends what look like two different fiscal years in the source; per-country values (Bangladesh/Malaysia/UAE) have no stated year.
- **Sesame seeds** — export volume reported as a very wide, inconsistent range (208,000–330,000 MT); country values are framed by product end-use ("for desserts", "for supplements") rather than as a clean customs breakdown.
- **Soybean meal** — top-5 destination list (Germany, France, Nepal, Bangladesh, Kenya) has no individual value or volume, only "~55% combined share."
- **Frozen shrimp** — solid MT-by-country breakdown (MPEDA/PIB via secondary republication), but no USD value by country, only the aggregate total.

## DGFT export-policy findings (checked 2026-09-17, via WebSearch — verify against dgft.gov.in directly before relying on this for launch)
- **Non-basmati WHITE rice** (semi-milled/wholly milled, ITC-HS 1006 30 90 broadly, excludes parboiled and basmati) — **Prohibited** since July 2023; still prohibited as of the most recent notification found (10 April 2026, which only addressed EU/UK inspection-certificate requirements, not the ban itself). **Do not build a sales page for plain non-basmati white rice.**
- **Parboiled rice** (ITC-HS 1006 30 10) — **Free**, but with a 20% export duty (effective since 1 May 2025 per one source). Can build a page; must note the duty is a live, changeable cost input, not quote a fixed landed price.
- **Basmati rice** (1121, Pusa, and basmati generally) — **Free**. No current restriction found.
- **Wheat** (HS 1001) — was **Prohibited** for most of 2026 (with periodic limited relaxation quotas, e.g. 25 LMT in April 2026), then reportedly shifted to **Free** as of a 24 August 2026 DGFT notification (cited by taxguru.in / econiti.org). This is very recent and wheat policy has been highly volatile in 2026 — **treat this as provisional** and re-confirm at dgft.gov.in before building a wheat product page or quoting wheat prices.
- **Onion** (HS 0703 10) — **Free**, but subject to a Minimum Export Price (~US$550/MT as of August 2026) and reportedly a 20% export duty (one source says the duty was removed 1 April 2025 — conflicting with the "20% duty as of August 2026" figure from another source; this needs a direct DGFT check, not a search-engine summary). Historically banned outright for ~6 months in 2023-24. Build the page, but the pricing/documentation section must say MEP and duty terms are confirmed at time of order.
- **Organic manure / bio-fertilizers / vermicompost** (HS 3101) — no restriction found; treated as **Free**. (Note: this is distinct from subsidized chemical fertilizers like urea/DAP, which are separately controlled — not relevant to this product list.)
- **Sesame, groundnut** — no restriction found in the time available; treated as **Free**, but not exhaustively checked against the DGFT Schedule 2 PDF (content.dgft.gov.in/Website/dgftprod/.../Export%20Policy.pdf) — worth a direct check before launch since that PDF is the actual authoritative document and wasn't successfully parsed this session (same poppler/pdftoppm limitation as the MPEDA PDF).
- **Everything else in the product list** (fruits other than banana/grapes/pomegranate, vegetables other than onion, all pulses, all spices, seafood other than shrimp, most feed and fertilizer items, oilseeds/others) — **not checked against DGFT this session**. Default assumption of "Free" is reasonable for ordinary agri-commodities but must be confirmed per-product before publishing, especially before any future domestic price spike changes the political calculus (as happened repeatedly with onion/rice/wheat).

## Recommendation
Before Phases 4–6 (product pages, country pages, 110+ blog posts) go further than what's already built, a follow-up research session with (a) a working PDF text extractor (poppler/pdftoppm) and (b) more time budget for agriexchange.apeda.gov.in and DGCI&S TradeStat should re-verify the flagship organic-manure, frozen-shrimp-value, and soybean-meal-value gaps, and extend coverage to spices, pulses, and the remaining feed/fertilizer products before those get country-specific blog claims.

---

# Phase 2b — Second Research Pass (2026-09-17)

## METHODOLOGY BREAKTHROUGH — read this first before any future research session

**WITS (World Bank) IS fetchable and returns full per-country trade data.** Phase 2a concluded that primary sources were unreachable and fell back to aggregator blogs. That conclusion was too pessimistic — WITS, which mirrors UN Comtrade, works fine via a plain URL fetch and returns both USD values AND quantities by partner country.

URL pattern:
```
https://wits.worldbank.org/trade/comtrade/en/country/IND/year/<YEAR>/tradeflow/Exports/partner/ALL/product/<HS6>
```
Example: `.../product/091030` returns India's 2024 turmeric exports by partner.

**Critical gotcha:** WITS uses the **legacy HS1992 (H0) nomenclature**, not current HS2017/HS2022 codes. Newer subdivided codes return "We are unable to process your request." Map back to the legacy parent code:

| Product | Current HS | Use in WITS |
|---|---|---|
| Cumin | 0909.31 | `090930` |
| Coriander | 0909.21 | `090920` |
| Dried chilli | 0904.21 / 0904.22 | `090420` |
| Cardamom | 0908.31 | `090830` |
| Ginger | 0910.11 | `091010` |
| Groundnuts, shelled | 1202.42 | `120220` |
| Squid/cuttlefish, frozen | 0307.43 | `030749` |

This single fix is why this pass produced 20 datasets against Phase 2a's 9, at a much better source tier. **Do not repeat the "primary sources are unreachable" conclusion without trying WITS first.**

Still unreachable this session (unchanged from 2a): oec.world (JS-rendered), tradestat.commerce.gov.in, agriexchange.apeda.gov.in (timeout), mpeda.gov.in PDFs, pib.gov.in (403). PDF tooling is still absent — `pdftotext`/`pdftoppm` not installed, and `python3` is broken by the same missing-Xcode-CLT problem that disabled git, so no Python PDF library route either.

## Products that now have verified primary-tier data (20 new files)
turmeric, red chilli, cumin, black pepper, coriander, cardamom, chickpeas, lentils/masoor, guar gum, groundnut kernels, psyllium (caveated), maize, fish meal, squid/cuttlefish (caveated), ginger, garlic, mango, dehydrated onion, rice bran/DORB (ban-context), other oilcake/neem cake (caveated).

All are WITS/UN Comtrade calendar-2024, retrieved 2026-09-17, with per-country USD values and Kg quantities. Each file's `notes` field carries its own confidence caveat.

## Caveated files — do NOT present these totals as product-specific
- **psyllium-husk-121190** — HS 1211.90 is a broad "plants used in pharmacy/perfumery" basket. The USD 535M total is NOT psyllium alone. Use for market identification only; a psyllium-specific figure needs India's 8-digit ITC-HS line (1211 90 3x), not accessible this session.
- **other-oilcake-230690** — residual "other oilcake" basket covering neem cake, minor oilcakes AND part of the DORB stream. USD 65.6M is not neem cake alone.
- **squid-cuttlefish-030743** — USD 11.67M under legacy 0307.49 looks low vs India's known cephalopod trade; volume likely split across other 0307 subheadings. Country ranking is sound, the total is not.
- **rice-bran-dorb-230240** — calendar-2024 sits entirely inside the export-ban window (see below). The tiny total reflects a legal prohibition, not demand. Do not cite 2024 DORB volumes as market indicative.
- **mango-080450** — HS code covers guavas and mangosteens too, so it slightly overstates mango alone.

## Still NO trade data (do not publish country-specific numbers for these)
Groundnut cake (2305), mustard/rapeseed meal (2306.49), cottonseed cake (2306.10), maize DDGS (2303.30), cattle & poultry feed (2309.90), toor dal (0713.60), moong/urad (0713.31), potato, tomato, okra, drumstick, green chilli fresh, papaya, watermelon, lemon/lime, coconut, millets/jowar/bajra/ragi, makhana, jaggery, dried garlic (0712.90), vermicompost/bone meal/poultry manure/seaweed fertilizer individually (only the aggregate HS 3101 from Phase 2a exists), ribbonfish, Indian mackerel, pomfret, sardines.

These can still get product pages with specs/HS/process content — just no "top importers" table.

## New DGFT export-policy findings (checked 2026-09-17)
- **De-Oiled Rice Bran (DORB) — BAN LIFTED, now FREE.** DGFT Notification No. **37/2025-26 dated 3 October 2025** changed DORB from 'Prohibited' to 'Free' with immediate effect, deleting the prior "prohibited till 30th September 2025" entry. Covers ITC-HS **2302 40 00, 2306 90 19, 2306 90 29, 2306 90 90**. The ban had run since July 2023 to control domestic cattle-feed prices; the Solvent Extractors' Association welcomed the lift. **This unblocks the entire DORB/animal-feed page and blog cluster** — and is a genuinely timely content angle.
- **Sugar — PROHIBITED till 30 September 2026.** Export policy moved from 'Restricted' to 'Prohibited' covering ITC-HS 1701 14 90 and 1701 99 90 (raw, white and refined sugar). Exemptions: EU CXL and US TRQ quotas, Advance Authorisation Scheme, G2G shipments, and consignments already in the export pipeline. **Note the date — this prohibition expires 30 Sep 2026, i.e. within two weeks of this research date, so its status must be re-checked before publishing anything about sugar.**
- **Jaggery / gur — AMBIGUOUS, NOT RESOLVED.** The sugar prohibition names 1701 14 90 and 1701 99 90. Jaggery/khandsari sits at 1701 13 20 / 1701 14 20, which is *not* in the named list, suggesting jaggery falls outside the ban. **But this was not confirmed by a primary DGFT source and the codes are adjacent enough to be risky.** Do NOT state that jaggery is freely exportable until someone confirms directly with DGFT or a customs broker. Treat as blocked pending verification.
- **Pulses — appear FREE for export.** No prohibition found for chickpea, lentil, tur, urad or moong. Corroborated empirically by the WITS data itself: India recorded USD 283M of chickpea and USD 149M of lentil exports in calendar 2024, which could not have happened under a prohibition. (Separately, India's *import* policy kept duty-free windows for tur/urad to 31 March 2026 — that is an import matter, not an export restriction.)

## HS codes corrected in src/_data/hsCodes.json (8 rows)
Two were genuine errors:
- **Rapeseed / Mustard Meal: 2306.30 → 2306.49** (2306.41 if low-erucic). Confirmed via WITS, which labels 230630 "Oil-cake and other solid residues of sunflower" — the original code was sunflower, not rapeseed.
- **Neem Cake: 2306.50 → 2306.90.** 2306.50 is coconut/copra oilcake. DGFT Notification 37/2025-26 confirms 2306 90 is the "other oilcake" bucket.

Six were refinements/flags: Red Chilli → `0904.21 / 0904.22`; Rice Bran/DORB → `2302.20 (DORB also 2306.90)`; Millets → `1008.29 (jowar/sorghum 1007.90)`; Jaggery → `1701.13 / 1701.14`; Dehydrated Onion & Garlic → `0712.20 (garlic 0712.90)`; Makhana → `1404.90 (verify)`.

**Makhana remains genuinely unresolved.** The original `1904.20` was wrong (that heading is prepared cereal-flake foods). `1404.90` is a plausible residual vegetable-products heading but was NOT confirmed against DGFT's ITC-HS schedule — it is marked `(verify)` in the data file and must be checked with a customs broker before any makhana page quotes a code.

## Strategic findings worth acting on
1. **Indonesian and Vietnamese now have real anchor products.** Phase 2a flagged id/vi as having no verified market. Groundnut kernels fixes that decisively: Indonesia USD 295M (#1) and Vietnam USD 125M (#2) of a USD 823M line. Fish meal adds Vietnam (#2, USD 40M) and red chilli adds Indonesia (#6, USD 74M).
2. **Portuguese and Spanish now have an anchor too** — dehydrated onion, where Brazil is #2 (USD 25M) and Spain is #9. Previously both were placeholder-only languages.
3. **French is stronger than it looked, via Morocco rather than France.** Morocco is a repeat top-market: turmeric #5, cumin #6, ginger #2. Worth targeting Moroccan buyers explicitly in French content, not just France.
4. **Arabic is the single strongest language case.** Cardamom is ~61% GCC by value (UAE + Saudi alone), and UAE is #1 or top-3 for turmeric, cumin, chickpeas and mango.
5. **China is the largest single market for India's two biggest spice lines** (red chilli USD 456M, cumin USD 141M) plus fish meal (USD 93M) — **but the site has no Chinese (zh) track.** The folder structure supports es/pt/fr/de/nl/ar/id/vi/ms only. Recommend the owner consider adding `zh`; flagged in keyword-matrix rows as "zh not in folder set".
6. **Drop fresh garlic as a content priority.** India exported only USD 6.6M of fresh garlic in 2024 (China dominates world trade). Dehydrated onion, at USD 221M, is ~33x larger and has no MEP complication — route that effort there instead.
7. **Dehydrated onion dodges the fresh-onion MEP problem.** Fresh onion (0703.10) carries a Minimum Export Price and duty volatility; dried onion (0712.20) does not, and sells into developed-market food processors across ~120 countries. Strong, low-friction product line.

---

# Phase 2 (new brief) — Block B DGFT verification pass (2026-09-18)

19 new product pages were built this pass, each gated on a real DGFT export-policy check before publishing (per the standing rule: no page states a policy status that couldn't be verified). Full method: DGFT's own Schedule 2 Export Policy tables via eximguru.com's chapter-by-chapter mirror (`eximguru.com/exim/dgft/itc-hs-export-schedule-2/table-b-chapter-<N>-...aspx`), cross-checked against current (2025-26) trade-press reporting where the schedule text looked stale. The DGFT PDF itself (`content.dgft.gov.in/.../Export%20Policy.pdf`) remains unparseable in this environment (still no poppler/pdftotext, still no working python3 — same Xcode-CLT gap noted in Phase 2a/2b) — the eximguru mirror is a secondary source, not the primary document, and should be spot-checked against the real PDF once this machine has a PDF text extractor.

**Confirmed Free (published):** turmeric, red chilli, cumin, coriander, black pepper, cardamom (all of DGFT Schedule 2 Chapter 9 — spices have no restricted/prohibited entries at all in the schedule); chickpeas, masoor lentils (see pulses finding below); groundnut kernels, guar gum (both with standard destination-market documentation conditions — EU/Russia certification for groundnut, SHEFEXIL PCP testing for EU-bound guar gum, neither is a Green Plus EXIM certification claim); dehydrated onion & garlic powder (0712.20 — distinct from fresh onion's MEP-volatile 0703.10); fish meal; garlic (0703.20 — small volume, ~USD 6.6M, kept modest per the Phase 2b recommendation); mango (0804.50 — built without any US-market irradiation-facility claim, per the compliance discipline already established); squid & cuttlefish (0307.43 — flagged as a likely undercount, per its trade-data notes); psyllium husk (1211.90 — flagged as a broad basket, not psyllium-specific, per its trade-data notes); dried ginger (0910.11xx dried/powder forms only).

**Pulses ban-lift, resolved:** eximguru's chapter-7 table initially returned "Prohibited" for chickpeas (0713.20), masoor (0713.40), moong (0713.31) and toor dal (0713.90.10) — but that table is stale. A 2017 Business Standard article confirms DGFT lifted the general pulses export ban in September 2017 "till further orders," and Phase 2b's own WITS 2024 data already showed real chickpea (USD 283M) and lentil (USD 149M) export flows that could not exist under an active prohibition. Chickpeas and masoor pages were built on this basis, with the 2017 ban-lift history included as page content (a genuine, citable fact, not a live risk). **Toor dal, moong and urad were NOT built** — the 2017 policy history applies to them too, but there is still no per-country trade-data file for any of the three (same gap Phase 2b already flagged), so per the "no data, no page" rule they remain unpublished.

**Maize, resolved with an onion-style caution, not a flat "Free":** eximguru's chapter-10 table showed HS 1005.90.00 ("Other," i.e. non-seed maize) as flatly **Prohibited**, which directly contradicted real, current USDA FAS reporting that India shipped 996,000 tonnes of maize in the first five months of MY2025-26 (three times the prior year) with a 2.4 million tonne full-year estimate, overwhelmingly to Nepal/Bhutan/Bangladesh/Sri Lanka/Vietnam. The eximguru snapshot is evidently outdated. The maize product page was built treating export as currently active and growing, but frames the government's ethanol-blending programme as a real, ongoing constraint on exportable surplus and states export terms are confirmed at time of order — deliberately not asserting a permanent, settled "Free" status, mirroring how the existing onion page handles genuine policy volatility. **This determination should be re-verified against the actual DGFT PDF once this environment has a working PDF parser** — it rests on a real contradiction between two secondary sources (a stale schedule table vs. current USDA trade reporting), not a primary-source confirmation.

**Rice bran / DORB — two distinct codes, do not conflate:** eximguru's chapter-23 table confirmed raw/boiled rice bran (2302.20.20/2302.20.90) is **Restricted — export permitted under licence**, a separate finding from (and consistent with) Phase 2b's already-verified DORB ban-lift (2306.90 / 2302.40 series, Free since DGFT Notification 37/2025-26, 3 Oct 2025). The new DORB product page states both facts explicitly and distinguishes the two HS codes so a buyer researching "rice bran" doesn't assume the licensed-only raw form is freely exportable.

**Confirmed Restricted/no-data — still not published:** groundnut cake / deoiled groundnut cake (HS 2305 — eximguru chapter 23 confirms "Restricted — exports permitted under licence," and there is still no per-country trade-data file, so this was never a candidate for publishing this pass either way); mustard/rapeseed meal and cottonseed cake (2306.10/2306.49 — no trade data, policy not separately checked this pass); maize DDGS, cattle & poultry feed (no trade data); fresh ginger specifically, i.e. HS 09101010 (Restricted — the published ginger page is explicitly framed as *dried* ginger, 0910.10.20-40, which is Free, with the fresh-form restriction stated as the reason).

**Still genuinely unpublished, unchanged from Phase 2b:** toor dal, moong, urad (policy understood, no trade data), millets/jowar/bajra/ragi, makhana (HS still unconfirmed), jaggery (still ambiguous — do not publish), potato, tomato, okra, drumstick, green chilli fresh, papaya, watermelon, lemon/lime, coconut, individual fertilizer sub-types beyond organic cow manure (bone meal is a genuinely different HS code, 0506.90, with no trade data — vermicompost/poultry manure/bio-fertilizer/seaweed fertilizer/compost share HS 3101 with cow manure but were not built as separate pages this pass, since a nearly-identical trade-data table across 5+ near-duplicate pages would itself risk the uniqueness gate — worth building later with genuinely distinct sourcing/process content per sub-type, not just a swapped product name).
