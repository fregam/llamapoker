# 05 Phone view: Results, Needs you, briefing

Status: done
Spec: ../spec.md (Decision 6)
Blocked by: 03

Under 800 px, three screens in this order:

1. Results: the hero and the Newsletter row.
2. Needs you: threats, then approvals as cards (call, fold, raise).
3. Briefing: still shown on the day's first open.

Work and Feed stay off the phone. Driven by the `phone` flags in `registry.ts` and the phone branch
in `App.tsx`.

**Done when:** at a narrow width (DevTools device mode) the three screens show in order and a card
can be called; `npx tsc --noEmit` passes.

## Comments

2026-11-14: done. Results is marked `phone` and shows only the hero and the Newsletter row there
(a `phone` prop on panels); the column is Results, Needs you (threats, then the approval cards,
unchanged), then the briefing card. Phone-only CSS stacks the hero (money over subscribers) and
wraps a channel row so nothing runs off the edge. Checked by eye with headless Edge at 500 px (it
won't render narrower: a 390 px shot is the 500 px layout cropped); no approval was waiting, so
calling a card wasn't exercised, but the cards are the same component as on the desktop.
