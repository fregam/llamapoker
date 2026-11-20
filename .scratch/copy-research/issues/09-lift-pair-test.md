# 09 Lift and the blind pair test

Status: ready-for-agent
Type: task
Blocked by: 04, 08

Reuse `apps/reels/scripts/hooks/lift.py` and `pairtest.py`. Lift per tag and per machine measure,
per scoreboard, with counts and an interval; nothing is called on fewer than 8 winners (so most
pilot rows will read "too few"). Blind pair test: fresh agents guess the winner of pairs they have
not seen; report the score against 50% and what the confident correct picks had in common.
At 50 pairs the pair test only proves the chain runs; say so. Report the poker and gambling-maths
cut separately when it has enough pages (in the pilot it will not).
