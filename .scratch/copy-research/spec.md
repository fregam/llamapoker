# Spec: copy research (what the best writing does, from evidence)

Status: ready-for-agent
Grilled with the founder 2026-11-19 (eleven questions, one at a time). The model is the hook
dissection (`.scratch/hook-dissection/spec.md`): measured winners, blind tagging, lift, a playbook,
a goal-first skill and a calibrated critic. This parks the script-stage grill for reels.

## Goal

The site's guides (`/learn/*`, `/strategy`, `/glossary`) rank on page one for the 18 approved
searches (`apps/seo/targets.json`) and keep a beginner reading through to the tool. The research
exists to change what gets written there. The conversion text (home, `/table`, `/trainer`, the
signup box) is a second pass over the same collection. The letter waits until it has readers.

## Decisions

1. **Best = measured, from every subject.** No topic filter ("the best from everywhere"). English
   only. Poker pages are a cut of the results, not a limit on the collection.
2. **Five scoreboards**, each with its own top-versus-ordinary pairs, never pooled:
   - Search: pages real searchers clicked (ORCAS), checked against fresh results.
   - Reader votes: Stack Exchange, Reddit, Hacker News.
   - Returning readers: newsletters and essays (Substack and similar).
   - Money: ads that kept running, published split tests. Collected now, analysed in the second
     pass (conversion text).
   - Editors: Wikipedia featured and good articles.
   A finding that holds on several scoreboards counts for more than one that holds on one.
3. **Proven writers only, not lucky ones.** A writer or site qualifies by repeat wins on its
   scoreboard (many different searches won, many top-voted answers, sustained growth, long-running
   ads). One-hit pages are dropped. The founder may strike any name from the list.
4. **Two kinds of pairs.** Between writers: a proven writer's page beside an ordinary writer's
   page on the same question. Within a writer: their best piece beside their own ordinary piece.
5. **Which source wins.** Controlled experiments (published split tests, reading studies) and our
   own pairs are the judges. Top-ranked pages show the current standard. Famous copywriters and
   practitioner-teachers supply techniques to test; a technique stays in the playbook only if the
   measured sources back it or at least do not contradict it.
6. **Hard limits above everything:** the brand voice (`brand/README.md`), the study-tool
   positioning, the responsible-gambling rules, and truth. What the research finds is craft
   guidance a writer may break when the result is better (memory `agent-objective-not-rules`).
7. **Size.** Wide layer about 1,000,000 pages measured by scripts. Deep layer about 5,000 pairs
   (10,000 pages) blind-tagged by agents. Canon 600 to 1,000 sources. Saturation (do new batches
   still move the lift table?) is reported per batch and does not stop the run; the founder may.
8. **A 1% pilot first**, through the whole chain: 10,000 pages, 50 pairs tagged twice, 20 canon
   sources, a rough lift table and a blind pair test. The pilot's pages count toward the total.
   The full run starts only on the founder's yes to the pilot report.
9. **Free first.** The pilot spends nothing. A paid service appears as an exact quote in the pilot
   report and needs a yes.
10. **Plan usage.** Reader agents may use three quarters of the Claude 5-hour window, at most 10 at
    once, started through the wall's `job` launcher. No batch starts in the hours before the weekly
    SEO run.
11. **Storage.** Everything on `E:` inside the repo, git-ignored; caches and temp folders too
    (memory `heavy-data-on-hdd`). The repo is public: collected pages never enter git, only
    findings do.

## Sources (found 2026-11-19 by web search; each is verified in its ticket, none is tested yet)

| Need | Source | Note |
|---|---|---|
| Queries and the pages people clicked | ORCAS (Microsoft, free download) | Read on its page 2026-11-19: 10,405,342 queries, 18,823,602 query-to-page rows over 1.4M documents. A row is a pair (`qid, query, did, url`): **no click count, and every row is a win**. Dates of the logs are not stated (paper: 2020). "Non-commercial research purposes only": tag NC. |
| Pages that were candidates but not clicked | ORCAS top-100 file (10.7 GB, 983M rows) | For each query, 100 documents a simple retrieval system (Indri) found. A candidate that was never clicked is the "ordinary" page of a pair. This is a weak loser: not clicked may only mean Bing never showed it. Say so wherever search pairs are reported. |
| Text of those pages | MS MARCO documents (`msmarco-docs.tsv`, 22 GB, 3,213,835 rows: docid, url, title, body) | The page does not say whether the body keeps structure. If it is flat text, headings, lists, tables and images come from Common Crawl snapshots of 2019 to 2020, not the latest crawl. |
| Page text | Common Crawl | Fetch by index and byte range; no visits to the sites. |
| Site strength | Common Crawl web graph (host and domain ranks), Tranco list | Free downloads. Open PageRank needs a key; not needed. |
| Fresh search results | SearXNG or OpenSERP run on this PC | No login. Expect blocking at volume; the pilot measures it. |
| Reader votes | Stack Exchange data dump or API, Reddit, Hacker News API | `apps/research` on branch `research/reel-craft` has a Reddit collector to lift. |
| Editors | Wikipedia featured and good article lists | |
| Newsletters, ads | Substack leaderboards; ad libraries; published split-test archives | Sources chosen in ticket 05. |

