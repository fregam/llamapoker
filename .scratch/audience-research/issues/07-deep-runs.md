# 07 Deep runs to saturation

Status: ready-for-agent
Type: task
Blocked by: 06

One agent per source, batches, original + English, tagged with the codebook. BERTopic counts new
themes per batch; stop after three batches with almost none.

## Method change (2026-11-15)

Collection is done in code, wide (every item of the last 12 months per source), not by agents reading
samples. Saturation applies to the reading stage: topics are found in code over the whole corpus, and
agents read per topic in batches until new batches add nothing. Different people saying the same thing
are never merged: counts of items, authors and sources per topic are the finding.
