# Poker Odds — live table tool

A single-screen tool you use while you play Texas Hold'em. Set your **position**, your **hand**,
and the **flop / turn / river** as they come out — odds, threats and the call/fold verdict update
automatically. Built with React + Vite + TypeScript; all math runs locally in the browser.

## Run it

```bash
npm install
npm run dev
```

Then open the printed URL (default http://localhost:5173).

Build a static bundle with `npm run build` (output in `dist/`), preview it with `npm run preview`.

## How you use it

Left side — **the situation**:
- **Position** — one tap (UTG → SB). Shows whether your hand is in that seat's opening range.
- **Opponents** — a +/- stepper.
- **Your hand** + **Board** — click a slot, click a card. Slots auto-advance; click a card to
  remove it. Each board slot is ticked Flop / Turn / River. Leave the board empty for preflop.
- **Pot** and **Bet to call** for the pot-odds verdict.

There's a **Deal flop / turn / river** button to run the board out one street at a time with
random cards, and **Strategy** and **Glossary** pages in the header.

Right side — **the read** (recomputes automatically, no buttons):
- **Recommended move** — a single action (open-raise, 3-bet, value bet, semi-bluff, call,
  pot-control check, or fold) chosen from your street, position, equity, made hand and pot odds,
  with a one-line reason. The full logic is on the Strategy page.
- **Equity donut** — your win / tie / lose %, with what you currently have (e.g. "Two Pair").
- **Pot odds** — a CALL / FOLD pill, a bar showing what you risk vs. what you can win, and a gauge
  placing your equity against the break-even line.
- **What beats you** — the hands the winning opponent showed down when you lost, so you know which
  cards to fear.
- **Show the math** — one collapsible with every formula filled in with your live numbers.

## How the math works

- `src/poker/evaluator.ts` — 5/7-card hand evaluator (each hand → one comparable integer).
- `src/poker/equity.ts` — Monte Carlo equity, validated against known spots (AA vs one random ≈ 85%).
- `src/poker/ranges.ts` — preflop notation, the 169-hand grid, and 6-max opening ranges per seat.
- `src/poker/odds.ts` — pot odds and the outs-to-equity rule.

Accessibility: every card and control has a screen-reader label (e.g. "Ace of spades"), the readout
updates via `aria-live`, the math disclosure is keyboard-operable, and all controls have a visible
focus ring. Equities are statistical estimates — a study aid, not real-money advice.
