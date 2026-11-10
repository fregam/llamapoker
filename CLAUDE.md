# CLAUDE.md

Guidance for Claude Code across the LlamaPoker monorepo.

## Map

- `brand/`: **read `brand/README.md` before making anything visual or written** (site UI,
  images, videos, posts, articles). Colours and fonts come from `brand/tokens.css` (CSS) and
  `brand/tokens.json` (data); change both together and never hard-code new brand colours elsewhere.
  Image and video prompts start from `imagePromptBase` in `tokens.json`.
- `apps/web/`: the website. It has its own `CLAUDE.md` and `overview.md`; read them before
  touching site code. Run npm commands from `apps/web/`.
- `apps/reels/`: short vertical videos rendered from code (Remotion). Read its README for the format; numbers
  come from `apps/web/src/poker/`, colours and fonts from `brand/`.
- `apps/blender/`: motion for the reels, written as headless Blender scripts. Read its README
  first: absolute paths only, and the Gentleman faces +Y.
- `content/`: Markdown content and the calendar. Follow the voice in `brand/README.md`.
  `content/library/` holds the permanent image references (`assets.json` manifest).
- `media/`: binary media mirroring `content/` (git-ignored, except its README). Follow the naming
  rules in `media/README.md`. Every file must be listed in a manifest; check with
  `node scripts/media-manifest.mjs --check`. Never store project media outside the repo.
- `scripts/`: repo-level tools (e.g. `media-manifest.mjs`).
- `agents/`: planned automation (research, writing, SEO, social).
- `docs/`: `vision.md` (why), `roadmap.md` (what's next), `hosting.md` (how it runs).

## Rules

- Public positioning: a **study, hand-review and training** tool. Never market it for use
  during real-money play. 18+.
- Secrets: `credentials.json` at the root is git-ignored; never print, commit or copy keys
  into other files.
- Deploys: every push to `main` deploys llamapoker.com via Cloudflare Pages (root directory
  `apps/web`). Verify with curl after a push.
- Spending: Higgsfield credits and any paid service cost real money; quote the cost and get
  a yes before large or repeated generations.
- Keep `docs/roadmap.md` current when work ships or plans change.
