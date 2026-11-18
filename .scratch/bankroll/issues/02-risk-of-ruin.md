# 02 Risk of ruin, cash and tournaments

Status: ready-for-agent
Blocked by: 01

In `poker/bankroll.ts`: `cashRuin` (closed form), `bankrollForRuin` (its inverse), and
`tournamentRuin` (seeded simulation over the payout model in the spec, decision 11).

## Done when

- [ ] The published example holds: 2 bb/100, SD 90, 5% → about 61 buy-ins.
- [ ] A win rate of zero or less returns 1.
- [ ] The closed form agrees with a seeded random-walk simulation within a stated tolerance.
- [ ] The tournament payout sums to the prize pool, and the simulated mean result matches the ROI.
- [ ] Same seed, same answer; more buy-ins never raises the risk. Time one call and note it here.
