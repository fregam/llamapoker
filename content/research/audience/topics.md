# Reel topics

Ranked ideas for reels, one entry each. A script agent takes `pack.md` plus **one** entry from here,
and greps `quotes.md` for the ids. Ranked by how many independent readers, source types and
languages back the finding (see `findings.json`), then by how well a 30-60 second reel can answer it.
Fields: **problem** (the viewer's, in their terms) · **who** (pack profile) · **belief** to correct ·
**tried** = what they already tried and gave up on (the hook's villain; empty when no quote backs
it, never guessed) · **quotes**. Entries marked *lead* rest on one source type.

| id | problem | who | belief to correct | tried | quotes |
|---|---|---|---|---|---|
| T01 | "I had the better hand and lost": can't see which five cards play (board plays, kicker, split pot) | App, Viewer | The higher hole cards win; a loss like that means the app is rigged | | Q-BOARD-1 Q-BOARD-2 Q-BOARD-3 |
| T02 | "Did I play it badly or was I just unlucky?" | Low, Edge, Viewer | A play is good if it won and bad if it lost | Posting the hand and asking | Q-RESULT-1 Q-RESULT-2 Q-RESULT-3 |
| T03 | "My aces always get cracked" | App, Low, Viewer | Aces should win; when they don't, the game is against me | | Q-ACES-1 Q-ACES-2 Q-ACES-3 |
| T04 | "The algorithm decides when it's my turn to lose" | App | Streaks prove a script: a random deal wouldn't run hot then cold | Stopped buying chips, uninstalled | Q-RIG2-1 Q-RIG2-3 Q-RIG1-2 |
| T05 | Free tables are bingo: everyone shoves every hand | App, Low | You can't play real poker against people who shove anything | | Q-BINGO-1 Q-BINGO-2 Q-TERMS-2 |
| T06 | "I know I'm beat and I call anyway, just to see" | Low, App | One call to find out is cheap; this could be the one time he's bluffing | Telling themselves to fold | Q-CANTFOLD-1 Q-CANTFOLD-2 Q-CANTFOLD-3 |
| T07 | Fold or call? A spot shown before the reveal (the format they answer) | Viewer, Low, Edge | (format, not a belief) | | Q-VOTE-1 Q-VOTE-2 Q-VOTE-3 |
| T08 | "It's all luck: better lucky than good" | App, Low, Viewer | Skill can't matter if the lucky player keeps winning | | Q-LUCK-1 Q-LUCK-2 Q-LUCK-3 |
| T09 | "Never bluff at low stakes, nobody folds" | Low, Edge | Nobody at my table ever folds, so betting without a hand is always wasted | Bluffing and getting called | Q-NOBLUFF-1 Q-NOBLUFF-2 Q-NOBLUFF-3 |
| T10 | Folding is boring, and the hand I folded always hits | Low, App | Folding means not playing; the folded hand "would have won" | Being patient | Q-BORED-1 Q-BORED-2 Q-BORED-3 |
| T11 | "Where do I start? What does 'study' even mean?" | Low, Edge | Getting better needs courses, charts and software first | | Q-START-1 Q-START-2 Q-START-3 |
| T12 | Ace-king and jacks: "lots of promise, a let-down most of the time" | Low, Edge | A big starting hand is a made hand | | Q-AKJJ-1 Q-AKJJ-2 Q-AKJJ-3 |
| T13 | "I build a little bankroll, move up, and I'm back to zero" | Low, Edge | Moving up is how you win more; the rule is for other people | Bankroll rules they can recite | Q-YOYO-1 Q-YOYO-2 Q-YOYO-3 |
| T14 | "Why fold before the flop if nobody raised?" | Low | Before the flop there are no bad hands; seeing a flop is cheap | | Q-LIMP-1 Q-LIMP-2 Q-LIMP-3 |
| T15 | "A big river bet at low stakes is never a bluff" | Edge | They always have it, so always fold (and the reverse: he must be bluffing, so call) | Calling to catch bluffs | Q-BIGBET-1 Q-BIGBET-2 Q-BIGBET-3 |
| T16 | "I'm told to review my hands. Which one? How?" | Low, Edge | Review means going through every hand, or needs a coach | Asking others if they played it right | Q-REVIEW-1 Q-REVIEW-2 Q-REVIEW-3 |
| T17 | "GTO is useless at my stakes" | Edge | Theory is for strong opponents; my table needs something else entirely | | Q-GTO-1 Q-GTO-2 Q-GTO-3 |
| T18 | Rules nobody taught me: who shows first, mucking, run it twice, slow roll | Low, Viewer | Running it twice changes the odds; slow-rolling is just how you play a big hand | | Q-RULES-1 Q-RULES-2 Q-RULES-3 |
| T19 | "Poker isn't gambling" (and I can't explain why to my family) | Low | It's either pure skill or pure gambling | | Q-NOTGAMBLE-1 Q-NOTGAMBLE-2 Q-NOTGAMBLE-3 |
| T20 | "I'm playing bots, not people" | App | Opponents who always have it must be the house | | Q-RIG3-1 Q-RIG3-2 Q-RIG3-3 |
| T21 | *lead* "The solver told me to and I had no idea why": studied, still losing | Edge | Copying the right play is the same as understanding it | Books, videos, solver output | Q-STILLLOSE-1 Q-STILLLOSE-2 Q-STILLLOSE-3 |
| T22 | *lead* "It's my turn to lose": changing how you play to dodge the algorithm | App | Winning three days running means a loss is due | Dropping to the smallest tables | Q-RIG5-1 Q-RIG5-2 Q-RIG5-3 |

## Notes for whoever picks

- T01 answers T04 and T20 from the side: many "rigged" stories are a misread hand. Lead with the
  hand, not with the word "rigged".
- T03: aces losing is already expected in clips (lead, Q-PREDICT-3). The twist has to be how often
  they really win, or what the player did with them, not that they lost.
- T09 and T15 are two halves of one confusion; don't state either as a rule.
- T13 and anything about tilt sit next to responsible-gambling ground. Teach the decision; never
  use chasing losses as the hook.
