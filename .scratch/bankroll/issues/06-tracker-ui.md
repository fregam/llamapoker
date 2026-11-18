# 06 The tracker on the page

Status: done (2026-11-19, branch feat/bankroll)
Blocked by: 03, 05

`components/BankrollTracker.tsx` on `/bankroll`: "Track it from here" from the calculator,
the session form (four required fields, the rest under More), the list with delete, the figures
(bankroll, profit, hourly, tournament ROI), the bankroll line (SVG, brand tokens), download and
import, the backup nudge, a two-step "delete everything". Once tracking, the calculator reads
the tracked bankroll.

## Done when

- [x] Nothing is read from storage during render; the prerender is the calculator alone.
- [x] Checked in a real browser: log a cash session, a tournament and a deposit; reload; export;
      delete everything; import; the numbers come back.

## Comments

2026-11-19: checked in Chrome on the dev server. The download button was not clicked; the CSV
was produced by `toCsv` in the page and imported through the file input after "delete everything".
