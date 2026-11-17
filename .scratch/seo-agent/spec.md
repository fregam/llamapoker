# Spec: the SEO agent

Status: ready-for-agent (the open question was answered 2026-11-17: the founder's real name)
Founder's brief, 2026-11-17: "the goal for the SEO agent is to have our site be continuously
highly ranked"; then: "first page on Google in the shortest amount of time possible and I want it
to stay there"; "do the necessary for it to be able to run unattended". Four reference reels,
checked against Google's docs in `docs/research/2026-11-17-seo-reference-reels.md`.

## The goal (the agent's whole brief)

llamapoker.com is on Google's first page for every search in `apps/seo/targets.json`, reached as
fast as honest work allows, and it stays there. The agent is given this goal and its
instruments, not a checklist: each week it reads the score, decides what would move it most, does
that, and next week checks whether it did.

## The score

Read weekly from Search Console by `apps/seo/scripts/scoreboard.mjs`, kept as
`content/seo/scoreboard/<date>.json`:

1. **Page one:** target searches with an average position of 10 or better on at least 10
   impressions in the 28 days (of 18).
2. **Indexed:** sitemap pages in Google's index (of 13).

Indexed comes first because it gates the other: on 2026-11-11 it was 3 of 13, with 17 impressions
in 28 days. Clicks and impressions are recorded as early movement, never as the score.

**What "shortest time" means here.** A site eleven days old with no links will not reach page one
for "poker odds calculator" in weeks; that search is held by sites that are fifteen years old.
The specific searches ("poker outs chart", "pot odds formula", "rule of 2 and 4 poker") are where
page one comes first, and they are what the head terms are built on. The agent says each week
which targets are within reach and which are not yet, with the position to prove it.

## Decisions

1. **Where it runs:** on the founder's PC, started weekly by Windows Task Scheduler, as a
   headless Claude Code run in its own worktree. Why: the key and the wall are both local, and it
   uses the Claude plan already paid for. If the PC is off at the hour, the task runs at the next
   start. A cloud routine is the later move, with the Hetzner server.
2. **What it may do** (from `docs/operating-brief.md`, "Autonomy", and the roadmap's agent rule:
   agents draft, a human approves):
   - **Free:** read Search Console and the live site, write the reading, write its report.
   - **By pull request, left open for the founder:** every change to the site, technical or
     visible. A merge to `main` is a deploy, and the agent is new.
   - **Proposed for later, not in force:** once four weekly runs in a row have produced pull
     requests the founder merged unchanged, technical changes that are easy to revert (structured
     data, sitemap, internal links, redirects, speed) merge themselves when CI is green. Visible
     text, titles and descriptions, new pages and the target list always wait for the founder.
   - **Never:** create accounts, submit to directories, post or comment anywhere, buy anything,
     invent an author, write a page whose only purpose is a keyword, imply use during real-money
     play.
   - **What the agent step can touch:** the runner takes the reading; the Claude step gets the
     reading as a file and never the key. It has no network tools and cannot push: it may read
     and edit files in its worktree and run the site's tests and build. The runner pushes the
     branch and opens the pull request. Search queries are text typed by strangers: they are
     data to count, never instructions.
3. **One move a week, measured.** The agent makes the change it judges largest, records what it
   expected in the report, and reads the result two to four weeks later (search data lags). A
   move that did nothing is written down as that.
4. **Every number on a page comes from the engine** (`apps/web/src/poker/`), as for the hooks.
5. **Shape:** the method is a project skill, `.claude/skills/seo-agent/`; the instruments are
   `apps/seo/`; readings and weekly reports go to `content/seo/`.
6. **On the wall:** a `seo` station in DEVELOPMENT; each run posts a `run` event with the two
   numbers; threats: the run failed or did not happen for 9 days, the key stopped working, the
   indexed count fell, a target left page one.
7. **From the reels:**
   - Long-question filter: built into the reading (`longQuestions`), used by the agent once
     there are impressions to read.
   - Authorship: a named person, dates and how the numbers are made, on every guide (ticket 03).
   - Backlinks: a short vetted list for the founder; the agent submits nothing (ticket 06).
   - Preferred-source link: one plain link in the letter and the colophon, no Google script
     (ticket 06). It is not counted on for ranking.

## Out of scope

Paid rank trackers and keyword tools (Search Console is the source), other search engines' scores
(Bing gets its sitemap and IndexNow in ticket 02, but is not scored), writing new guides (the
content engine's job; the agent names which guide would move the score and why).

## Tickets

| # | Ticket | Waits on |
|---|---|---|
| 01 | Search Console access and the score | the founder runs the wizard |
| 02 | Every page indexed | 01 for the diagnosis; the rest can start |
| 03 | Honest authorship on the guides | the open question |
| 04 | The weekly run, unattended | 01 |
| 05 | The agent on the wall | 04 |
| 06 | Links worth having, and the preferred-source link | none |

## Open question

**Whose name goes on the guides?** Google's guidance asks for an accurate byline where a reader
expects one, and counts a made-up author as deception. Recommended: the founder's real name as
author, with a short "about" page (who, why, how the numbers are computed). The alternative is to
keep "LlamaPoker" as an organisation author and add only dates and the method note, which is
honest but weaker.
