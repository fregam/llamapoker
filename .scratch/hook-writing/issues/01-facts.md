# 01 Fact sheet from the engine

Status: ready-for-agent
Type: task

`apps/reels/scripts/hooks/facts` (TypeScript, imports `apps/web/src/poker/`; run with the repo's
existing TS runner). `facts <topic>` writes `content/hooks/<run>/<topic>/facts.json`: a list of
`{ id, claim, value, unit, how }`, where `how` says how it was computed (function, iterations,
seed). Deterministic: a fixed seed and enough iterations that the rounded value doesn't move.

Topics for the test:
- `premium-only`: the cost in big blinds of folding everything but premium hands over N orbits
  (blinds paid vs the hands played); the share of hands that are premium.
- `aces-lose`: AA vs 1, 2, 3, 4 random hands, preflop to the river; how often AA loses at least
  once in 10 / 20 hands.
- `draw-hits`: flop flush draw by the turn and by the river; open-ended straight draw; rule of 2
  and 4 vs exact.

Tests first: each fact matches known values (AA vs 1 random ≈ 85 %, flush draw flop→river ≈ 35 %)
within a stated tolerance.
