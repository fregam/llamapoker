# 06 The tracker on the page

Status: ready-for-agent
Blocked by: 03, 05

`components/BankrollTracker.tsx` on `/bankroll`: "Track it from here" from the calculator,
the session form (four required fields, the rest under More), the list with delete, the figures
(bankroll, profit, hourly, tournament ROI), the bankroll line (SVG, brand tokens), download and
import, the backup nudge, a two-step "delete everything". Once tracking, the calculator reads
the tracked bankroll.

## Done when

- [ ] Nothing is read from storage during render; the prerender is the calculator alone.
- [ ] Checked in a real browser: log a cash session, a tournament and a deposit; reload; export;
      delete everything; import; the numbers come back.
