# Content Guide

## Voice
Confident, precise, trade-literate. Write for procurement buyers: specs, consistency, documentation, lead times, container economics, payment security. Short paragraphs, scannable, active voice. No hype clichés ("world-class", "best in the world"), no unverifiable superlatives, no invented statistics. Every section should end by moving the reader toward the quote form — but the move should feel like a natural next step, not a hard sell.

"25+ years in trade since 2000" is the one allowed longevity claim.

## Compliance-claim rules (STRICT — enforced by `scripts/check-compliance.js` at build time)
- The only registrations Green Plus EXIM may claim: **IEC** (Import Export Code) and **APEDA**.
- Never state or imply FSSAI, ISO, HACCP, BRC, GlobalG.A.P., MPEDA, NPOP/USDA/EU Organic, or Halal certification. Never say the company *lacks* these either — just don't bring it up.
- No certificate logos anywhere.
- Standard neutral phrasing to reuse:
  - "Export documentation prepared to match destination-country and buyer requirements — phytosanitary certificate, certificate of origin, fumigation certificate, lab test reports and more, as applicable."
  - "Share your compliance checklist and we will confirm the documentation for your shipment."
  - "Third-party inspection (SGS, Bureau Veritas, Intertek or your nominated agency) can be arranged on request."
- `/quality-compliance/` is about *process* (sourcing checks, grading, pre-shipment inspection, lab testing on request, traceability) — never certificates.
- "Organic" is a product-type word only ("organic manure", "organic fertilizer", "natural") — never "certified organic" or "organic certified".
- No fake social proof: no invented testimonials, review counts, star ratings, shipment counts, "X countries served" figures, or `aggregateRating`/`reviewCount` schema. The testimonials component exists but stays hidden until real reviews are supplied.

## CTA rules
Every page: hero CTA + a mid-page CTA band + a full RFQ form section. Blog posts additionally get a short CTA box after the intro and an inline quick-quote form ~50–60% through. CTA copy is buyer-benefit led ("Get FOB/CIF Price", "Request Specs & Samples", "Check Availability for Your Port") — never generic ("Click Here", "Submit").

## Blog post front matter
```yaml
title: ""
description: ""
slug: ""
lang: "en"
dir: "ltr"
date: 2026-09-17
updated: 2026-09-17
author: "jamil-khan"
category: "buyer-guides"
product: "organic-cow-manure"
hs_code: "3101"
target_country: "AE"
primary_keyword: ""
secondary_keywords: []
trade_data: "organic-manure-3101"
faq: [{q: "", a: ""}]
cta_headline: ""
reviewed: true
hreflang_group: ""   # only if a true translated equivalent exists
```

## Blog post structure (every post)
1. TL;DR / "Quick answer" box (40–60 words) directly under the H1.
2. Question-based H2s ("What is the price of…", "Which documents…"). First sentence under each H2 answers it directly.
3. At least one data table sourced from `src/_data/trade-data/<file>.json`, with a citation + retrieval date, plus a simple inline SVG bar chart (no chart library).
4. Specifications table + packaging/container-loading table + documentation checklist.
5. "Key facts" bullet box.
6. FAQ, 5–8 Q&As, rendered via `partials/faq.njk` (auto-generates `FAQPage` schema).
7. "Sources" list, outbound links `rel="noopener"` (not `nofollow`).
8. Author byline + "Reviewed by" line + published/updated dates.
9. Links to: the relevant product page, the relevant market page, `/get-a-quote/`, 2–3 sibling posts.
10. Length: 1,500–2,500 words (pillar posts 3,000+). No padding.

## Anti-spam guardrails
- No two posts target the same primary keyword + language.
- Product × Country posts must include country-specific regulations, ports, data, seasonality — not a template with the country name swapped.
- Run a similarity check across posts before publishing a batch; rewrite any pair over ~30% similar.

## Never invent a number
Every statistic, ranking, or "top importer" claim must trace to a cited public source with a link, dataset name and year, stored in `src/_data/trade-data/`. If it can't be verified, write around it qualitatively and log it in `research/unverified.md` — do not publish it.
