# Project overview — LlamaPoker (poker-trainer)

A public website for No-Limit Hold'em study: a free tool that is the lead magnet for a bigger
poker media brand (email list first; content, agents and more later). You enter your hand,
seat, the action and what your opponents could hold; it shows the recommended move, your
equity, the pot-odds price, your outs and what beats you. A Trainer plays full hands and
drills with you using the same logic. All math runs in the browser. There is no backend apart from one
Cloudflare Pages Function for the email signup, no router library and no state library.

**Positioning:** the public site presents it as a *study, hand-review and training* tool.
Most online poker sites ban real-time assistance during play; keep copy consistent with that
(home FAQ, privacy page, colophon).

Stack: React 18 + TypeScript + Vite 5, Vitest for tests. No other runtime dependencies.

```bash
npm run dev      # dev server (http://localhost:5173)
npm test         # vitest run (all tests)
npx vitest run -t "flush draw"   # a single test by name
npx tsc --noEmit # type-check only
npm run build    # tsc → vite build → SSR build → scripts/prerender.mjs → dist/ (deployable)
npx vite preview # serve dist/ locally
```

---

## Code structure

Lives at `apps/web/` in the LlamaPoker monorepo. Brand colours and fonts come from
`../../brand/tokens.css`, imported at the top of `src/styles.css`.

```
index.html              Page template: fonts (Bodoni Moda, Inter, JetBrains Mono), favicon, meta, #root
public/_headers         Cloudflare Pages response headers (asset caching, security), copied into dist/
functions/api/subscribe.ts  Cloudflare Pages Function: POST /api/subscribe → Beehiiv API (keys in env)
.node-version           Node version for the Cloudflare build (20)
scripts/brand-assets.mjs  Builds derived brand images from ../../brand (run by hand): public/og.png,
                        public/brand/*.webp, favicons, brand/social/* (templates in brand/templates/)
public/brand/           Web copies of the brand art (gentleman-*.webp, llama-icon.svg); public/favicon*
scripts/prerender.mjs   Build step: writes one HTML file per route (+ robots.txt, sitemap.xml)
src/
  main.tsx              Browser entry: mounts <App/> (createRoot), imports styles.css
  entry-server.tsx      Build-time entry: render(path) → HTML string, used by prerender.mjs
  App.tsx               Masthead + nav, routes → pages, city backdrop, colophon; sets <title>
  router.ts             Tiny router: usePath(), navigate(), setServerPath() for the prerender
  seo.ts                Route table: path → page, title, description, prerender, JSON-LD schema; LEARN_PATH
  content/faq.ts        Home FAQ as data (visible FAQ + FAQPage structured data)
  styles.css            The one global stylesheet (tokens on :root, plain class names)
  vite-env.d.ts         Vite client types (import.meta.env)

  poker/                Pure TypeScript game logic — no React, unit-tested, worker-safe
    cards.ts            Card = int 0..51 (rank = c>>2, suit = c&3); parse, labels, deck, shuffle
    evaluator.ts        5/7-card evaluator → one comparable integer; categories 0..8
    equity.ts           Monte Carlo simulate(hero, board, opps[], iterations) → EquityResult
    equity.worker.ts    Web worker wrapper for simulate()
    ranges.ts           Range notation, 169 grid, seat charts (open / 3-bet / call), combos, presets
    draws.ts            Outs counting + named draws + exact hit chances (flop/turn)
    strategy.ts         recommend(): the decision rules → { action, tone, choice, reason }
    analyze.ts          analyzeSpot(): the one function that combines everything for the UI
    odds.ts             formatPct, outsToEquity (rule of 2 & 4); potOdds() is used by the pot odds guide (the tool computes its own in analyze.ts)
    handPlay.ts         Trainer "Full hand" engine: deal, villain play, pot/stack bookkeeping, showdown
    drills.ts           Trainer single-spot generators (mixed, preflop, call-or-fold, count the outs)
    stats.ts            Trainer stats in localStorage + findLeaks()
    poker.test.ts       Vitest suite for all of the above

  hooks/
    useEquity.ts        Runs the simulation in the worker: debounced, quick pass + full pass,
                        cancels stale work, returns { result, computing, resultKey }

  components/
    Readout.tsx         "The read" (right column): verdict, figures, split, draws, price, threats, math
    OpponentRanges.tsx  Opponents UI (count + per-opponent range) AND the opponent data helpers
    RangeGrid.tsx       13×13 click/drag starting-hand grid (custom ranges)
    Select.tsx          Custom dropdown (native <select> lists can't be styled); keyboard-accessible
    CardPicker.tsx      The 4×13 deck you click to enter cards
    Cards.tsx           <CardFace>: one playing card or empty slot (a button)
    Step.tsx            Numbered section header ("01 Cards")
    Charts.tsx          EquityGauge, PotBar (used); Donut (unused leftover)
    Explain.tsx         <Explain> disclosure, <Formula>, <Term> tooltip
    Link.tsx            <a href> that navigates client-side (router.ts)
    Guide.tsx           Learn-guide frame: breadcrumb, h1, lead, "next in the path", tool links; <Callout>
    RangeChart.tsx      Read-only 13×13 chart (layers: 3-bet / call / raise), used by Starting hands
    TableDiagram.tsx    SVG 6-max table: seats, dealer button, order of action pre/postflop
    Signup.tsx          Email capture: JSON POST to /api/subscribe (honeypot "company")
    Skyline.tsx         Decorative night-city background painted once on a <canvas> (blurred depth layers, bokeh)

  views/                One file per page
    Home.tsx            / — landing page: hero, specimen read, what's inside, how it works, letter, FAQ
    Learn.tsx           /learn — beginner hub (the reading path)
    HandRankings.tsx    /learn/hand-rankings — ten hands, examples, 7-card frequencies, tie rules
    Positions.tsx       /learn/positions — diagram, every seat, open % computed from ranges.ts
    StartingHands.tsx   /learn/starting-hands — preflop charts generated from ranges.ts
    PokerHelper.tsx     /learn/online-poker-helper — catches "poker helper" searches; honest RTA guidance
    PotOdds.tsx         /learn/pot-odds: the price of a call, formula, bet-size → equity-needed chart (odds.potOdds)
    Outs.tsx            /learn/outs: counting outs, common draws, rule of 2 and 4, full outs chart (exact odds)
    Privacy.tsx         /privacy — what's stored (keep true when adding analytics/cookies)
    NotFound.tsx        404 page for unknown URLs
    PlayTool.tsx        "The Table" — the live tool (3-column, one-screen layout)
    Trainer.tsx         Five drills, grading, shot clock, session + all-time stats and leaks
    Strategy.tsx        Static content: the rules the tool applies
    Glossary.tsx        Static content: definitions and formulas
```

