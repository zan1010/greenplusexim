# Translation Review Log

Every non-English page on this site is written natively (not machine-translated word-for-word) but has **not** been checked by a native speaker yet. Each page below carries `reviewed: false` in its front matter, which the build keeps `noindex` automatically until this list is worked through and the flag is flipped to `true`.

## How to review and publish a page
1. Read the live page (or the source `.njk` file under `src/<lang>/...`) with a native speaker.
2. Check: natural phrasing (not stilted/literal), correct trade terminology, correct port/city names, correct currency and unit conventions for that market, and that the compliance-claim rules (see `CONTENT_GUIDE.md`) weren't broken by translation.
3. Fix anything wrong directly in the `.njk` file.
4. Change `reviewed: false` to `reviewed: true` and remove the `noindex: true` line in that file's front matter.
5. Rebuild (`npm run build`) — the page will now appear in `sitemap-blog-intl.xml` and be indexable.
6. Check this row off below.

## Arabic (ar) — 7 posts, RTL, Gulf-market focus
- [ ] `/ar/blog/mawrid-basal-ahmar-min-alhind/` — Red onion exporter (UAE/Gulf)
- [ ] `/ar/blog/musaddir-rumman-taza-min-alhind/` — Pomegranate exporter (UAE)
- [ ] `/ar/blog/musaddir-arz-basmati-min-alhind/` — Basmati rice exporter (Saudi/Iraq/Gulf)
- [ ] `/ar/blog/musaddir-mawz-min-alhind/` — Banana exporter (Iraq/UAE/Oman)
- [ ] `/ar/blog/mawrid-badhur-alkamoun-min-alhind/` — Cumin exporter (UAE/China-anchored data)
- [ ] `/ar/blog/musaddir-kurkum-min-alhind/` — Turmeric exporter (UAE)
- [ ] `/ar/blog/mawrid-hail-min-alhind-khaleej/` — Cardamom exporter (Saudi/GCC)

## Known scope limitation — flag for the owner
The RFQ form (`export-inquiry`) and quick-quote form embedded on every localized page currently render with **English field labels** (e.g. "Full name", "Company name"), even though the surrounding article content is in the target language. Field `name` attributes and option values are correctly English-only per the build spec, but the visible label/placeholder text was not translated in this pass — that's a real gap against the brief's "Localized pages translate the labels, placeholders and options" requirement. See `OWNER_TODO.md` for the follow-up needed (an i18n label dictionary wired into `partials/rfq-form.njk` and `partials/quick-quote-form.njk`).

## Not yet started
Indonesian (id), Vietnamese (vi), Malay (ms), Portuguese (pt), Spanish (es), French (fr), German (de), Dutch (nl) — folder structure and directory-level layout config exist for id/vi/ms/pt; no posts written yet in this session. See `research/blog-plan.csv` for the prioritized list per language.
