# Hosting runbook

## Today

- **Domain:** llamapoker.com, registered at Namecheap. Nameservers point to Cloudflare.
  Namecheap email-forwarding MX and TXT records are kept in Cloudflare DNS.
- **Site:** Cloudflare Pages project `llamapoker` (llamapoker.pages.dev), connected to GitHub
  `fregam/llamapoker`. Every push to `main` builds and deploys.
  - Root directory `apps/web`, build command `npm run build`, output directory `dist`.
  - Functions (`apps/web/functions/`) run the newsletter signup at `/api/subscribe`.
  - Environment: `BEEHIIV_API_KEY` (secret), `BEEHIIV_PUBLICATION_ID`. Optional, for Cloudflare
    Turnstile on the signup form: `TURNSTILE_SECRET_KEY` (secret, read by the function) and the build
    variable `VITE_TURNSTILE_SITE_KEY` (baked into the form at build time). Turnstile stays off until
    both are set; set them together, and redeploy after adding the site key.
- **Redirects:** a Cloudflare Redirect Rule sends `www` → `llamapoker.com` (301).
  `apps/web/public/_redirects` adds the bio links `/go/<channel>` (`ig`, `tt`, `yt`, `x`, `threads`,
  `reddit`, `letter`), each a 302 to the site with `utm_source` / `utm_medium` / `utm_campaign`, so a
  signup can say which channel it came from.
- **Newsletter:** Beehiiv publication LlamaPoker (`pub_c7930bfc-…`). Post template "The LlamaPoker Letter"
  (`post_template_c1039d31-05b2-48b3-b1a4-ab31696a1535`): brand dark theme, header image, sections (spot of the
  week, drill, from the journal), signed by the Gentleman. Managed through the Beehiiv MCP connector.
- **Email:** Google Workspace on llamapoker.com. DNS: Google MX, SPF (`include:_spf.google.com`; the
  Namecheap include can go), DKIM `google._domainkey`, DMARC `p=none` reporting to Cloudflare DMARC Management.
- **Analytics:** Cloudflare Web Analytics (no cookies). **Search:** Google Search Console
  (Domain property), sitemap `https://llamapoker.com/sitemap.xml`.

## Safety net

- **CI** (`.github/workflows/ci.yml`): on every pull request and push to `main`, type-check, tests,
  build, build-output sanity, runtime dependency audit, and a gitleaks secret scan. Dependabot
  (`.github/dependabot.yml`) opens weekly update PRs so CI checks them.
- **Branch protection** (set once in GitHub → Settings → Branches → `main`; the `gh` CLI is not
  installed on the PC, so this is done in the UI): require a pull request before merging; require
  status checks `Website (type-check, tests, build)` and `Secret scan (gitleaks)` to pass; require
  the branch to be up to date; include administrators. With that rule, `main` only ever receives
  green merges, which is what makes CI gate the Cloudflare deploy.
- **Preview deploys:** Cloudflare Pages builds every pushed branch at
  `https://<branch>.llamapoker.pages.dev` (branch names with `/` become `-`). Check a change there
  before merging.
- **Rollback (one step):** Cloudflare dashboard → Workers & Pages → `llamapoker` → Deployments →
  the previous production deployment → "Rollback to this deployment". Production switches
  instantly; fix forward on a branch afterwards. Every deployment keeps its own URL
  (`<hash>.llamapoker.pages.dev`) for comparison.
- **Stronger option, later:** turn off Pages' automatic git builds and deploy from the CI job with
  `wrangler pages deploy` only after the checks pass (needs a scoped Cloudflare API token as a
  GitHub secret). Not needed while the branch rule holds.

## Checking a deploy

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://llamapoker.com/table   # expect 200, no redirect
```

## Later: Hetzner VPS

Planned when the agents and backend need a server: Ubuntu, Caddy serving `apps/web/dist`,
a GitHub Action that builds and copies on push, Cloudflare proxy in front, firewall,
SSH-key-only login, automatic security updates. Steps to be written here as we do it.
