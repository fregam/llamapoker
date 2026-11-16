# 08 Synthesis: pack, topics, quotes, study

Status: ready-for-human
Type: task
Blocked by: 03, 07

Apply the two-source-types rule, then write `content/research/audience/` pack.md, topics.md,
quotes.md, study.md. Check passes. Founder reads study.md. Phase 1 done.

Each `topics.md` entry also carries **what they already tried** (a fix, tool, habit or belief the
viewer used and gave up on): the hook writer's villain rung. It cites quote ids like every other
field; with no quote behind it, the field stays empty. It lives in `topics.md`, not `pack.md`, so
the pack's budget is unchanged. (Founder, 2026-11-15.)

## Answer (2026-11-16)

`content/research/audience/`: `pack.md` (about 1,570 of 2,500 tokens), `topics.md` (22 entries, two
of them leads), `quotes.md` (105 verified quotes), `study.md`, `findings.json` (30 findings, 5
leads). Written from `apps/research/findings.json` by `pipeline/synth.py`. The check passes.
Open: the founder reads `study.md`; about 290,000 late r/poker comments are not loaded; Spanish /
Latin America has no finding of its own.

After review (2026-11-16): beliefs are tagged myth / can't verify / half-true (a script never says an
app is fair or rigged); `tried` cells cite a quote or stay empty and the check enforces it; quote ids
are sticky across reruns; `claims.md` keeps every claim two or more readers made; `study.md` has a
question-by-question table: 11 of 14 questions meet the two-source-types bar ("what they tried",
"trigger moments" and part of "who they follow" do not), and there is no US section.