Not usable: Google's Custom Search API (closed to new customers, ends 2027-01-01). Free tiers of
paid search services (about 9,000 searches in total, with sign-up) are a fallback for the pilot only.

## Method

1. **Collect** (code): load each scoreboard into one SQLite store with the page, its writer or
   site, and its score.
2. **Qualify** (code): per scoreboard, compute repeat wins per writer or site; keep the proven
   ones. Proven must not mean big: for search, a site is scored by how often it was clicked out of
   the times it was a candidate (its win rate), compared within bands of site strength, never by
   its raw number of clicked queries.
   **Pilot bound:** 10,000 pages in total across the five scoreboards, sampled after qualifying;
   no ticket fetches or measures beyond its share until the full run is approved.
3. **Text** (code): fetch each kept page, strip menus, banners and comments, and check the
   extraction on a hand-read sample before anything is measured.
4. **Measure the wide layer** (code): length, reading level, sentence and paragraph length, where
   the answer first appears, headings, lists, tables, examples, images, questions, second person.
5. **Canon** (agents): each source read into claims; each claim becomes a tag for the readers or a
   countable measure. The claim keeps its source and whether it rests on an experiment or on
   reputation.
6. **Taxonomy and blind tags** (agents): as in the hook study. Readers never know which page of a
   pair won. Two independent taxonomies merged; in the pilot every page is tagged twice; a tag
   below about 70% agreement is reported as unreliable, not as a finding.
7. **Lift** (code): per tag and per measure, how much more often it appears in winners than in
   their pair, per scoreboard, with counts and an interval.
8. **Blind pair test** (agents): fresh agents guess the winner of unseen pairs; the score says how
   much of winning is visible in the writing at all. At the pilot's 50 pairs it only proves the
   chain runs; it cannot tell 57% from chance.
   **Poker cut:** lift and the pair test are also reported for poker and gambling-maths pages
   alone, once there are enough of them.
9. **Write up**: playbook, skill, critic, then the live proof.

## Where it lives

- Code: `apps/copy/` (Python, tests first on the pure parts, a README in the shape of the other
  apps). Reuse `apps/reels/scripts/hooks/` (`lift.py`, `blind.py`, `pairtest.py`, `calibrate.py`)
  and lift collectors from `apps/research` rather than rewrite them.
- Data: `apps/copy/data/` (git-ignored): the store, raw downloads, page text, caches.
- Findings: `content/research/copy/` (`playbook.md`, `taxonomy.md`, `lift.md`, `writers.md`,
  `canon.md`, `pilot.md`).
- Wall: a `copy` station under CONTENT; every collection and reader batch runs through `job`; its
  failures raise threats. Nothing ships without this (the wall's rule).

## Outputs

1. `content/research/copy/playbook.md`: what the evidence says, the tags, the lift table, the pair
   test, and which famous advice the data did not back.
2. A guide-writing skill (`.claude/skills/guide-writing/`): goal first, hard limits, craft guidance.
3. A critic calibrated on real winning pages, anchored to the best work so far.
4. Live proof: two or three existing guides rewritten through the skill, each beating its old
   version in a blind pair test before it ships, then watched in the weekly SEO score. The other
   guides follow only if those move.

## Done when

- Pilot: tickets 01 to 11 closed and the founder has answered the pilot report.
- Full run: the three layers are at size, the playbook is written and read by the founder, the
  skill and critic exist, and the rewritten guides have shipped with their before-and-after record.

## Out of scope

- Other languages. The letter. Rewriting the conversion text (second pass, its own spec).
- Reel scripts (the parked script-stage grill).
