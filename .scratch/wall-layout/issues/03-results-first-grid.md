# 03 The results-first grid: Results, Needs you, Work strip

Status: done
Spec: ../spec.md (Decisions 2, 3, 4, 5)
Blocked by: 01, 02

In `apps/wall/src/`:

- **Results** panel (`panels/Results.tsx`): money hero in the big phosphor digits (`—` and "no
  revenue source yet" while null), subscribers beside it with deltas, then one row per channel
  from `results.rows` (headline, deltas, sparkline, latest post, Newsletter extras). Opens in
  place like the other panels (a row → its evidence).
- **Needs you** panel (`panels/NeedsYou.tsx`): threats above approvals, reusing the existing
  Threats and Approvals components inside one pane.
- **Work** strip (`panels/Work.tsx`): CONTENT and DEVELOPMENT lines from `work`, collapsed. A line
  opens on click or when `open` is true, showing the existing job traces (moved from
  `Machine.tsx`) and its stations.
- Grid in `styles.css` per the spec's drawing: Results ≈60% wide, ≈65% tall; Needs you on the
  right, never shrinking; the Work strip below (an opened line takes height from Results and the
  feed row); Feed and Budget small at the bottom. Same grid in wall mode with larger type.
- `registry.ts`: keys 1 Results, 2 Needs you, 3 Work, 4 Feed, 5 Budget. Remove `Machine`,
  `North` and `Channels` (and drop `north`/`channels` from the reading if nothing else uses them).
- Existing colours and type only (three-colour rule), no new colours. The command bar, day
  scrubbing, pause and `b` keep working.

**Done when:** on `localhost:8788`, normal and wall mode look right by eye (screenshots to the
founder): the money dash, the Newsletter row, a running render under CONTENT, a failed job opening
its line by itself with a threat on the right, an Instagram row appearing after a `followers`
event. Scrubbing to an old day doesn't crash. `npx tsc --noEmit` passes.

## Comments

2026-11-14: done. New panels `Results.tsx` (money hero as big digits, a dash plus "no revenue
source yet"; subscribers beside it as LEADING with 24 h / 7 d; one row per channel with headline,
deltas, sparkline, latest post and the Newsletter extras; a row opens into its evidence),
`NeedsYou.tsx` (threats above approvals; `ThreatList` and `Cards` kept in `Threats.tsx` /
`Approvals.tsx`) and `Work.tsx` (CONTENT / DEVELOPMENT lines, collapsed; a line opens on click or
by itself when `open`, showing its stations and the job traces moved from `Machine.tsx`; a
station opens into its evidence). `Machine.tsx`, `North.tsx` and `Channels.tsx` removed with
their CSS. Keys 1 Results, 2 Needs you, 3 Work, 4 Feed, 5 Budget; the `go` hint updated; `open
<station>` focuses Work. `?nobrief` skips the daily briefing overlay (for screenshots).
Judgement call: Needs you spans the Results and Work rows, so the Work strip sits under Results
only (≈60% wide) rather than across the full width as drawn; that is what keeps "Needs you never
shrinks" true when a Work line opens. A failed job with no progress number no longer says
"running" in its trace. Checked by eye with headless Edge on localhost, normal and `?mode=wall`,
with test data: an Instagram row from `followers` / `post` events, a running render under
CONTENT (collapsed, RUNNING 1), a failed job opening DEVELOPMENT by itself with the red trace and
its threat on top of Needs you. A 2026-11-12 snapshot has no `results` / `work`; both panels show
a plain "not in this snapshot" note. All test events, jobs, stations and logs deleted after.
`north` and `channels` are still in the reading and now unused by the UI.
