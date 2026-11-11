# LlamaPoker — poker odds calculator & trainer

A single-screen tool you use while you play Texas Hold'em, plus a trainer that quizzes you on
random spots. Set your **position**, your **hand**, the **board**, and what each **opponent could
hold**. Odds, outs and the recommended move update automatically. Built with React + Vite +
TypeScript; all math runs locally in the browser.

## Run it

```bash
npm install
npm run dev     # then open the printed URL (default http://localhost:5173)
npm test        # run the test suite (vitest)
npm run build   # type-check, build and prerender every page into dist/
npx vite preview # serve the production build locally
```

## Deploying

The site is a static build with prerendered pages, hosted on **Cloudflare Pages** and connected
to the GitHub repo: every push to `main` runs `npm run build` and publishes `dist/`
(build command `npm run build`, output directory `dist`). Response headers live in
`public/_headers`; unknown URLs get `404.html`.

The email signup posts to `/api/subscribe` (`functions/api/subscribe.ts`), which adds the
address to the Beehiiv newsletter. Set `BEEHIIV_API_KEY` (secret) and `BEEHIIV_PUBLICATION_ID`
in the Cloudflare project's settings; optionally `TURNSTILE_SECRET_KEY` (secret) together with the
build variable `VITE_TURNSTILE_SITE_KEY` to put Cloudflare Turnstile in front of the form. Canonical links and the sitemap use
https://llamapoker.com; override with `SITE_URL` when building for another address.

## Pages

- **Home** (`/`): what it is, a worked example, and the email signup (the LlamaPoker letter).
  Every guide and the trainer carry the letter form too (a compact one), and other pages have it in the footer.

- **Tool**: the live calculator (below).
- **The Table** (`/table`), **Trainer** (`/trainer`), **Strategy** (`/strategy`), **Glossary** (`/glossary`), **Privacy** (`/privacy`).
- **Learn** (`/learn`): a beginner path: hand rankings, positions (with a table diagram), starting-hand charts by seat (generated from the tool's ranges), and an honest guide to online poker helpers.
- **Trainer**: five drills. **Full hand** plays a whole hand street by street against an opponent
  holding real cards from a realistic range, through to a showdown. **Mixed**, **Preflop**,
  **Call or fold** (pure pot odds) and **Count the outs** (type the number) drill single spots.
  Answer with keys 1–3 (Enter to continue). Close calls within 3% of the price accept either
  call or fold, and each call shows its average value in bb. An optional shot clock (20s / 10s)
  turns a timeout into a fold. The side column shows this session, all-time accuracy and your
  leaks (the spot types you miss most). Stats are saved in the browser.
- **Strategy**: the street-by-street game plan behind the recommendations.
- **Glossary**: every term the tool uses, with formulas.

## How you use the tool

Left side, **the situation**:
- **Quick entry**: type `AhKs Td9h2c` (your hand, then the board), or click a slot and press a rank
  then a suit.
- **Position**: UTG, MP, CO, BTN, SB or BB. A tag shows whether your hand is in that seat's opening,
  3-bet or calling range.
- **Opponents**: a +/- stepper, plus a range for each opponent: *Any two cards*, a seat's opening
  range, *BB defend*, *3-bet range*, *Premium*, or **Custom** (click or drag on a 13×13 grid).
- **Your hand** + **Board**: pick cards from the deck under the table. It fills your hand first, then
  the flop, turn and river as they come, and greys out cards already in play. Click a card on the
  table to change it. **Random flop / turn / river** deals the next street at random instead.
  A new street resets the action to *checked to you*.
- **Action to you**: *Unopened / Facing a raise* preflop, *Checked to you / Facing a bet* after.
- **Pot**, **Bet to call** (only when facing a bet) and **Your stack** (effective stack).

The whole table fits one screen in three columns (cards · settings · the read), so nothing needs
scrolling mid-hand. **Next hand** clears the cards and moves your seat one step, the way the button
moves (BTN → CO → MP → UTG → BB → SB).

Keyboard shortcuts: a rank (`A K Q J T 9`–`2`) then a suit (`s h d c`) places a card · `Backspace`
undoes the last card · `B` toggles checked / facing a bet · `←` `→` change seat · `N` next hand.

Right side, **the read**:
- **Recommended move**: one action with a one-line reason.
- **Equity, needed, outs**: the three key numbers, then a win / tie / lose split and your share of
  the pot against the ranges you chose.
- **Draws & outs** (flop and turn): named draws, every out card, and the exact chance to hit on
  the next card and by the river, next to the rule-of-2-and-4 estimate.
- **Pot odds**: CALL / FOLD, the price bar and break-even gauge, all-in warning, **implied odds**
  when a draw is short of the price, and the **SPR**.
- **What beats you**: the hands that win when you lose.
- **Show the math**: every formula filled in with your live numbers.

## How the math works

- `src/poker/evaluator.ts`: 5/7-card hand evaluator (each hand → one comparable integer).
- `src/poker/equity.ts`: Monte Carlo equity. Ranged opponents are dealt a combo from their range;
  ties split only among the players who actually tied.
- `src/poker/ranges.ts`: notation (`22+`, `ATs+`, `JJ-99`, `AJs-A9s`), the 169-hand grid, 6-max
  opening ranges, facing-a-raise charts per seat, and opponent presets.
- `src/poker/draws.ts`: outs counting (flush / straight draws, improving to two pair or trips;
  board-only improvements don't count) and exact hit chances.
- `src/poker/strategy.ts` + `analyze.ts`: pot odds, all-in capping, SPR, implied odds and the
  recommended action, shared by the tool and the trainer.
- `src/poker/stats.ts`: trainer stats in `localStorage` (still works when storage is blocked).
- `src/poker/poker.test.ts`: tests for all of the above (e.g. AA vs one random hand ≈ 85%).

Accessibility: every card and control has a screen-reader label, the readout updates via
`aria-live`, the range grid is keyboard-operable, and all controls have a visible focus ring.
Equities are statistical estimates, so treat this as a study aid, not real-money advice.
