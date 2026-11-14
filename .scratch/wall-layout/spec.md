# Spec: the wall laid out results first

Status: ready-for-agent
Grilled with the founder 2026-11-14 (eight questions, one at a time). Builds the decision
"The wall is laid out by the question the founder comes with: results first" (`docs/decisions.md`,
2026-11-12 late).

## Problem

The wall is laid out by the pipeline, not by what the founder comes to it for. The machine holds the
whole top row, though its workflow nodes matter least. The questions that matter most, "how are we
doing?" and "what needs me?", sit in mid-sized panels below it. The founder looks first at results,
then at what is being made.

## Goal

One glance answers "how are we doing?" (Results, largest), then "what needs me?" (Needs you,
beside it), then "what is being made?" (Work, one slim strip). The layout leaves room for social
sources added later without touching the wall's code.

## Decisions

1. **Layout only.** This feature rearranges what the wall already reads (Beehiiv, the site probe,
   events, stations, jobs, queue, flags). It adds no new outside source. Socials (Instagram, TikTok,
   YouTube), traffic (Cloudflare analytics) and money sources are later features, each one slotting
   into Results through decision 8. Keep them in mind in every choice here.
2. **Results = a hero, then one row per channel.**
   - Hero: the north star on top (decision 3).
   - Below: one **channel row** per channel, all with the same columns: headline number
     (subscribers / followers), change today and over 7 days, a 30-day sparkline, and the latest
     post with how it did. A column a channel has no data for shows a dash, never a made-up value.
   - v1 has one row, **Newsletter**: Beehiiv subscribers, signups today, the last letter sent (from
     today's Signup and Letter stations), and today's Channels panel (first-touch source of new
     subscribers) folded in as the row's "came from" column.
   - The North star and Channels panels as separate panels go away.
3. **The hero is money, from day one.**
   - Big digits: revenue (EUR) over a period (today / 30 days). With no revenue source yet it shows
     `—` and "no revenue source yet", following the wall's rule that a missing source shows dashes
     and says why.
   - Beside it, smaller but prominent: subscribers, labelled as the leading number, with today's
     and the 7-day change.
   - Money arrives as events: `kind: revenue`, `amount`, `unit: EUR`, `channel`, optional `subject`
     (product / sponsor). The first such event fills the hero with no code change.
4. **Work = one strip, two department lines.**
   - **CONTENT:** reels-render, foley, voice, teardown, later research → drafts → approval →
     published. **DEVELOPMENT:** site health (the probe, from today's Site station), deploys, CI,
     tools.
   - Each line is collapsed by default: department name, a state word (OK / RUNNING n / FAILED /
     STUCK / LOST) in the existing three-colour rule, and the latest thing that happened.
   - A line opens down to the per-station job traces The machine shows today, on click or by itself
     when anything in it is failed, stuck or lost. Failures still raise their threat in Needs you as
     today.
   - Stations get a `department` field (`content` | `development`), set by the station's writer
     (`POST /api/station`) or by the job wrapper (`job --dept content …`). When unset, a mapping in
     the wall decides: reels*, foley, voice, teardown → content; everything else → development.
   - The machine panel goes away. Site, Signup and Letter leave its top row: site health goes to
     Development, signups and the letter to the Newsletter row.
5. **Grid (desktop and wall mode).**

   ```
   ┌──────────────── header ────────────────────────────┐
   │ RESULTS (≈60% width, ≈65% height) │ NEEDS YOU      │
   │  hero: money │ subscribers        │  threats       │
   │  channel rows (Newsletter…)       │  ───────────   │
   │                                   │  approvals     │
   ├───────────── WORK strip (2 lines, opens down) ──────┤
   │ FEED (small)                      │ BUDGET (small) │
   └──────────────── keys ──────────────────────────────┘
   ```

   - Needs you is one panel: threats above approvals. It never shrinks.
   - An opened Work line takes its height from Results and the feed row.
   - Wall mode (`w`, `?mode=wall`) keeps this grid with larger type.
   - Keys: 1 Results, 2 Needs you, 3 Work, 4 Feed, 5 Budget (and experiments).
   - Feed and Budget keep their content, only smaller. The look (schematic, three-colour rule,
     phosphor digits) is unchanged.
6. **Phone (under 800 px): three screens, Results → Needs you → briefing.** Results shows the hero
   and the Newsletter row. Needs you shows threats then approvals as cards (call, fold, raise). The
   briefing still shows on the day's first open. Work and Feed stay off the phone.
7. **Briefing order: results → needs you → work.**
   1. Money (or "no revenue source yet") and subscribers, with yesterday's change and where new
      subscribers came from.
   2. Threats and approvals waiting, with the first thing to do.
   3. One line on Work: what finished, failed or is stuck.

   Anything failed or paused jumps above results.
8. **Social sources come through the event store, never as live calls from the wall.** A later
   fetcher job (e.g. `job node scripts/fetch-instagram.mjs`, run daily) posts:
   - `kind: followers`, `channel`, `amount` (the count), as a daily reading;
   - `kind: post`, `channel`, `subject` (the post id), `meta: { views, likes, saves, comments, url }`.

   The channel row is **generic**: given a channel name, it reads its followers and posts from
   events. v1 builds it generic and uses it for the Newsletter, with Beehiiv's live count as that
   row's headline source. Adding a channel = writing its fetcher plus its station ("nothing ships
   without its panel"); the wall's code doesn't change. Fix the `revenue`, `followers` and `post`
   shapes in `apps/wall/README.md`.

## Out of v1

Any social, traffic or money fetcher. The map. Reach per channel. Per-post detail pages. Changes to
Feed or Budget content. A new visual style.

## Done when

On `localhost:8788` the wall shows Results (hero `—` for money with subscribers beside it, a
Newsletter row with signups, last letter and first-touch sources) taking the large left area,
Needs you on the right, a Work strip with CONTENT and DEVELOPMENT lines, and a small feed and
budget. The Machine, North star and Channels panels are gone. `job npx remotion render …` shows
CONTENT as RUNNING, and the line opens to its trace; a failing job opens the line by itself and
raises a threat. A `site` probe failure shows under DEVELOPMENT. Posting
`{kind: "revenue", amount: 10, unit: "EUR", channel: "test"}` fills the hero. Posting a
`followers` event for `channel: instagram` adds an Instagram row with no code change. The phone
view shows Results → Needs you → briefing. Keys 1–5 match the new panels. `npm test` and
`npx tsc --noEmit` pass in `apps/wall`.

## Tickets

- `issues/01-results-reading.md`
- `issues/02-work-departments.md`
- `issues/03-results-first-grid.md` (blocked by 01, 02)
- `issues/04-briefing-order.md` (blocked by 01, 02)
- `issues/05-phone-view.md` (blocked by 03)
- `issues/06-docs.md` (blocked by all)
