# 05 Phone view: Results, Needs you, briefing

Status: ready-for-agent
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
