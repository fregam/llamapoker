# 06 The blind read and the verdict

Status: ready-for-human
Type: task
Blocked by: 05

A private review page (Artifact, shared-db capability, brand-neutral is fine): one topic at a time,
the 10 lines unlabelled; the founder picks a top 3 and strikes any they'd never post; saving reveals
research vs control for that topic.

Claude then reads the picks, scores them against the spec's rule (research ≥ 2 of top 3 in ≥ 2 of 3
topics, no more strikes), and writes `verdict.md` in the test folder plus an entry in
`docs/decisions.md`. Win → open the pack-rerun ticket; lose or tie → read the strikes and the
failure log with the founder before more is built.
