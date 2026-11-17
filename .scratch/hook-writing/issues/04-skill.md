# 04 The hook-writing skill

Status: ready-for-agent
Type: task

`.claude/skills/hook-writing/SKILL.md` plus two briefs, written with the `writing-for-agents` skill:

- **SKILL.md:** what a hook is here (the spoken line), the ladder with Sky Tan's sleep example, the
  ten categories as vocabulary, the length rule, where helping ends, the brand voice pointer
  (`brand/README.md`), and the run order: facts → evidence → writer → check → critic → best 5.
- **writer.md:** inputs by path (facts, evidence or none, the neutral topic line), ~20 drafts
  climbing the ladder across varied categories, the record per hook (promise, promise word,
  fact ids, open question, rung, quote ids), use the viewer's words from the evidence where
  they're better than ours.
- **critic.md:** checks 1b and 4–9 from the spec, one verdict and a one-line reason per check, then
  a rank of the passing hooks; the best 5 go forward. The critic never rewrites, never sees the
  evidence file or the arm, and gets drafts with `quote_ids` stripped.
- **Calibration:** `calibration.json` holds the spec's known cases (002's hook, Sky Tan's 2/10 and
  10/10, the grill's give-away example) with expected verdicts. Run the critic on them and fix
  the brief until every case lands, before ticket 05.

Blocked by nothing, but the briefs name the files 01–03 write, so keep the names in step.
