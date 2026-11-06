# Hosting runbook

## Today

- **Domain:** llamapoker.com, registered at Namecheap. Nameservers point to Cloudflare.
  Namecheap email-forwarding MX and TXT records are kept in Cloudflare DNS.
- **Site:** Cloudflare Pages project `llamapoker` (llamapoker.pages.dev), connected to GitHub
  `fregam/llamapoker`. Every push to `main` builds and deploys.
  - Root directory `apps/web`, build command `npm run build`, output directory `dist`.
  - Functions (`apps/web/functions/`) run the newsletter signup at `/api/subscribe`.
  - Environment: `BEEHIIV_API_KEY` (secret), `BEEHIIV_PUBLICATION_ID`.
- **Redirects:** a Cloudflare Redirect Rule sends `www` → `llamapoker.com` (301).
- **Newsletter:** Beehiiv publication LlamaPoker (`pub_c7930bfc-…`). Post template "The LlamaPoker Letter"
  (`post_template_c1039d31-05b2-48b3-b1a4-ab31696a1535`): brand dark theme, header image, sections (spot of the
  week, drill, from the journal), signed by the Gentleman. Managed through the Beehiiv MCP connector.
- **Analytics:** Cloudflare Web Analytics (no cookies). **Search:** Google Search Console
  (Domain property), sitemap `https://llamapoker.com/sitemap.xml`.

## Checking a deploy

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://llamapoker.com/table   # expect 200, no redirect
```

## Later: Hetzner VPS

Planned when the agents and backend need a server: Ubuntu, Caddy serving `apps/web/dist`,
a GitHub Action that builds and copies on push, Cloudflare proxy in front, firewall,
SSH-key-only login, automatic security updates. Steps to be written here as we do it.
