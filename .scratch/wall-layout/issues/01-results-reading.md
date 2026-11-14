# 01 Results in the reading: money hero and generic channel rows

Status: ready-for-agent
Spec: ../spec.md (Decisions 2, 3, 8)
Blocked by: none

Add `results` to `WallState` (`src/model.ts`), derived in `functions/_lib/derive.ts` as pure
functions and filled in `functions/_lib/store.ts`:

- **Hero:** `money` = sum of `kind: revenue` events (EUR) today and over 30 days, `null` with the
  note "no revenue source yet" when there has never been one. `subscribers`, `delta1`, `delta7`
  as `North` has them today.
- **Channel rows**, one shape for every channel: `{ channel, name, headline, unit, delta1, delta7,
  spark (30 days), latestPost?: { subject, url?, views?, likes?, saves?, comments? }, extra, note }`.
  - Generic rows come from events: any channel with a `kind: followers` event gets a row
    (headline = latest `amount`, deltas and sparkline from the daily readings); its latest
    `kind: post` event fills `latestPost`.
  - The **Newsletter** row uses the same shape with Beehiiv's live count as headline and
    `subscribersByDay` for the sparkline, plus `extra`: signups today, last letter sent (what the
    Signup and Letter stations read today), and first-touch "came from" (today's `brought` /
    `channels`).
  - Order: Newsletter first, then the others by headline.
- A missing number is `null` (shown as a dash), never a made-up 0.
- Old snapshots (scrubbing with `[` `]`) have no `results`: the client treats it as absent and
  doesn't crash. Keep `north` and `channels` in the reading until ticket 03 stops using them.

Tests in `derive.test.ts`: no revenue → null + note; revenue events → today / 30-day sums; a
`followers` series for `instagram` → a row with deltas and sparkline; latest `post` picked;
Newsletter row from subscribers + signups.

**Done when:** `GET /api/state` returns `results`; posting
`{"kind":"revenue","amount":10,"unit":"EUR","channel":"test"}` and a `followers` event for
`instagram` change it as expected; `npm test` and `npx tsc --noEmit` pass.

## Comments
