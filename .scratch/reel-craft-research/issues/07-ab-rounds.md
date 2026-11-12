# 07 A/B rounds

Status: in progress (round 1 published, waiting for picks)
Blocked by: 04, 05
Spec: ../spec.md (Plan 2)

Each round: take the next 3–4 items from the ranked list, build each as a one-change variant of the
current baseline on both bench scenes, render, publish to the review page, read the picks and notes.
The winner becomes the baseline. Founder judges on studio monitors. Sources in
`media/tests/2026-11-12_motion-ab/round-NN/` with a manifest; one line per round in the research doc
(variants, pick, note).

Stop when all variants of a round lose to the baseline, or the list runs out. Then a confirmation
round: all winners stacked vs the old 002 v9.

**Done when:** the confirmation round is picked.

## Comments

- 2026-11-12: rounds 1-5 run (see research doc). Paused by the founder: production order is script -> motion -> sound, so next is a full motion rebuild of 002 in the host + draw-on direction, then the sound round on the finished cut.
