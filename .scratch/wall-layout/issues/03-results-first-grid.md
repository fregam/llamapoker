# 03 The results-first grid: Results, Needs you, Work strip

Status: ready-for-agent
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
