# Spec: bankroll management

Status: ready-for-agent
Founder's brief, 2026-11-19: "let's add a whole bankroll management to the whole site". Grilled the
same day (six questions); from the sixth on: "do what you think best we'll see from there".

## The goal

A visitor who asks "what stakes can I afford to play?" gets one clear answer on llamapoker.com, can
keep their real results there from then on, and later can practise the same discipline with play
money in the Trainer.

## Settled with the founder

1. **Three parts, in this order.** A: a guide and a calculator. B: a tracker for real sessions.
   C: a practice bankroll in the Trainer. A and B ship first; C is its own pull request after.
2. **Formats:** cash games and tournaments. Sit & gos and spins are a paragraph in the guide and
   are logged as tournaments. Live or online is a label on a session, not a rule set.
3. **The advice:** buy-in rules give the verdict; risk of ruin is the second number, behind
   a disclosure under the verdict ("How risky is that? Risk of ruin").
4. **Storage:** the browser only, plus a CSV file out and in. No accounts now; accounts come
   later, so every entry has a stable id and timestamps and the stored blob has a version.
5. **Pages:** one tool page, `/bankroll` (calculator first, tracker on the same page), and the
   guide at `/learn/bankroll-management` with the calculator embedded. One nav item, "Bankroll".

## Decided by Claude (overrule any of these)

6. **A logged session:** required: date, type, stake (cash) or nothing (tournament), money in,
   money out (left empty, it counts as nothing: a bust or no prize). Optional under "More": time played, live or online, a note. Deposits and withdrawals
   are their own entry type so a top-up is never counted as a win. One currency symbol per
   tracker, no conversion. Entries can be deleted, not edited (delete and re-add).
7. **The buy-in rules** (buy-ins to keep, by how careful you are):

   | | Aggressive | Standard | Careful |
   |---|---|---|---|
   | Cash (a buy-in is 100 big blinds) | 20 | 30 | 50 |
   | Tournaments | 50 | 100 | 200 |

   These are the ranges coaches publish (cash 20 to 50, tournaments 50 to 200; see Sources). They
   are conventions, and the guide says so.
8. **The verdict is a function of the bankroll.** The highest stake on the ladder where bankroll ≥
   buy-ins × one buy-in. "Move up at" is the same line for the next stake; "move down below" is
   the line for the current one. No hysteresis: the page says a shot at a new stake ends the
   moment the bankroll is back under its line.
9. **What the page says when the two numbers disagree.** The rule says "you can play this" while
   risk of ruin can read 20% or more. Both are true, and the page says why: the risk-of-ruin
   number is the chance of losing the whole bankroll *if you stay at this stake and never move
   down*; moving down at the line is what stops it. With a win rate of zero or less the number is
   100% and the text says no bankroll outlasts a losing game: it is then a budget, not a bankroll.
10. **Risk of ruin, cash:** `exp(−2 × win rate × bankroll ÷ SD²)`, all in big blinds (win rate
    and SD per 100 hands). Defaults shown on the page and editable: win rate 2 bb/100 (a small
    winner), SD 90 bb/100.
11. **Risk of ruin, tournaments:** a seeded simulation (same inputs, same answer; no worker
    needed, timed in ticket 08): field size, ROI, a simplified payout (top 15% paid, prizes
    falling as 1 ÷ place), 1,000 tournaments ahead. Defaults: 100 players, ROI 10%. The page
    states the model. The number is "within your next 1,000 tournaments", not forever.
12. **Risk of ruin from your own results:** after 30 logged sessions the tracker also shows the
    number computed from the mean and spread of the visitor's own session results, labelled rough.
    Below 30 it shows nothing rather than a number that means nothing.
13. **Money is stored as whole cents, dates as `YYYY-MM-DD` strings.** No clock, storage or
    randomness during render: the first render is the calculator with a typed example bankroll,
    the tracker loads in an effect.
14. **Positioning:** record-keeping and study. The page carries 18+ and "only money you can
    afford to lose"; nothing suggests using it at a table. `Privacy.tsx`, the home FAQ and
    `About.tsx` say where the results are kept and how the numbers are made.
15. **A backup nudge** after ten sessions, and after every ten more, until a file is downloaded.

16. **Added along the way, none of them asked for** (each small; say the word and it goes): a
    currency sign switch ($, €, £; no conversion); amounts read with a decimal comma and files
    separated by semicolons, since the tracker offers € and a silent hundredfold error is worse
    than a few lines of parsing; a home FAQ question that links the calculator; glossary entries
    (bankroll, buy-in, variance, risk of ruin, ROI); two bankroll charts in the guide; a link to
    the calculator at the foot of every guide; hover on the tracker's line.

## Out of scope (this release)

Accounts and sync; hands played, site names, field sizes and finish positions per session;
currency conversion; editing an entry in place; part C (next pull request).

## Sources for the numbers

- Risk of ruin: William Chen's formula `R = exp(−2Bw/s²)` (rec.gambling.poker, 1997; also in
  Chen and Ankenman, *The Mathematics of Poker*). Cross-checked in the tests against a seeded
  simulation, and against the published worked example (2 bb/100, SD 90, 5% → about 61 buy-ins).
- SD 90 bb/100 for 6-max no-limit hold'em: the usual published range is 75 to 100.
- Buy-in tiers: the published guidance clusters at 20 to 30 buy-ins for cash (careful players
  more), 100 to 200 for tournaments, 50 to 100 for small fields.

## Tickets

| # | Ticket | Waits on |
|---|---|---|
| 01 | The rules engine (`poker/bankroll.ts`) | none |
| 02 | Risk of ruin, cash and tournaments | 01 |
| 03 | The calculator and the `/bankroll` page | 01, 02 |
| 04 | The guide, `/learn/bankroll-management` | 03 |
| 05 | The tracker's log (`poker/bankrollLog.ts`), with CSV | none |
| 06 | The tracker on the page: form, list, stats, graph, backup | 03, 05 |
| 07 | Truth pages and docs | 03 to 06 |
| 08 | Part C: a practice bankroll in the Trainer (own pull request) | 01 |
