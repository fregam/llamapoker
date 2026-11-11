# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is the website app inside the LlamaPoker monorepo (`apps/web/`). The repo-wide guide is
`../../CLAUDE.md`; brand rules are in `../../brand/README.md`. Run npm commands from this folder.

## Start here

**Read `overview.md` first.** It has the full code structure, what every file does, the data
flow (state → `useEquity` worker → `analyzeSpot` → `<Readout>`) and the key rules (card
encoding, equity and ties, ranges notation, seats by table size, shortcuts). Every source file
also opens with a header comment saying what it does and what it connects to; read that before
editing the file.

## Commands

```bash
npm run dev                        # Vite dev server, http://localhost:5173
npm test                           # vitest run — all tests: poker logic (src/poker/poker.test.ts), every page renders
                                   #   + signup placement (src/pages.test.tsx), the signup function (functions/api/subscribe.test.ts)
npx vitest run -t "flush draw"     # one test by name
npx tsc --noEmit                   # type-check (there is no linter; tsc is strict incl. noUnused*)
npm run build                      # tsc → vite build → SSR build → prerender → dist/ (deployed by Cloudflare Pages)
npx vite preview                   # serve the production build locally
```

The dev environment is Windows; both PowerShell and Git Bash are available.

## Architecture in brief

- React 18 + TypeScript + Vite, no state library, no backend. Real URLs via a tiny router
  (`src/router.ts`) and one route table (`src/seo.ts`: path, title, description, prerender).
  `npm run build` prerenders pages to HTML through `src/entry-server.tsx` + `scripts/prerender.mjs`,
  so components must not touch `window` during render (effects only). Styling is one global
  `src/styles.css` with plain class names. Hosting: Cloudflare Pages (`public/_headers`, `404.html`);
  the email signup (`components/Signup.tsx`) posts to the Pages Function
  `functions/api/subscribe.ts`, which adds the address to Beehiiv with the page it came from and
  the first-touch channel (`src/attribution.ts`).
- `src/poker/` is pure TypeScript game logic. It must not import React or anything outside
  `poker/`, because it runs in a web worker (`equity.worker.ts`) and in Vitest.
- `poker/analyze.ts` (`analyzeSpot`) is the single place that combines pot odds, stack/SPR,
  draws, implied odds and `strategy.recommend()`. The live tool (`views/PlayTool.tsx`) and the
  Trainer (`views/Trainer.tsx`) both use it, so they always agree. Put new decision logic there
  or in `strategy.ts`, not in components.
- Equity always runs through `hooks/useEquity.ts`: recompute is driven by a `key` string, with a
  quick pass then a full pass, and stale work is cancelled. The Trainer grades only on the full
  pass.
- The Trainer's "Full hand" drill is a pure state machine in `poker/handPlay.ts` (deal → applyChoice
  → showdown). Single-spot drills come from `poker/drills.ts`. Grading lives in `grade()` in
  `views/Trainer.tsx`.
- `components/OpponentRanges.tsx` holds both the opponents UI and the opponent data helpers
  (`oppCombos`, `oppsKey`, …) that the Trainer reuses.

## Conventions

- Public positioning: a **study, hand-review and training** tool. Most online poker sites ban
  real-time assistance during play; never market it for use at a real-money table.
- When you add, move or rewire a file, update its header comment and `overview.md`.
- Keep `views/Strategy.tsx` and `views/Glossary.tsx` in sync with `strategy.ts` and the math;
  `README.md` documents user-facing features and keyboard shortcuts.
- Brand colours and fonts are defined once in `../../brand/tokens.css` (imported at the top of
  `src/styles.css`); add or change brand colours there, not here.
- Design rules: Bodoni Moda only for headlines and big numbers, Inter for paragraphs and
  captions (small Bodoni is hard to read on black). Colour only for meaning: sage good, brass
  neutral, vermilion danger. No glows, gradients or pulsing effects. The Table page must fit
  one screen without scrolling.
- Monte Carlo tests use tolerances. Keep iteration counts high enough that they don't flake.
