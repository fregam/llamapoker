# 02 Risk of ruin, cash and tournaments

Status: done (2026-11-19, branch feat/bankroll)
Blocked by: 01

In `poker/bankroll.ts`: `cashRuin` (closed form), `bankrollForRuin` (its inverse), and
`tournamentRuin` (seeded simulation over the payout model in the spec, decision 11).

## Done when

- [x] The published example holds: 2 bb/100, SD 90, 5% → about 61 buy-ins.
- [x] A win rate of zero or less returns 1.
- [x] The closed form agrees with a seeded random-walk simulation within a stated tolerance.
- [x] The tournament payout sums to the prize pool, and the simulated mean result matches the ROI.
- [x] Same seed, same answer; more buy-ins never raises the risk. Time one call and note it here.

## Comments

2026-11-19: timed in Vitest on the dev PC: one `tournamentRuin` call (2,000 players, 1,000
tournaments each) takes about 17 ms for a 100-player field and 11 ms for 1,000. No worker.
After review: each simulated player has their own seeded stream, so the risk can never rise
with one more buy-in (tested from 99 to 140).
