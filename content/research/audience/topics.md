# Reel topics

Ranked ideas for reels, one entry each. A script agent takes `pack.md` plus **one** entry from here,
and greps `quotes.md` for the ids. Ranked by how many independent readers, source types and
languages back the finding (see `findings.json`), then by how well a 30-60 second reel can answer it.

Fields: **problem** (the viewer's, in their terms) · **who** (pack profile) · **belief** as they hold
it · **kind** of belief, which decides what a script may do with it:

- **myth** = checkable with cards and arithmetic; show it.
- **can't verify** = we can't know what an app or a site does; never claim it is fair or unfair.
  Answer the reasoning (what a random deal looks like), not the accusation.
- **half-true** = often right at their tables; say the true part and where it stops. Don't "correct" it.
- **format** = no belief; a way of showing a hand.

**tried** = what they already tried and gave up on (the hook's villain), with the quote that says so;
empty when no quote backs it, never guessed. Entries marked *lead* rest on one source type.

| id | problem | who | belief | kind | tried | quotes |
|---|---|---|---|---|---|---|
| T01 | "I had the better hand and lost": can't see which five cards play (board plays, kicker, split pot) | App, Viewer | The better two cards in my hand should win | myth | | Q-BOARD-1 Q-BOARD-2 Q-BOARD-3 |
| T02 | "Did I play it badly or was I just unlucky?" | Low, Edge, Viewer | A play is good if it won and bad if it lost | myth | | Q-RESULT-1 Q-RESULT-2 Q-RESULT-3 |
| T03 | "My aces always get cracked" | App, Low, Viewer | Aces lose more often than they win | myth | | Q-ACES-1 Q-ACES-2 Q-ACES-3 |
| T04 | "The algorithm decides when it's my turn to lose" | App | Hot and cold streaks prove the deal is scripted | can't verify | Buying chips Q-RIG1-2 | Q-RIG2-1 Q-RIG2-3 Q-RIG1-2 |
| T05 | Free tables are bingo: everyone shoves every hand | App, Low | You can't play real poker against people who shove anything | half-true | | Q-BINGO-1 Q-BINGO-2 Q-BINGO-3 |
| T06 | "I know I'm beat and I call anyway, just to see" | Low, App | This could be the one time he's bluffing | half-true | Trying to fold Q-CANTFOLD-2 | Q-CANTFOLD-1 Q-CANTFOLD-2 Q-CANTFOLD-3 |
| T07 | Fold or call? A spot shown before the reveal (the format viewers answer) | Viewer, Low, Edge | | format | | Q-VOTE-1 Q-VOTE-2 Q-VOTE-3 |
| T08 | "It's all luck: better lucky than good" | App, Low, Viewer | Skill can't matter if the lucky player keeps winning | myth | | Q-LUCK-1 Q-LUCK-2 Q-LUCK-3 |
| T09 | "Never bluff at low stakes, nobody folds" | Low, Edge | Nobody at my table ever folds | half-true | | Q-NOBLUFF-1 Q-NOBLUFF-2 Q-NOBLUFF-3 |
| T10 | Folding is boring, and the hand I folded always hits | Low, App | The folded hand "would have won" | myth | | Q-BORED-1 Q-BORED-2 Q-BORED-3 |
| T11 | "Where do I start? What does 'study' even mean?" | Low, Edge | Getting better needs courses, charts and software first | half-true | | Q-START-1 Q-START-2 Q-START-3 |
| T12 | Ace-king and big pairs: "lots of promise, a let-down most of the time" | Low, Edge | A big starting hand is a made hand | half-true | | Q-AKJJ-1 Q-AKJJ-2 Q-AKJJ-3 |
| T13 | "I build a little bankroll, move up, and I'm back to zero" | Low, Edge | Moving up is how you win more | half-true | Bankroll rules Q-YOYO-1 | Q-YOYO-1 Q-YOYO-2 Q-YOYO-3 |
| T14 | "Why fold before the flop if nobody raised?" | Low | Before the flop there are no bad hands | myth | | Q-LIMP-1 Q-LIMP-2 Q-LIMP-3 |
| T15 | "A big river bet at low stakes is never a bluff" | Edge | They always have it | half-true | Calling to catch bluffs Q-BIGBET-3 | Q-BIGBET-1 Q-BIGBET-2 Q-BIGBET-3 |
| T16 | "I'm told to review my hands. Which one? How?" | Low, Edge | Review means going through every hand | half-true | | Q-REVIEW-1 Q-REVIEW-2 Q-REVIEW-3 |
| T17 | "GTO is useless at my stakes" | Edge | Theory is only for strong opponents | half-true | | Q-GTO-1 Q-GTO-2 Q-GTO-3 |
| T18 | Rules nobody taught me: who shows first, mucking, run it twice, slow roll | Low, Viewer | Running it twice changes the odds | myth | | Q-RULES-1 Q-RULES-2 Q-RULES-3 |
| T19 | "Poker isn't gambling" (and I can't explain why to my family) | Low | It's either pure skill or pure gambling | half-true | | Q-NOTGAMBLE-1 Q-NOTGAMBLE-2 Q-NOTGAMBLE-3 |
| T20 | "I'm playing bots, not people" | App | Opponents who always have it must be the house | can't verify | | Q-RIG3-1 Q-RIG3-2 Q-RIG3-3 |
| T21 | *lead* "The solver told me to and I had no idea why": studied, still losing | Edge | Copying the right play is the same as understanding it | myth | A strategy book Q-STILLLOSE-2; solver plays Q-STILLLOSE-1 (lead) | Q-STILLLOSE-1 Q-STILLLOSE-2 Q-STILLLOSE-3 |
| T22 | *lead* "It's my turn to lose": changing how you play to dodge the algorithm | App | Winning three days running means a loss is due | myth | Moving up, then back down Q-RIG5-2 (lead) | Q-RIG5-1 Q-RIG5-2 Q-RIG5-3 |

## Notes for whoever picks

- T01 answers T04 and T20 from the side: many "rigged" stories are a misread hand. Lead with the
  hand, not with the word "rigged".
- T04 and T20: a reel can show what a random deal produces (streaks, big hands losing). It must
  never say a given app or site is fair, and never say it is rigged.
- T03: aces losing is already expected in clips (lead, Q-PREDICT-3). The twist has to be how often
  they really win, or what the player did with them, not that they lost.
- T09 and T15 are two halves of one confusion, and both are mostly right at these tables. The reel is
  about the exception and how to spot it, not about overturning the rule.
- T13 and anything about tilt sit next to responsible-gambling ground. Teach the decision; never
  use chasing losses as the hook.
