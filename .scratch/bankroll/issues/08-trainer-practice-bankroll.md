# 08 Part C: a practice bankroll in the Trainer

Status: done (2026-11-19, branch feat/bankroll-practice, stacked on feat/bankroll)
Blocked by: 01

Own pull request, stacked on A and B. The full-hand drill keeps a play-money bankroll across
visits; the stake follows the same rule as the calculator, so moving up and down is practised
with nothing at risk. The three open choices (starting bankroll, what a bust does, chosen or
assigned stake) were decided by Claude on the founder's word and are listed in the spec,
decisions 17 to 21, to overrule.

## Done when

- [x] `poker/practice.ts`, pure and tested: a hand's big blinds become play money at the stake
      played; the lines equal the calculator's; moving up needs the line; forced drop and bust.
- [x] The Trainer's side column shows it in the Full hand drill; the hand result says what the
      hand did to it; it survives a reload.
- [x] The Trainer's written guide, the privacy page, `overview.md` and `README.md` say so.

## Comments

2026-11-19: checked in Chrome on the dev server: a fresh $100; "Move up" at $150 and the move;
a +3 bb hand at $0.02/$0.05 added $0.15 and was stored; under the line (seeded at $140) shows
the vermilion note and "Move down" works. Not played out by hand: a forced drop and a bust
(both covered by the unit tests).
