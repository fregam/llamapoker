# Interface: three directions (2026-11-11)

Static full-screen mockups for the command center in `docs/interface.md`, "Process: design now,
build later". The founder picks one. All three use the **same invented dataset** (an imagined
Tuesday in March 2027, about month six: 1,284 subscribers, one failed publisher, four pieces in
the queue) so the directions can be compared on layout, not on numbers. Nothing here is real data.

| Direction | File | Render (1920×1080) |
|---|---|---|
| A · The Wall | `docs/interface/mockups/a-wall.html` | `media/tests/2026-11-11_interface-mockups/outputs/a-wall.png` |
| B · The Broadsheet | `docs/interface/mockups/b-broadsheet.html` | `.../outputs/b-broadsheet.png` |
| C · The Table | `docs/interface/mockups/c-table.html` | `.../outputs/c-table.png` |

Open an HTML file in a browser at 1920×1080 (or view the PNG). Each is self-contained: fonts from
Google Fonts, colours from `brand/tokens.css`, no JavaScript. Re-render with headless Chrome:
`chrome --headless=new --window-size=1920,1080 --virtual-time-budget=5000 --screenshot=<png> file:///<html>`.

## A · The Wall

A strict grid of hairline-separated panels: threats top-left, the north star centre at 232 px
Bodoni, the feed as a column on the right, the machine as a horizontal rail with the counts
standing on it, channels and a real engraved world map (projected from public GeoJSON, hatch
density = share of visits) in the lower band, experiments and budget on the bottom rule.

- Does well: closest to the spec's "mission-control wall". The failed publisher is visible from
  across the room (vermilion rule, count and message, echoed in threats, the Instagram channel and
  the feed). Every edge lines up on a 220 px module. The map is the strongest single panel and
  would work with real data as is.
- Strains: text-dense; at wall distance only the Bodoni figures and the coloured rules read. The
  machine band has no room for a third line per station, so longer messages must open in place.
  The Letter channel's "brings none" track is honest but visually the weakest block.

## B · The Broadsheet

The front page of an evening paper set in the brand's type: masthead, the number as the
headline with the Gentleman's briefing as the lede in Bodoni italic, a four-block channel strip,
then three ruled columns (the machine as a departures board, notices, the wire in mono), and a
bottom band with a typographic cartogram, experiments and the budget as a ledger.

- Does well: hierarchy. The eye lands on the number, the lede, then the red publisher row, in
  the order the spec wants. The departures board gives state, last, next and count per station
  in one glance with no diagram chrome. Feels most like the website.
- Strains: the densest of the three (about a hundred figures); wall mode would have to drop
  panels, not scale them. The machine is a table, not a live line, so "counts moving through"
  would be cells changing. Cartogram instead of a map.

## C · The Table

The site's own 6-max table diagram, scaled up: the stations sit around a hairline oval as seats
(the failed one has folded, the waiting one has the action), the north star is the pot in the
middle, threats are "the read" on the left, the feed is "hand history" on the right, channels are
chip stacks (one hairline chip per subscriber brought) in the bottom band.

- Does well: the two states that matter are impossible to miss, and the metaphor makes the
  machine LlamaPoker's rather than a dashboard's. Chip stacks compare channel contribution
  without a chart.
- Strains: the oval is a poor container for density; eight seats is the ceiling, so the ninth
  station needs a second table. The pipeline's flow is implied by clockwise order, not drawn.
  Chip stacks stop working once a channel brings hundreds. The vocabulary ("the action is on
  you", "folded") may grate daily; easy to strip back.

## Recommendation

Build on **A**, and take two things from the others: B's briefing in the Gentleman's voice as the
line under the number (the spec asks for it on first open each day; A has only the "Today / Do"
line), and C's station states as the words the machine uses ("waiting on you", "folded", with the
plain labels kept). B's departures board becomes the view a station opens into. The map in A
stays; the cartograms were the honest fallback and A proved the real thing is feasible.

What the mockups do not show yet, by design: motion (only on real change), the command bar, time
scrubbing, opening a panel in place, wall mode, and the phone version (briefing, threats, approval
cards). Those come with the build, after the safety net and measurement are live.