Every source file starts with a header comment saying what it does, what uses it and what it
uses. Read the header before reading the code.

---

## How it fits together

### Layers

```
views/  ──►  components/  ──►  poker/
   │              ▲               ▲
   └──► hooks/useEquity ──► poker/equity.worker ──► poker/equity
```

- **poker/** never imports React or anything outside poker/. Keep it that way: it runs inside
  the web worker and in Vitest.
- **components/** are mostly presentational. The exception is `OpponentRanges.tsx`, which also
  exports the opponent model (`OppSetup`, `newOpp`, `oppCombos`, `oppsKey`, `describeOpps`)
  that the Trainer reuses.
- **views/** own the state. `PlayTool` holds the whole live situation; `Trainer` holds the
  current random spot and the stats.

### Data flow on the Table page

```
PlayTool state (hero, board, seat, facing, pot, bet, stack, opps)
   │
   ├─ opps ──► oppCombos() ──► OppRange[] (null = any two cards, else [card,card] combos)
   │
   ├─► useEquity(hero, board, OppRange[], key)
   │       └─ worker: simulate() ×2 (quick 2,500 → full 20,000 iterations)
   │              └─► EquityResult (win/tie/lose, equity, tieShare, beatenBy, impossible?)
   │
   └─► Spot { hero, board, position, facingBet, pot, bet, stack, opponents }
           └─► analyzeSpot(spot, result) ──► Analysis
                    ├─ pot odds, call capped at stack, all-in, SPR
                    ├─ analyzeDraws()  (outs, draws, hit chances)
                    ├─ implied odds    (only when a draw is short of the price)
                    └─ recommend()     ──► Recommendation { action, tone, choice, reason }
                                   │
                                   ▼
                    <Readout spot a={analysis} result />
```

`key` is a string built from the inputs (cards + `oppsKey(opps)`), so recomputes happen exactly
when the situation changes; array identity doesn't matter.

### The Trainer

Five drills, chosen in the bar at the top of the page:

| Drill | Source | Graded against |
|---|---|---|
| Full hand (default) | `handPlay.dealHand` / `applyChoice` | `reco.choice` on every street |
| Mixed | `drills.randomSpot()` | `reco.choice` |
| Preflop | `randomSpot({ street: 0 })` | `reco.choice` (seat charts) |
| Call or fold | `randomSpot({ street: 1–3, facing: true })` | the pure price: equity ≥ needed → call |
| Count the outs | `drills.outsSpot()` | `analysis.draws.outs.length` (typed number) |

Every question becomes a `Question { key, mode, spot, oppPresets, story, kind }` and runs the
same `useEquity` → `analyzeSpot` pipeline as the Table. Answers unlock only when the **full**
pass for that exact key has landed (`resultKey === key && !computing`). `grade()` in
Trainer.tsx accepts either call or fold when equity is within 3% of the price ("close call")
and reports the average value of calling (`EV = equity × final pot − call`).

**Full hand.** `dealHand()` picks a seat, your cards, the villain's real cards (from the opener's
range, or BB defend if you're first in) and the whole runout up front. `applyChoice(hand, choice)`
does the bookkeeping (`pot` = pot before the bet you face; `invested` / `stack` are yours), lets
the villain respond (they continue with a pair or better using a hole card, or 8+ outs; they bet
more often when strong), deals the next street and its action, and ends with a fold or a
showdown (`over.heroNet` in bb). Each street is graded separately; the result screen shows the
villain's cards and the net result ("luck included").

**Shot clock.** Off / 20s / 10s; at zero the answer becomes fold (or check) and is marked wrong.

**Stats.** `recordDecision` stores the last 200 decisions with mode, facing, ok, close and
timedOut; `findLeaks` groups them by spot type (e.g. "Turn · facing a bet") and returns the
weakest (4+ tries, under 75%). Session totals (accuracy, net bb over full hands) live in memory.
The right column shows stats and leaks while you decide, then the Readout after you answer.

---

## Key concepts and rules

**Cards and scores.** A card is an int: `rank = c >> 2` (0 = 2 … 12 = A), `suit = c & 3`
(c, d, h, s). `evaluate5/7` return a packed base-15 integer: category first, then tie-breakers;
`categoryOf(score)` gives 0 (high card) … 8 (straight flush).

**Equity.** `simulate()` deals ranged opponents first (random combo, rejection-sampled against
cards already used), then random opponents, then the rest of the board. Ties pay
`1 / (number of players tied)` and add up into `tieShare`. `equity = (wins + tieShare) / n`.
A range with no possible hands returns `impossible` (shown as an error in the Readout).

**Ranges.** Notation: `22+`, `ATs+`, `AQo+`, `JJ-99`, `AJs-A9s`. `RFI_TOKENS` holds the
opening ranges and `VS_RAISE_TOKENS` the 3-bet / call ranges per seat (simplified, 6-max).
The big blind uses the wider `BB_VS_LATE_TOKENS` when the raiser is CO, BTN or SB. The raiser is
`Spot.raiser` → `RecoInput.raiser`, set by PlayTool and the Trainer through `raiserFromPresets()`
when there is one opponent on a seat's opening range ("BTN open"); unknown raiser = tight chart.
`OPP_PRESETS` are the dropdown choices for opponents.

**Seats and table size.** In `PlayTool`, the number of opponents also sets the table size:
`seatsFor(players)` gives heads-up = BTN/BB, 3 = BTN/SB/BB, 4 = CO/BTN/SB/BB, 5 = +MP,
6+ = all six. Seats are named by how many players act after you, so the 6-max charts work for
shorter tables. "Next hand" (or `N`) rotates the seat like the button moves
(BTN → CO → MP → UTG → BB → SB), skipping seats that don't exist.

**Action.** `facingBet` comes from the "Action" switch (Unopened / Facing a raise preflop,
Checked to you / Facing a bet postflop). A new street resets it to not facing. Preflop
decisions come from the seat charts; postflop decisions compare equity to a fair share
(1 ÷ players) and to the price, plus made hand, outs, SPR (≤ 2.5 = committed) and implied odds
(assumes you can win about half of what's left behind).

**Recommendation fields.** `choice` is what the Trainer grades; `tone`
(aggressive / call / passive / fold) picks the verdict colour; `action` and `reason` are the
displayed text.

**Card entry on the Table.** Three ways, all writing into the same `hero` / `board` slots:
the CardPicker deck (fills the active slot, then advances to the next empty one), the
quick-entry text box (re-parses the whole string on each keystroke), and hotkeys (rank then
suit). Other shortcuts: `Backspace` undo, `B` toggle facing a bet, `←` `→` seat, `N` next hand.
Hotkeys are ignored while focus is in an input or select.

---

## The website layer

- **Routes** are listed once in `src/seo.ts` (`/`, `/table`, `/trainer`, `/strategy`, `/glossary`,
  `/privacy`). To add a page: add the route there, a case in `App.tsx`'s `<Page>`, and the view.
- **Navigation** uses `<Link to>` / `navigate()` from `router.ts` (History API). Pages remount
  on route change (`<main key={page}>`). `App` updates `document.title` and the description.
- **Prerender.** `npm run build` renders every `prerender: true` route to HTML via
  `entry-server.tsx` and writes `dist/<route>.html` (no trailing-slash redirect on Cloudflare) with that route's title, description,
  Open Graph tags and canonical URL. The Trainer is random on every load, so it ships as an
  empty shell with meta. The browser then mounts with `createRoot` (replacing the static
  markup; no hydration), so components must not touch `window` during render, only in
  effects (the Dateline fills in after mount for this reason).
- **Hosting.** Cloudflare Pages, connected to the GitHub repo (fregam/llamapoker): every push
  to `main` runs `npm run build` and publishes `dist/`. Planned later move: a Hetzner VPS
  (static files behind Caddy); the build output is plain files, so nothing in the app changes.
- **Site URL.** Canonical links and `sitemap.xml` use https://llamapoker.com (default in
  `scripts/prerender.mjs`); override with `SITE_URL`, or `SITE_URL=""` to skip them.
- **Unknown URLs** get `dist/404.html` (the app shell), which Cloudflare Pages serves with a 404
  status; it renders `NotFound`.
- **Email signup** (`components/Signup.tsx` → `functions/api/subscribe.ts`): JSON POST to
  `/api/subscribe`; the function adds the address to Beehiiv with `BEEHIIV_API_KEY` and
  `BEEHIIV_PUBLICATION_ID` (set in the Cloudflare dashboard, never in the repo). Until those are
  set it returns 503 and the form shows an error. In `npm run dev` the form only logs.
### Search strategy (who we're found by)

The core persona is a **beginner**: knows how a hand is dealt, doesn't know positions or pot
odds yet, and searches things like "poker odds calculator", "should I call", "poker positions
explained", "starting hands chart", "hand rankings", "online poker helper", "live poker tool".
Each of those intents has a page whose `<title>`, description and `<h1>` use those words
(see `seo.ts`). Guides link to each other (`LEARN_PATH`, "Next in the path") and to the tools; the
colophon links the main pages from everywhere. Structured data: WebSite + FAQPage (home),
WebApplication (Table, Trainer), Article + BreadcrumbList (guides). The guides' charts and
percentages are generated from `poker/ranges.ts`, so content and tool can never disagree.
The Table helps beginners in place: seat buttons show full names on hover, a "What's this?"
link next to the seat, and a three-step "New here?" guide in the empty readout.
---

## Styling

One global `styles.css`, plain class names, no CSS modules or framework. The look is
"editorial": ink background, ivory text, hairline rules, Bodoni Moda for headlines and big
numbers, Inter for UI and paragraphs. Colour only carries meaning: sage = good,
brass = neutral, vermilion = danger. Small text in Bodoni is hard to read on black, so
paragraphs and captions use Inter. The "Cockpit" section near the end of the file holds the
one-screen, three-column Table layout and its breakpoints (2 columns under 1180px, 1 under
960px).

---

## Things to keep in sync

- `views/Strategy.tsx` (last section) describes the rules in `strategy.ts`; `views/Glossary.tsx`
  describes the formulas. Update them when the logic changes.
- The header comment in each file and this overview, when files are added, moved or rewired.
- `README.md` is the user-facing description of features and shortcuts.

Known leftover: `Donut` in `Charts.tsx` is unused.
Known simplifications: heads-up uses the 6-max BTN range; 7–9 player tables reuse the six
seat names; opponent ranges don't narrow based on their later betting.
