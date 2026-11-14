# 06 Docs: the new layout and the event shapes for future sources

Status: ready-for-agent
Spec: ../spec.md (Decisions 3, 4, 8)
Blocked by: 01, 02, 03, 04, 05

- `apps/wall/README.md`: the panel table (Results, Needs you, Work, Feed, Budget, with their
  questions and keys); the `revenue`, `followers` and `post` event shapes with a `wall-event.mjs`
  example each; `department` on `/api/station` and `job --dept`; "adding a channel = its fetcher +
  its station, no wall code".
- `docs/interface.md`: point at the results-first layout (it still describes The machine on top).
- `docs/roadmap.md` and `docs/state.md`: layout shipped; social fetchers, traffic and money
  sources listed as the next Results features.
- `docs/decisions.md`: add the 2026-11-14 points (the hero is money from day one; socials come
  through the event store, never live calls from the wall).

**Done when:** a new agent could add an Instagram fetcher from the README alone.

## Comments
