# Owner To-Do

Only what is still outstanding for you, in priority order. Regenerated 30 Sep 2026. Things already
done this week are listed at the bottom so you can see they're off your plate.

Where a value goes into the site, the file is `src/_data/site.base.json` unless stated otherwise.

---

## 1. Search engines — this week

- [ ] **Search Console: resubmit the blog sitemap.** Sitemaps → `sitemap-blog-en.xml` → ⋮ →
  remove, then add `https://www.greenplusexim.com/sitemap-index.xml` again and Submit. The file
  serves correctly (200, `application/xml`, no redirects — `npm run check:sitemap-health`
  verifies this against the live site); the "Couldn't fetch" was logged during the redirect loop.
  Do it after the blog-restructure deploy so Google reads the new `<lastmod>` dates.
- [ ] **Search Console: request indexing** for the 5–10 most important URLs (home, /products/,
  /get-a-quote/, top product pages) via URL Inspection → Request indexing.
- [ ] **Bing Webmaster Tools** — [bing.com/webmasters](https://www.bing.com/webmasters) → Add
  site → **Import from Google Search Console** (fastest; no code needed). Then Sitemaps → submit
  `https://www.greenplusexim.com/sitemap-index.xml`. If Bing asks for a meta tag instead, paste
  the code into Netlify → Site configuration → Environment variables as
  `BING_SITE_VERIFICATION` and trigger a deploy — no code change. Bing feeds several AI
  assistants, so treat its coverage like Google's.
- [ ] **Google Business Profile** — [business.google.com](https://business.google.com): create or
  claim the listing with the **new phone number +91 91377 81067**, website
  `https://www.greenplusexim.com`, and the same address as the site (needs item 3 below). Update
  the number on your WhatsApp Business profile too — Google cross-checks NAP consistency.

## 2. Leads — before you rely on the forms

- [ ] **Netlify form detection** — Netlify → Site configuration → Forms → confirm detection is
  enabled and that **export-inquiry, quick-quote, contact and supplier-partnership** all appear
  after the latest deploy.
- [ ] **Live test submission** — submit a real enquiry from
  https://www.greenplusexim.com/get-a-quote/ and one quick-quote from a product page; confirm
  both land under **Verified submissions** (not Spam).
- [ ] **Form notifications** — Forms → Form notifications → email (and/or Slack) for each form,
  so leads reach you without logging in.
- [ ] **Submission limit** — check your Netlify plan's monthly form cap covers expected volume.

## 3. Registration details — the site shows placeholders until these are in

- [ ] **IEC number** → `registrations.iecNumber` (shown on /registrations/).
- [ ] **APEDA RCMC number** → `registrations.apedaRcmcNumber`.
- [ ] **Registered office address** → `address.streetAddress` and `address.postalCode`.
- [ ] **GSTIN** → `gstin`, only if you want it displayed.

## 4. Photos — see `IMAGES_TODO.md` for the auto-generated shot list

- [ ] Photo of Mr. Jamil Khan for `/about/` and `/authors/jamil-khan/`.
- [ ] Warehouse, packing line, grading/sorting and container-loading photos.
- [ ] Real shipments/containers if available — no certificate logos in frame.
- [ ] Company logo file at `src/assets/img/logo.png` (referenced by the Organization schema,
  currently missing).

## 5. Directory listings and profiles

- [ ] List the business on trade directories you're willing to maintain (e.g. APEDA exporter
  directory, IndiaMART, TradeIndia, ExportersIndia, Kompass) — **same name, address and
  +91 91377 81067 everywhere**, linking to `https://www.greenplusexim.com`.
- [ ] Add real, live social profile URLs (LinkedIn etc.) to `socialProfiles` — only real ones;
  the site's schema lists whatever is there.

## 6. Time-sensitive export-policy checks (verify at dgft.gov.in before quoting)

- [ ] **Sugar** — prohibited **until 30 Sep 2026 (today)**. Confirm the new position before any
  sugar enquiry is quoted. No sugar page exists.
- [ ] **Jaggery** — unresolved; treat as blocked until DGFT or your customs broker confirms.
- [ ] **Onion** — confirm current MEP / export duty before quoting.
- [ ] **Wheat** — moved back to Free on 24 Aug 2026 per reports; re-confirm before any page or quote.
- [ ] **Maize** — page built on current export activity despite a stale "Prohibited" entry in a
  secondary mirror; confirm against the DGFT Schedule 2 PDF.
- [ ] **Makhana HS code** — `1404.90 (verify)` needs a customs-broker check.
- [ ] ~25 other products never individually checked against DGFT (list in `research/unverified.md`).

## 7. Content sign-offs

- [ ] **MOQ wording** — sitewide default `defaultMoq`; confirm it matches how you actually sell.
- [ ] **Author bios** — confirm `/authors/jamil-khan/` and the editorial-team page wording.
- [ ] **Translated posts (13)** — native-speaker review, then flip `reviewed: true` and remove
  `noindex: true` per `research/translation-review.md`. They stay out of Google until then. Form
  labels on those pages are still English.
- [ ] **Microsoft Clarity** (optional) — create a project and put its ID in
  `analytics.clarityProjectId`; it loads only after consent in Europe.
- [ ] Decide whether to add a **Chinese (zh)** language track — China is the top market for
  chilli, cumin, fish meal and guar gum.

---

## Done this week (no action needed)

- GA4 is live — `G-EXQ3T0Y142`, Consent Mode v2 with an EU/UK/CH banner and a "Cookie settings"
  footer link. Check GA4 → Realtime to see it working.
- Redirect loop fixed; `www.greenplusexim.com` is canonical, apex and `greenplusexim.netlify.app`
  301 to it in one hop. Keep **www** as the Netlify primary domain.
- IndexNow key generated and published; changed URLs are submitted to Bing/Yandex automatically
  on every production deploy (log: `reports/indexnow.log` and the Netlify deploy log).
- Phone/WhatsApp changed to +91 91377 81067 everywhere, with product-specific WhatsApp messages.
- Certification "we don't hold…" disclaimers removed sitewide.
- Deploy previews and branch deploys now send `X-Robots-Tag: noindex`.
- `reports/launch-checklist.md` lists every indexable URL with title, description, word count,
  canonical host, inbound links and form presence — use it against Search Console's coverage.
