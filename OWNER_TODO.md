# Owner To-Do

Items only you (Green Plus EXIM) can complete — mostly account access, real documents and real photography.

## Do this today — numbered setup checklist

Work through these in order. Each has the exact menu path as of September 2026; menus move occasionally, so if a path is stale, search the setting name in the tool's own search box.

1. **Google Search Console** — [search.google.com/search-console](https://search.google.com/search-console)
   - Add property → **Domain** property (not URL-prefix) → enter `greenplusexim.com` → verify via the DNS TXT record your registrar gives you (works for both www and non-www automatically).
   - Once verified: **Sitemaps** (left nav) → submit `https://www.greenplusexim.com/sitemap-index.xml` — this one file references all 5 sub-sitemaps, submitting it is enough.
   - Set your preferred contact email under **Settings → Users and permissions**.
2. **Bing Webmaster Tools** — [bing.com/webmasters](https://www.bing.com/webmasters)
   - Sign in → **Import from Google Search Console** (one-click, pulls verification and sitemap automatically once GSC is set up in step 1).
   - Confirm the sitemap shows as submitted under **Sitemaps**.
   - Copy the verification meta-tag content value into `src/_data/site.json` → `analytics.bingVerification` if the import doesn't auto-verify (fallback: DNS or meta-tag method, both shown on the Bing verification page).
3. **IndexNow key** — [bing.com/indexnow](https://www.bing.com/indexnow)
   - Generate a key (it's just a random string Bing gives you).
   - Add it to `src/_data/site.json` → `analytics.indexNowKey`. The next build automatically creates the required `/<key>.txt` verification file at the site root — nothing else to do.
   - Ask your developer to confirm `npm run indexnow-submit` runs without `--dry-run` after this (it self-detects the real key and switches out of forced dry-run mode).
4. **GA4** — [analytics.google.com](https://analytics.google.com)
   - Admin → Create Property → name it "Green Plus EXIM" → Web data stream → enter `https://www.greenplusexim.com`.
   - Copy the Measurement ID (starts `G-`) into `src/_data/site.json` → `analytics.ga4MeasurementId`.
   - Under **Admin → Events → Create event** or via **Conversions**, mark `generate_lead` as a conversion once it starts firing (it will, automatically, from `/thank-you/` — no extra code needed).
5. **Microsoft Clarity** — [clarity.microsoft.com](https://clarity.microsoft.com)
   - New project → connect the same GA4 property if offered (optional but useful) → copy the Project ID into `src/_data/site.json` → `analytics.clarityProjectId`.
6. **Netlify Forms** — your Netlify site dashboard → **Site configuration → Forms**
   - Confirm "Form detection" is enabled (it should auto-detect on first deploy since every form already has `data-netlify="true"`).
   - **Form notifications** → add an email notification for each of the 5 forms (`export-inquiry`, `quick-quote`, `catalogue-request`, `checklist-request`, `price-alert`, `sample-request`, `supplier-partnership`, `contact` — Netlify lets you set one notification rule per form name) to whoever should see leads first.
   - **Spam filtering** → enable Akismet-based filtering (free, built into Netlify Forms) in addition to the honeypot already built into every form.
   - Check your plan's monthly form-submission cap under **Billing** and confirm it covers expected RFQ volume — upgrade if the free tier's limit is a real risk.
7. **Google Business Profile** — [business.google.com](https://business.google.com)
   - Add/claim a listing for the Mumbai office. Use the exact name, address and phone from `src/_data/site.json` (`companyName`, `address`, `phoneDisplay`) — consistency here matters for how AI assistants and Google both treat your business as a single verified entity (see `docs/aeo-tracking.md` once Block E lands).
   - Category: "Export company" or closest match; add the website URL and hours.
8. **Git / version control** — this machine's Xcode Command Line Tools are missing so `git` is currently non-functional here. Run `xcode-select --install` in Terminal, complete the popup installer, then ask your developer to initialize the repo and push it to GitHub/GitLab and connect that to Netlify (Netlify can auto-deploy on every push once connected).

## First 30 days — measurement plan

Once steps 1–5 above are live, check these weekly (a recurring 15-minute calendar block works well):

- **GSC → Pages → Indexing report**: track the count of indexed pages weekly. It should climb toward the ~101 indexable pages currently built as Google crawls the sitemap; a stall usually means a crawl-budget or quality signal issue worth investigating.
- **GSC → Performance → search results**: impressions and clicks by page, filtered by query. In week 1–2 expect near-zero — a brand-new domain has no ranking history. By week 4, watch for impressions starting on long-tail product/country queries.
- **GSC → Performance, filter by country**: which countries are generating impressions at all — a first, rough read on whether the country pages are being discovered by the buyers they're written for.
- **Netlify → Forms → Submissions**: count by form name and, once you're checking individual submissions, by `source_page` (a hidden field on every submission) — this tells you which pages are actually generating leads, which matters more than raw traffic.
- **GA4 → Reports → Engagement → Events**: watch `generate_lead`, `whatsapp_click`, `quote_cta_click` counts climb from zero.
- Run `npm run seo-audit` monthly and diff `reports/seo-audit.md` against the previous month — new orphans, thin pages or duplicate titles are easy to catch early this way.

## Content review needed before any non-English page goes live
- [ ] **Native-speaker review of 13 localized blog posts** — 7 Arabic, 2 Indonesian, 2 Vietnamese, 1 Malay, 1 Portuguese. Every one currently ships `reviewed: false` + `noindex: true`, so none of them are indexable yet. Full list and review checklist: `research/translation-review.md`.
- [ ] **RFQ/quick-quote form labels on localized pages are still in English.** The article content is natively written in each target language, but the embedded lead form's field labels ("Full name", "Company name", etc.) were not translated in this pass — this is a real gap against the build spec's "translate labels, placeholders and options" requirement. Needs an i18n label dictionary wired into `partials/rfq-form.njk` and `partials/quick-quote-form.njk` before these pages should be considered fully localized. Not blocking for now since the pages are noindex pending review anyway.

## Urgent — before launch
- [ ] **IEC number** — add the real Import Export Code to `src/_data/site.json` → `registrations.iecNumber`.
- [ ] **APEDA RCMC number** — add the real registration number to `src/_data/site.json` → `registrations.apedaRcmcNumber`.
- [ ] **Registered office address** — `src/_data/site.json` → `address.streetAddress` and `postalCode` are placeholders.
- [ ] **GA4 Measurement ID** — `src/_data/site.json` → `analytics.ga4MeasurementId`.
- [ ] **Microsoft Clarity project ID** — `analytics.clarityProjectId`.
- [ ] **Google Search Console verification** — `analytics.gscVerification` (the `<meta>` content value, or switch to DNS verification).
- [ ] **Bing Webmaster verification** — `analytics.bingVerification`.
- [ ] **IndexNow key** — generate a key at bing.com/indexnow, add it to `analytics.indexNowKey`, and create `/<key>.txt` at the site root serving the key as its only content.
- [ ] **Enable Netlify Forms** — Site configuration → Forms → confirm detection is on (the built HTML already has the required `data-netlify="true"` markers and matching `form-name` hidden fields for all 5 forms: `export-inquiry`, `quick-quote`, `sample-request`, `supplier-partnership`, `contact`).
- [ ] **Netlify form email notifications** — set up per-form notification emails (Site configuration → Forms → Form notifications) so leads reach the right inbox.
- [ ] **Check your Netlify plan's form-submission limit** — the free tier caps monthly submissions; confirm this covers expected RFQ volume.
- [ ] **Git / version control** — this machine's Xcode Command Line Tools are missing so `git` is currently non-functional here. Run `xcode-select --install`, then ask for the repo to be initialized and pushed to GitHub/GitLab and connected to Netlify.

## Real photography needed (see IMAGES_TODO.md for the live, auto-generated list)
- [ ] Real photo of Mr. Jamil Khan for `/about/` and `/authors/jamil-khan/`.
- [ ] Real photos of your warehouse, packing line, grading/sorting, and loading operations.
- [ ] Real photos of actual shipments/containers if available (avoid implying certifications via imagery — no certificate logos, no "Certified Organic" stickers, etc.).
- [ ] A company logo file (`src/assets/img/logo.png`, referenced in the sitewide Organization schema) — currently missing.
- [ ] All placeholder images are royalty-free stock (Pexels) and are logged automatically in `IMAGES_TODO.md` as they're used during build — replace and delete each line as you go.

## Compliance & registrations
- [ ] Confirm the compliance-claim rules in `CONTENT_GUIDE.md` match reality — the site claims **only** IEC and APEDA registration. If you hold any other certification (FSSAI, ISO, HACCP, BRC, GlobalG.A.P., MPEDA, organic certification, Halal, etc.) tell your developer so those pages can be updated — do NOT add certificate claims to the content yourself without review, since Netlify's build has a compliance lint gate that will block the deploy if banned phrases appear.
- [ ] Review `research/unverified.md` (populated during Phase 2) — any product/market claim we could not verify against a public source was left out of the site; decide whether to provide internal data to fill those gaps.
- [ ] **DGFT export-policy check** — any product found to be restricted/prohibited/MEP-controlled at research time was excluded from having a sales page; check `research/unverified.md` and `PROGRESS.md` for the current list, since DGFT policy changes (onions, non-basmati rice, wheat, sugar, some fertilizers have all been restricted at various times) and this needs periodic re-checking, not a one-time check.

## Content review
- [ ] **Native-speaker review** of every non-English page before it's allowed to go live — see `research/translation-review.md` once Phase 5+ blog batches exist. Pages default to `reviewed: false` (noindex) until you sign off.
- [ ] **Author bio confirmation** — `/authors/jamil-khan/` and the editorial-team author page use placeholder-friendly bios; confirm wording before launch.
- [ ] **MOQ confirmation** — the default MOQ used sitewide is "{{ 1 × 20ft container; trial orders discussed }}" (`_data/site.json` → `defaultMoq`). Confirm this is accurate per product; some products may need a different default.

## Social / brand
- [ ] Add real social profile URLs to `src/_data/site.json` → `socialProfiles` (LinkedIn, etc.) — only real, live profiles should be added; the sitewide schema omits `sameAs` entries for any left blank.

## Restricted/prohibited products — DGFT (checked 2026-09-17, via web search — verify directly at dgft.gov.in before launch)
- [ ] **Non-basmati WHITE rice** (semi/wholly milled, roughly ITC-HS 1006 30 90) — currently **Prohibited** for export (since July 2023, still prohibited as of an April 2026 notification that only touched EU/UK inspection-certificate rules). **No sales page was built for plain non-basmati white rice.** Parboiled rice and basmati rice are unaffected (see below).
- [ ] **Parboiled rice** — Free, but carries a 20% export duty (since ~May 2025). Fine to sell; just don't quote a duty-inclusive price as fixed.
- [ ] **Wheat** — was Prohibited through most of 2026, reportedly moved back to **Free** on 24 August 2026. This is very recent and wheat export policy has swung repeatedly this year — re-confirm at dgft.gov.in before building a wheat product page or quoting wheat prices; treat the "Free" status as provisional until you've checked yourself.
- [ ] **Onion** — Free, but subject to a Minimum Export Price (~US$550/MT as of the August 2026 check) and possibly a 20% export duty — sources disagreed on whether the duty was removed 1 April 2025 or still active in August 2026. Confirm current MEP/duty status directly with DGFT before quoting onion pricing; the site's onion content is written to say terms are "confirmed at time of order," not fixed.
- [ ] **Everything else in the master product list was not individually checked against DGFT this session** (all fruits except banana/grapes/pomegranate, all vegetables except onion, all pulses, all spices, seafood other than shrimp, most feed/fertilizer items, oilseeds other than sesame/groundnut). Default assumption used was "Free" (normal for ordinary agri-commodities) but this needs a per-product confirmation pass before those get product pages, and periodic re-checking after launch since India has changed export policy on agri-commodities with little notice multiple times in the past two years.
- [ ] Full detail and sourcing: see `research/unverified.md`.

## Phase 2 trade-data follow-up needed
- [ ] Several trade-data figures now in `src/_data/trade-data/*.json` came from private trade-data aggregator blogs (SeAir, ExportImportData.in, TradeImeX, etc.) rather than directly from APEDA/DGCI&S/MPEDA, because those primary sites either timed out, are JavaScript-rendered dashboards (oec.world), or returned PDFs this session's tools couldn't parse (mpeda.gov.in export-performance reports — no PDF text extractor available). Each JSON file's `notes` field flags its confidence level. Before these numbers anchor a published, cited blog post, a follow-up research pass with better primary-source access (working PDF parser, more time on agriexchange.apeda.gov.in / tradestat.commerce.gov.in) should re-verify: organic manure (flagship "cow manure exporter" cluster), frozen shrimp per-country USD values, soybean meal per-country values, sesame seed volumes.
- [ ] No trade data was gathered yet for: rice bran/DORB (searches kept returning rice-bran *oil* data instead), groundnut cake, mustard/rapeseed meal, cottonseed cake, maize DDGS, fish meal, most spices, most pulses, most vegetables besides onion, millets, makhana, jaggery, dehydrated onion/garlic, guar gum, psyllium husk. Don't publish country-specific trade claims for these until `src/_data/trade-data/` has a file for them.

## Restricted/prohibited products — DGFT, second pass (checked 2026-09-17)
- [x] **De-Oiled Rice Bran (DORB) — GOOD NEWS, ban lifted.** DGFT Notification No. 37/2025-26 dated 3 October 2025 moved DORB from 'Prohibited' to 'Free' with immediate effect (ITC-HS 2302 40 00, 2306 90 19, 2306 90 29, 2306 90 90). The ban had been in force since July 2023. Nothing for you to do here — just be aware that the DORB pages and blog posts are built on the post-ban position, and that calendar-2024 trade figures for DORB are artificially near-zero because they fall inside the ban window.
- [ ] **Sugar — PROHIBITED until 30 September 2026** (ITC-HS 1701 14 90 and 1701 99 90; raw, white and refined). Exemptions exist for EU CXL / US TRQ quotas, Advance Authorisation Scheme and government-to-government shipments. **This expires within days of the research date — confirm the current position at dgft.gov.in before any sugar enquiry is quoted.** No sugar sales page was built.
- [ ] **Jaggery / gur — STATUS UNRESOLVED, treat as blocked.** The sugar prohibition names 1701 14 90 and 1701 99 90. Jaggery and khandsari sit at 1701 13 20 / 1701 14 20, which are *not* named — which suggests jaggery is outside the ban, but this was **not confirmed against a primary DGFT source**, and the codes are close enough to be risky. **Please confirm with DGFT or your customs broker before we publish a jaggery product page or quote a jaggery enquiry.** Nothing has been published on jaggery pending your answer.
- [x] **Pulses (chickpea, lentil/masoor, tur, urad, moong) — Free for export.** No prohibition found, and corroborated by real 2024 export flows in UN Comtrade data (chickpeas USD 283M, lentils USD 149M).
- [ ] **Makhana HS code needs a customs-broker check.** The code originally in our data (1904.20) was wrong — that heading covers prepared cereal-flake foods. It has been replaced with `1404.90 (verify)`, which is plausible but unconfirmed. Please have your customs broker confirm the correct ITC-HS line before any makhana page quotes a code.
- [ ] **~25 products still have no individual DGFT check** (groundnut cake, mustard meal, cottonseed cake, maize DDGS, cattle/poultry feed, toor dal, moong/urad, potato, tomato, okra, drumstick, fresh green chilli, papaya, watermelon, lemon/lime, coconut, millets, dried garlic, individual fertilizer types, and non-shrimp/non-squid seafood). Default assumption is 'Free', which is normal for ordinary agri-commodities, but confirm per-product before those pages quote pricing — India has changed agri export policy with little notice repeatedly (onion, rice, wheat, sugar, DORB all moved in the last three years).

## Restricted/prohibited products — DGFT, Block B pass (checked 2026-09-18)
19 new product pages were built this pass; each was checked against DGFT's Schedule 2 export policy (via a secondary mirror — see below — since this machine still can't parse the actual DGFT PDF). Two findings need your direct confirmation before you'd want to treat them as fully settled:
- [ ] **Maize — published as exportable with an onion-style "policy confirmed at time of order" caution, not a flat "Free."** A DGFT policy mirror showed maize (HS 1005.90, non-seed) as flatly Prohibited, but that directly contradicts current USDA reporting of India shipping ~996,000 tonnes of maize in the first five months of this trade year (three times the prior year's pace), mostly to Nepal/Bhutan/Bangladesh/Sri Lanka/Vietnam. We've treated the "Prohibited" table as stale and built the page on the real, current export activity — but this rests on reconciling two secondary sources, not a primary DGFT confirmation. **Please verify maize's current export policy directly at dgft.gov.in before quoting a maize order**, especially a large one.
- [ ] **Raw/boiled rice bran (HS 2302.20) is Restricted — export permitted under licence only** — a separate finding from, and not to be confused with, De-Oiled Rice Bran (DORB, HS 2306.90/2302.40), which you already know is Free since October 2025. No page was built for plain rice bran; only the DORB page, which explicitly distinguishes the two.
- [x] Groundnut cake / de-oiled groundnut cake (HS 2305) — confirmed **Restricted, export under licence only**. No page built (also still no trade data for it either way).
- [x] Turmeric, red chilli, cumin, coriander, black pepper, cardamom — confirmed **Free**. DGFT's spice chapter (9) has no restricted/prohibited entries at all.
- [x] Groundnut kernels, guar gum, dehydrated onion & garlic powder, fish meal, garlic, mango, squid & cuttlefish, psyllium husk, dried ginger — confirmed **Free**, each published with the specific documentation condition or data caveat noted on its page (e.g. guar gum needs SHEFEXIL PCP testing for EU orders; fresh ginger specifically is Restricted even though dried ginger is Free, so the published page is explicitly the dried-ginger product).
- [ ] **Source quality note:** these Block B checks used a third-party mirror of DGFT's Schedule 2 tables (eximguru.com), not the DGFT PDF itself — this machine still has no working PDF text extractor (see the long-standing Xcode Command Line Tools gap in item 8 of the setup checklist above; installing that would also unblock a direct read of `content.dgft.gov.in/.../Export%20Policy.pdf`). Worth a periodic spot-check against the primary document, particularly for maize given the point above.

## Consider adding a Chinese (zh) language track
China is the **single largest export market** for India's two biggest spice lines — dried red chilli (USD 456M of a USD 1.30B total, 2024) and cumin (USD 141M of USD 785M) — plus fish meal (USD 93M) and guar gum (USD 40M). The site currently supports es/pt/fr/de/nl/ar/id/vi/ms but **not** Chinese, so the largest single buyer market for our highest-value products has no localised content. Worth discussing whether to add it.
