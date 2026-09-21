# Green Plus EXIM — Website

Static site built with [Eleventy v3](https://www.11ty.dev/) (Nunjucks templates), hosted on Netlify, leads captured via Netlify Forms. No backend.

## Run locally
```
npm install
npm run dev     # serves at http://localhost:8080 with incremental rebuilds
```

## Build
```
npm run build    # outputs to _site/
```

## Quality gates
```
npm run check           # runs the full suite: build → html-validate → forms → compliance → orphans → broken links
npm run check:html      # html-validate only
npm run check:forms     # Netlify form consistency only
npm run check:compliance
npm run check:orphans
npm run check:links
```
Never deploy with a failing gate — see `PROGRESS.md` for current status.

## Add a blog post
1. Copy the front-matter template from `CONTENT_GUIDE.md`.
2. English: `src/blog/<slug>.md`. Localized: `src/<lang>/blog/<slug>.md` (e.g. `src/es/blog/<slug>.md`).
3. Set `reviewed: false` until a native speaker has checked a non-English post — it stays `noindex` until flipped to `true`.
4. Link to: the relevant product page, the relevant market page, `/get-a-quote/`, and 2–3 sibling posts (the orphan-check quality gate will fail the build otherwise).
5. Pull any statistic from `src/_data/trade-data/<product>.json` — never hand-type a number that isn't sourced there.

## Add a language
1. Add the language to `src/_data/languages.json` (code, label, dir, path).
2. Create `src/_data/i18n/<code>.json` with translated UI strings (nav, footer, form labels, CTA microcopy). Field `name` attributes in forms stay in English — only labels/placeholders/option *text* is translated (option `value`s stay English).
3. Create `src/<code>/thank-you/` and `src/<code>/blog/` (index page).
4. If a page is a true translation of an English page, add both to a shared `hreflangGroup` in front matter (see `layouts/base.njk`). If it's a local-market post with no English twin, skip hreflang — just set `lang`/`dir` correctly.

## Add a product
1. Verify the HS code and current DGFT export policy status first — do not publish a product page for anything restricted/prohibited/MEP-controlled (see `research/unverified.md`).
2. Add/confirm trade data at `src/_data/trade-data/<product-slug>.json` (schema documented in the file itself / `CONTENT_GUIDE.md`).
3. Create `src/products/<category>/<product-slug>.njk` using the product layout, `type: product`, `hs_code`, `category`.
4. Link it from the relevant category page and from 3+ blog posts.

## Update trade data
Trade data lives only in `src/_data/trade-data/*.json`, one file per product, each entry carrying `source_name`, `source_url`, `retrieved_date` and `year`. Never hand-edit a number in a template — templates always read from these files so every page using that stat updates together.

## Deploy to Netlify
1. Connect the repo in Netlify (build command `npm run build`, publish directory `_site` — already set in `netlify.toml`).
2. Enable Forms detection: Site configuration → Forms.
3. Set form notification emails: Site configuration → Forms → Form notifications.
4. Add environment/config values from `OWNER_TODO.md` (GA4, Clarity, GSC/Bing verification) to `src/_data/site.json` before the first production build.
