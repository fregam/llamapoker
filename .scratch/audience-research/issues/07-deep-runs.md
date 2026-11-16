# 07 Deep runs to saturation

Status: resolved
Type: task
Blocked by: 06

One agent per source, batches, original + English, tagged with the codebook. BERTopic counts new
themes per batch; stop after three batches with almost none.

## Method change (2026-11-15)

Collection is done in code, wide (every item of the last 12 months per source), not by agents reading
samples. Saturation applies to the reading stage: topics are found in code over the whole corpus, and
agents read per topic in batches until new batches add nothing. Different people saying the same thing
are never merged: counts of items, authors and sources per topic are the finding.

## Answer (2026-11-16)

23 readers (16 themes, 6 languages, 1 check of unplaced items) read 31,000 items in batches of 150
dealt by `pipeline/batch.py`, and recorded 1,379 claims in `data/read/<KEY>/findings.json`
(git-ignored). Five hit the 12-batch cap before settling. Limits are in `study.md`.
