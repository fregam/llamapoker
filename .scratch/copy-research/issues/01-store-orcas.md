# 01 Store and the click data

Status: ready-for-agent
Type: task

`apps/copy/` with a README and a git-ignored SQLite store at `apps/copy/data/copy.sqlite`:
`pages` (url, site, scoreboard, score, text_path, kept), `queries` (id, text), `clicks` (query,
doc), `candidates` (query, doc, rank), `writers` (site or author, scoreboard, wins, shown, proven).

Download into `apps/copy/data/raw/orcas/` (URLs and md5 sums in the README; check each sum):
`orcas.tsv.gz` (330 MB, 18,823,602 rows: qid, query, did, url), `orcas-doctrain-queries.tsv.gz`
(104 MB), `orcas-doctrain-top100.gz` (10.7 GB, 983M rows: the candidates), and the MS MARCO
documents `msmarco-docs.tsv.gz` (22 GB: docid, url, title, body) with its lookup file.

Facts already read from the dataset page (2026-11-19): no click count, a row is a pair; licence
"non-commercial research purposes only" (tag NC). Still to verify and record in the README: whether
the document body is flat text or keeps headings, lists and tables; the real row counts after
loading; what share of top-100 candidates were never clicked for any query.

The candidates file is too large to load whole: stream it and keep per-site counts (times a
candidate, times clicked) plus the rows for the pilot's sampled queries only. Tests first on the
pure parts (URL to site, row parsing, the streaming counter). Everything on `E:`.
