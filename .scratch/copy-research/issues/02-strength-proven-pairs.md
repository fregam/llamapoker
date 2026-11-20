# 02 Site strength, proven writers and pairs (search)

Status: ready-for-agent
Type: task
Blocked by: 01

Load the Common Crawl domain ranks and the Tranco list.

**Proven must not mean big.** Counting clicked queries tracks a site's size and its topic's
demand. Per site compute the **win rate**: queries where it was clicked, out of queries where it
was a top-100 candidate. Compare sites inside bands of site strength and of size (number of
candidate appearances), with a minimum number of appearances so a rate is not luck. A site is
proven when its win rate sits well above its band's over many different queries; the thresholds
are chosen from the distributions and written down with the reasoning.

**Pairs.** Between writers: for one query, the clicked page of a proven site beside a candidate
page that was never clicked for any query, matched on site strength where possible. Within a
writer: a proven site's most-clicked page beside one of its own never-clicked candidate pages.
The loser is weak evidence (not clicked may mean never shown): state this in the output.

**Pilot bound:** sample queries so the search scoreboard contributes about 6,000 of the pilot's
10,000 pages and 30 of its 50 pairs.

Output `content/research/copy/writers.md`: who qualified, their band, win rate and counts, for the
founder to strike names.
