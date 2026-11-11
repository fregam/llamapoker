# CLAUDE.md

Guidance for Claude Code across the LlamaPoker monorepo.

## Map

- `brand/`: **read `brand/README.md` before making anything visual or written** (site UI,
  images, videos, posts, articles). Colours and fonts come from `brand/tokens.css` (CSS) and
  `brand/tokens.json` (data); change both together and never hard-code new brand colours elsewhere.
  Image and video prompts start from `imagePromptBase` in `tokens.json`.
- `apps/web/`: the website. It has its own `CLAUDE.md` and `overview.md`; read them before
  touching site code. Run npm commands from `apps/web/`.
- `apps/wall/`: the command center (private, own look by decision, not the brand). Read its
  README first: one event store under everything, panels are modules, nothing ships without its
  panel (events in the common format + a station + its failure in threats).
- `apps/reels/`: short vertical videos rendered from code (Remotion). Read its README for the format; numbers
  come from `apps/web/src/poker/`, colours and fonts from `brand/`.
- `content/`: Markdown content and the calendar. Follow the voice in `brand/README.md`.
  `content/library/` holds the permanent image references (`assets.json` manifest).
- `media/`: binary media mirroring `content/` (git-ignored, except its README). Follow the naming
  rules in `media/README.md`. Every file must be listed in a manifest; check with
  `node scripts/media-manifest.mjs --check`. Never store project media outside the repo.
- `scripts/`: repo-level tools (e.g. `media-manifest.mjs`).
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
- **Personal brand notes:** `content/personal-brand/notes.md` is raw material for the founder's
  personal brand. Whenever a decision is worth telling (a tool swapped, a method invented, a trap
  found, a request declined, a result that surprised), append an entry there in the file's shape
  (date, choice, rejected and why, what happened, lesson, hook) as part of the same work, without
  announcing it and without being asked. Do this in every session.

## Agent skills

### Issue tracker

Local markdown: one folder per feature under `.scratch/<feature-slug>/` (spec + numbered issue files). See `docs/agents/issue-tracker.md`.

### Triage labels

The five default roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) as a `Status:` line. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`, alongside the existing `docs/decisions.md`. See `docs/agents/domain.md`.
