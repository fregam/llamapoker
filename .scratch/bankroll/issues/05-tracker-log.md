# 05 The tracker log, with CSV

Status: done (2026-11-19, branch feat/bankroll)

`apps/web/src/poker/bankrollLog.ts`, pure apart from guarded localStorage (as `stats.ts`): the
versioned log (currency, starting bankroll, entries with id, created, updated), add and delete,
`summarize` (bankroll now, profit, per-format numbers, the bankroll series, peak and downswing,
own-results risk of ruin from 30 sessions), CSV out and CSV in.

## Done when

- [x] A deposit moves the bankroll and not the profit.
- [x] CSV out then in gives the same entries; importing twice adds nothing; unknown columns are
      ignored; a bad row is reported with its line number and the rest still import.
- [x] A broken or older stored blob loads as an empty log, never throws.
