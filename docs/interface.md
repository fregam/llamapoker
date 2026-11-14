# The LlamaPoker interface

Specification for the command center described in `docs/operating-brief.md` (written by the founder,
2026-11-11, saved verbatim below the line). The "Built to grow" section applies from day one,
because the single event store shapes the architecture of everything else. The rest applies when
the roadmap reaches the interface. The design directions are in
`docs/interface/mockups.md`.

**Built on 2026-11-11 (night):** `apps/wall/` (read its README). Everything below that produces
data today is on it; the map and reach wait for location and view events.

**Change on 2026-11-11 (evening):** the founder decided the interface is **independent of the
website brand**. Ignore "Build it from brand/README.md and brand/tokens.css" below. The look is a
vacuum fluorescent display: black glass, phosphor light, segmented digits, glow allowed. Everything
else in the spec stands.

---

## What it is

A command center for LlamaPoker. When I open it I want to see the whole operation at once, live, and be able to reach anything in two keystrokes. Think of a mission-control wall, not an analytics dashboard: no SaaS templates, no card grids, no sidebars of icons. Build it from brand/README.md and brand/tokens.css. The feel is black, precise and quiet: no glows, gradients, neon or pulsing. The impact comes from density, type, exact alignment, and motion that only happens when something real changes.

## Desktop is one full screen with no scrolling

> **Current layout (2026-11-14):** the wall is laid out results first: Results (money as the hero,
> subscribers beside it, one row per channel) largest; Needs you (threats, approvals) beside it;
> Work (CONTENT and DEVELOPMENT, opening down to the job traces) as one slim strip; feed and budget
> smallest. The machine, north star and channels below became parts of those. The look is the VFD
> wall (cyan on true black, orange accents), not brand/, by decision. See `apps/wall/README.md`,
> `.scratch/wall-layout/spec.md` and `docs/decisions.md`. The original brief follows.

- Centre: the north star (subscribers) as a very large Bodoni number with its trend, reach and the weekly-active share beside it, and under it one line saying what changed today and what I should do about it.
- The machine: a live diagram of the whole pipeline, from research to drafts to my approval to scheduled to published, with real counts moving through it. Each agent is a station showing its state, its last run and its next run. A failure is visible from across the room.
- Channels: site, letter, Instagram and search side by side, each with its key number, its trend, and its contribution to the north star.
- Live feed: events as they happen, in plain words: a signup and the page it came from, a reel passing a view mark, a job finishing or failing, a cost threshold crossed.
- Threats: what is going wrong or about to, ranked by how much it matters, each with a suggested fix.
- Map: where visitors and subscribers are, drawn in the engraving style.
- Experiments and budget: each running test with an honest status, including "too early to call", and spend against the monthly ceiling.

## How it behaves

- Everything opens. Any number, station or event expands in place to show the evidence behind it, down to the raw logs, without losing the wall.
- Command bar. One key opens it and I type what I want: jump to a reel, a letter, an agent or a date, or run an action such as approving the queue or pausing a pipeline.
- Time control. I can scrub the whole wall back to any past day and see the operation as it was, so store the daily state from the first day.
- Kill switch. One guarded control pauses all outbound activity, and the wall shows clearly when it is on.
- Briefing. On first open each day, a short written briefing in the Gentleman's voice: what happened since I last looked, what needs me, what he'd do.
- Wall mode for a second screen: no controls, larger type, updates itself.
- Keyboard first on desktop, with the shortcuts shown the way the tool shows them.

## On the phone

A wall doesn't work on a phone, so it becomes three things: the briefing, the threats, and approvals dealt as cards that I call (approve), fold (reject) or raise (send back with a note), each showing the piece exactly as it will be published.

## Rules that keep it honest

- Every panel must answer a question I would act on. If you can't name the question, cut the panel.
- Real data only. Show an empty or "not enough data" state instead of filler, and never a decorative chart.
- Private, behind authentication, and fast: the wall loads in under two seconds.

## Built to grow

- One data layer under everything. Every agent, pipeline and channel writes its events and metrics to a single store in one common format (what happened, when, to what, how much, at what cost). The wall reads only from that store, never from a service directly.
- Panels are modules. Each one is a self-contained unit declaring the question it answers, the data it reads, and its size on the wall. Adding, removing or rearranging a panel must not touch the others.
- Nothing ships without its panel. Any new agent, channel, product or site comes with its events in the common format, its station in the machine diagram, and its health in threats, as part of the same work. If it isn't on the wall, it isn't done.
- Scale by level, not by clutter. When there are too many things for one screen, group them (all channels, all agents, all products) and let me open a group into its own wall. The top level always fits one screen.
- Don't build for what doesn't exist. No panels, groups or placeholders for future products, sites or channels until they produce real data.

## Kept current

- Record which panels I open, expand and ignore.
- Once a month, review the wall and propose changes: panels to cut because I never use them, questions I keep asking through the command bar that deserve a panel, new data worth showing, and anything that has become slow or crowded. Show me the proposal as a before and after. I decide.
- Small fixes (a wrong label, a slow query, a broken panel) you make without asking, and note them in the journal.

## Process

Design now, build later. Show me three directions as full-screen static mockups with realistic invented data, and I'll pick one. Build once the safety net and measurement are live, in this order: the machine diagram, threats and approvals first, then the rest.
