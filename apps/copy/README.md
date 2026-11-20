# apps/copy: the copy research

What the best writing does, from measured winners. Spec and tickets: `.scratch/copy-research/`.
Findings go to `content/research/copy/`. The goal is better guides on llamapoker.com, judged by
the weekly SEO score.

## Rules

- **Data stays local and on `E:`.** Everything under `data/` is git-ignored: the store, the raw
  downloads, page text, logs. The repo is public and the data is licensed for non-commercial
  research only (NC), so only findings are committed.
- **Pilot first.** 10,000 pages, 50 pairs, 20 canon sources. Nothing runs at full size before the
  founder's yes to the pilot report (ticket 11).
- **Readers** (agents) run through the wall's `job` launcher, at most 10 at once, up to three
  quarters of the Claude 5-hour window, never in the hours before the weekly SEO run.

## Run

From `apps/copy/`:

```bash
python -m unittest -q              # tests for the pure parts
python store.py fetch small        # click file, queries, document lookup (about 475 MB)
python store.py fetch candidates   # top-100 candidates (10.7 GB)
python store.py fetch docs         # MS MARCO documents (22 GB)
python store.py load               # click file into data/copy.sqlite
python store.py summary
```

Downloads resume from a `.part` file and print each file's md5 beside the published one.

## The store (`data/copy.sqlite`)

| Table | Holds |
|---|---|
| `queries` | id, text |
| `pages` | doc, url, site, scoreboard, score, text_path, kept |
| `clicks` | query, doc: this page was clicked for this query |
| `candidates` | query, doc, rank: this page was a top-100 candidate (pilot queries only) |
| `writers` | site or author, scoreboard, wins, shown, proven |

`site` is the host without `www.`; it is not yet reduced to the registrable domain
(`en.wikipedia.org` and `de.wikipedia.org` are two sites). Ticket 02 decides whether that matters.

## Sources

Base URL for every file: `https://msmarco-gkbqakfehxgtezgg.b01.azurefd.net/msmarcoranking/`.
Read from <https://microsoft.github.io/msmarco/ORCAS.html> on 2026-11-19.

| File | Rows | What a row is | md5 |
|---|---|---|---|
| `orcas.tsv.gz` | 18,823,602 | qid, query, did, url: a clicked pair. No click count. | `4b9350bf997c5c0eaa562be81c796981` (checked) |
| `orcas-doctrain-queries.tsv.gz` | 10,405,342 | qid, query | `519c5f522294406e3b0574d7d53cf233` (checked) |
| `orcas-doctrain-top100.gz` | 982,951,086 | qid, Q0, docid, rank, score, run: 100 candidates per query from a simple retrieval system | `118d0884638fd405e111157a124ef0b2` |
| `msmarco-docs.tsv.gz` | 3,213,835 | docid, url, title, body | none published |
| `msmarco-docs-lookup.tsv.gz` | 3,213,835 | docid, offset_trec, offset_tsv | none published |

Terms, quoted from the page: "intended for non-commercial research purposes only".

**Known weaknesses of this scoreboard**

- Every row is a win and there is no count. Losers are candidates that were never clicked, which
  may only mean the search engine never showed them.
- The logs' dates are not stated on the page (the paper is from 2020). Ticket 06 checks which
  winners still win today.

## Still to record here (ticket 01)

- Whether the document body is flat text or keeps headings, lists and tables.
- Row counts after loading, and the share of candidates never clicked for any query.
