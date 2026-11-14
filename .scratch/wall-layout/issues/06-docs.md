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

2026-11-14: written ahead of 05. README (panel table, the `revenue` / `followers` / `post`
shapes with commands, "Adding a channel", `--dept`, `?nobrief`, files), a current-layout note on
top of `docs/interface.md` (the founder's brief left as written), roadmap (now / next: social
fetchers, traffic, first money source), state, and a decision (money hero, channels through the
event store). `wall-event.mjs` fixed so the documented commands work: `--meta` is parsed as JSON
(it was sent as a string and dropped), and with no wall configured it posts to the local wall
without a key. Checked: a `post` event with meta from the CLI lands as the Instagram row's latest
post. Left open until 05 lands: check the README's phone sentence against it, then mark done.
