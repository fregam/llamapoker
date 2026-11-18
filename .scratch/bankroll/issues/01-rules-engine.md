# 01 The rules engine

Status: done (2026-11-19, branch feat/bankroll)

`apps/web/src/poker/bankroll.ts`, pure and tested: the buy-in table, the stake ladders (cash
blinds, tournament buy-ins), money parsing and formatting in whole cents, and `advise(bankroll,
format, risk)` → the stake to play, buy-ins held at it, the move-up line and the move-down line.

## Done when

- [x] A bankroll under the lowest stake returns no stake and what the lowest one needs.
- [x] The top of the ladder has no move-up line; the bottom has no stake to move down to.
- [x] Exactly on a line counts as rolled for that stake.
- [x] `npm test` and `npx tsc --noEmit` are green.
