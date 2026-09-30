# ERR_TOO_MANY_REDIRECTS on greenplusexim.com — 30 Sep 2026

## Verdict

**Cause: our own `netlify.toml` host rules fighting Netlify's primary-domain redirect.**
Not Cloudflare, not registrar forwarding.

| Hop | Who | Evidence |
|---|---|---|
| `greenplusexim.com` → `www.greenplusexim.com` | our `[[redirects]] from = "https://greenplusexim.com/*" … force = true` | rule in netlify.toml (now removed) |
| `www.greenplusexim.com` → `greenplusexim.com` | Netlify's automatic alias → primary redirect | no rule of ours targets the apex, so the apex must be set as **Primary domain** in Netlify |

Every hop carried `x-nf-request-id` + `server: Netlify`; no `cf-ray` anywhere.

## Evidence (before)

### Chains (abridged — every host looped identically until curl's 10-hop cap)

```
=== http://greenplusexim.com/
HTTP/1.1 301  Location: https://greenplusexim.com/        Server: Netlify
HTTP/2 301    location: https://www.greenplusexim.com/    server: Netlify
HTTP/2 301    location: https://greenplusexim.com/        server: Netlify
HTTP/2 301    location: https://www.greenplusexim.com/    ... (repeats)
curl: (47) Maximum (10) redirects followed

=== https://greenplusexim.com/        -> www -> apex -> www ... curl: (47)
=== http://www.greenplusexim.com/     -> https://www -> apex -> www ... curl: (47)
=== https://www.greenplusexim.com/    -> apex -> www -> apex ... curl: (47)
=== https://greenplusexim.com/blog/   -> www/blog/ -> apex/blog/ -> ... curl: (47)

=== CONTROL https://greenplusexim.netlify.app/   HTTP/2 200
```

Sample request IDs: `01M3RWD1V6JRT39ETT7A99H4A4` (apex→www), `01M3RWD2GR6XZASV17G8A1FN6W` (www→apex).

### DNS (via DoH; local UDP dig blocked)

```
NS  greenplusexim.com      dns1..4.p02.nsone.net   (Netlify DNS)
A   greenplusexim.com      52.74.6.109, 13.215.239.219  (Netlify LB)
A   www.greenplusexim.com  52.74.6.109, 13.215.239.219  (Netlify LB, flattened)
```

No Cloudflare in the path, and there's no registrar forwarding because Netlify DNS is authoritative.

### Live build (via greenplusexim.netlify.app)

Canonical, og:url, robots.txt `Sitemap:` and all five sitemap-index children already use
`https://www.greenplusexim.com`.

## What changed in code

1. **`netlify.toml`**: deleted all three `# ---- Force www + HTTPS ----` rules (apex https→www,
   apex http→www, www http→https, all `force = true`). What's left is path-level only:
   `/sitemap.xml → /sitemap-index.xml` plus the legacy `/about`, `/services`, `/gallery` and product URL
   redirects. There's no `_redirects` file anywhere and no trailing-slash rules.
2. **`scripts/site-url.js`**: production builds no longer read Netlify's `URL` env var. `URL`
   is whatever the primary domain is set to in the Netlify UI. With the apex as primary, the next
   deploy would have moved every canonical, hreflang, sitemap and schema URL onto the apex.
   The new priority is `SITE_URL` override > `https://www.greenplusexim.com` when `CONTEXT=production` >
   `DEPLOY_PRIME_URL` (previews) > production fallback.

## What only you can change in the Netlify UI (required)

Netlify CLI is not installed/authenticated here, so this has to be done in the dashboard:

1. **Site configuration → Domain management → Production domains**: on `www.greenplusexim.com`,
   open **Options → Set as primary domain**. Keep `greenplusexim.com` listed (it becomes the
   alias Netlify 301s to www, exactly once).
2. **Domain management → HTTPS**: leave **Force HTTPS** on (it has no effect on the loop).
3. Optional: **Environment variables** — if a `SITE_URL` var exists, make sure it is exactly
   `https://www.greenplusexim.com` (no trailing slash) or delete it.

Either order is safe. With our rules gone, no combination of settings can loop. If you deploy before
switching the primary, the site will serve on the apex (www → apex) while canonicals say www, which works
but is inconsistent until you switch.

## Verification

### Local (done)

- Build simulating Netlify prod with the *apex* as `URL`
  (`CONTEXT=production URL=https://greenplusexim.com npm run build`):
  173/173 canonicals on `https://www.greenplusexim.com`, 0 apex references in `_site`,
  robots.txt → `https://www.greenplusexim.com/sitemap-index.xml`, 152/152 sitemap `<loc>`s on www.
- `site-url.js` resolution: prod+apex URL → www; deploy-preview → its own preview URL;
  `SITE_URL` override honoured; no env → www.
- `check:forms`, compliance, orphans, broken links, blog quality: pass.
  `check:seo-integrity`, `check:crawler-access`, `check:links`: pass.
- `check:blog-standard` FAILS on `blog/dehydrated-onion-exporter-india-brazil`, which is
  an uncommitted in-progress rewrite and unrelated to this fix. `check-all` stops there, so the remaining gates were run individually.

### After deploy + primary-domain switch (to do)

```bash
for u in http://greenplusexim.com/ https://greenplusexim.com/ https://www.greenplusexim.com/ \
         https://www.greenplusexim.com/blog/ https://www.greenplusexim.com/sitemap.xml \
         https://www.greenplusexim.com/sitemap-index.xml https://www.greenplusexim.com/robots.txt \
         https://www.greenplusexim.com/get-a-quote/ ; do
  echo -n "$u -> "
  curl -sS -o /dev/null -w "%{http_code} after %{num_redirects} redirect(s) -> %{url_effective}\n" -L --max-redirs 5 "$u"
done
```

Expected: every URL ends `200` on `https://www.greenplusexim.com/…`. The apex ones take 1 hop,
or 2 for `http://` apex (Netlify does http→https, then alias→primary). The www ones take 0 hops, except
`/sitemap.xml`, which takes 1.

Then check that Netlify → Forms shows the forms detected and submit a real test from
`/get-a-quote/` to confirm it lands in Verified submissions. In Chrome, retest in a fresh
incognito window. If it still loops after curl is clean, clear the cached 301/HSTS entry at
`chrome://net-internals/#hsts`.
