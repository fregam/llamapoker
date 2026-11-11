# LlamaPoker

Everything for LlamaPoker in one repo: the website, the brand, the reels and the content. The free poker tool at **https://llamapoker.com** is the front door; the
goal is a poker media brand built around it (see `docs/vision.md`).

```
brand/      Brand system: guidelines, colour and type tokens, logo, approved assets.
            The source of truth; everything else uses it.
apps/web/   llamapoker.com: odds calculator, trainer, Learn guides (React + Vite,
            prerendered, on Cloudflare Pages).
apps/reels/ Short vertical videos (Reels, TikTok, Shorts) rendered from code with Remotion.
apps/wall/  The command center: a private dashboard on one D1 event store (own look, not the brand).
content/    Articles, social posts, reel scripts and the content calendar (Markdown).
media/      Binary media mirroring content/ (git-ignored; every file listed in a manifest).
scripts/    Repo tools: media manifests, voice and sound generation for the reels.
docs/       Vision, roadmap, decisions and runbooks (hosting, deploys).
```

## Working on the site

```bash
cd apps/web
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # what Cloudflare runs on every push to main
```

Details: `apps/web/README.md` (features) and `apps/web/overview.md` (code map).

## Secrets

Keys live in `credentials.json` at the repo root (git-ignored) and in the Cloudflare
dashboard. Never commit a key.
