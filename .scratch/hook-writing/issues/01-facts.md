# 01 Fact sheet from the engine

Status: ready-for-agent
Type: task

`apps/reels/scripts/hooks/facts` (TypeScript, imports `apps/web/src/poker/`). No app has a TS
runner yet: first see whether Node runs the engine with type stripping; if its imports block that,
add `tsx` as a dev dependency of `apps/reels`. Don't change `apps/web` (e.g. to add a seed).

`facts <topic>` writes `content/hooks/<run>/<topic>/facts.json`: a list of
`{ id, claim, value, unit, how }`. `claim` states the conditions in full ("AA vs four random
hands, preflop all-in to the river"), because the critic checks a hook's claim against it; `how`
names the function and iterations. `equityVsRandom` has no seed, so the committed `facts.json` is
the fixed source and the iterations are high enough that the rounded value doesn't move.

Topics for the test:
- `premium-only`: reuse reel 002's formula (`apps/reels/src/reels/OnlyAces.tsx:30`): premium =
  AA, KK, QQ, AK (34 of 1,326 combos, one every ~39 hands); 6-max blinds cost 1.5 bb per 6 hands,
  so ~10 bb per wait.
- `aces-win`: AA vs 1, 2, 3, 4 random hands, preflop to the river; how often AA loses at least
  once in 10 / 20 heads-up all-ins.
- `draw-hits`: flop flush draw by the turn and by the river; open-ended straight draw; rule of 2
  and 4 vs exact.

Tests first: each fact matches known values (AA vs 1 random ≈ 85 %, flush draw flop→river ≈ 35 %)
within a stated tolerance.
