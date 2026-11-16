# Codebook: audience research

Ticket 06. How every item gets read and tagged. Built from the topic pass of 2026-11-15 (145 topics
over 372k kept items from 28 sources). The topic ids of that run are in `data/theme-map.json`
(git-ignored, they change each run); the themes below are the stable part.

A finding needs **two source types** (app reviews, forums, communities, YouTube). Counts are always
items / distinct people / distinct sources. Different people saying the same thing all count.

## Themes

Reach is from the first mapping (items / people / sources), before any reading.

| Code | Theme | What belongs | Spec questions it answers | Reach |
|---|---|---|---|---|
| RIG | The game is rigged | App deals bad cards after you buy chips, pay-to-win, bots, "online is rigged", RNG doubts | myths, feelings, where they play | 10.4k / 8.6k / 27 |
| PAIRS | Big pairs lose | "AA always loses", KK into AA, never fold KK, AK misses | myths, feelings, how they play | 7.9k / 5.6k / 18 |
| FOLLOW | Can't follow the hand | "Can someone explain", misread boards, which hand beats which, "easy when you see the cards", what is a bad beat jackpot | what they want to understand, embarrassing questions, hooks and formats | 23.3k / 15.9k / 26 |
| LUCK | Luck or skill | "It's just luck", "this is why I don't play poker", it's gambling, short term vs long run | myths, why they play | 14.6k / 9.0k / 24 |
| FOLD | Folding | "What a fold", couldn't have folded, the value of folding, tight vs loose | how they play, feelings | 7.8k / 5.1k / 19 |
| CALL | Judging a call | "Terrible call", "makes no sense", brutal runout, results vs decision | how they play, how they talk | 10.0k / 7.9k / 21 |
| BLUFF | Bluffing | When to bluff, "you don't understand bluffing", bluffing too much at low stakes | how they play, myths | 2.9k / 2.2k / 15 |
| MIND | Tilt and discipline | Tilt, patience, session length, fatigue, drinking, breaks | feelings, responsible-gambling signals | 3.5k / 1.6k / 15 |
| ROLL | Bankroll | Starting from $50, freerolls, buy-in rules, going broke | problems, where and what stakes | 3.4k / 1.5k / 18 |
| LEARN | How to learn | "Where do I start", books vs videos, courses, hand review, which creators help | what they tried, who they trust, trigger moments | 6.7k / 4.4k / 21 |
| THEORY | Strategy talk | Hand histories, ranges, GTO vs exploit, limping, 3-bets, VPIP/PFR, HUDs, bubble and ICM | the serious edge; terms; mostly regulars | 36.9k / 11.7k / 22 |
| WHERE | Where and what they play | Which site, online vs live, cash vs tournaments, Omaha, tables at once, phone vs PC, rake, legality | where they play, at what stakes, in which format | 17.8k / 8.7k / 22 |
| WHY | Why they play | Hobby, relaxing, side income, competition | why they play | 1.4k / 0.7k / 16 |
| PROS | Players and personalities | Hellmuth, Polk, Ivey, Negreanu, Mariano, Keating; mocking the player on screen | who they follow, who they trust and mock | 27.1k / 17.0k / 23 |
| TABLE | Rules and manners | Calling the clock, stalling, slow rolls, chip noise, dealers, mucking, angle shots, run it twice, chat, tells | how they talk, embarrassing questions | 11.4k / 7.9k / 22 |
| APP | The app itself | Pop-ups, loading, bugs, tickets; and plain praise ("fun game") | where they play | 16.7k / 12.0k / 25 |

Not themes:

- **LANG** (36k items): topics that are a language, not a subject (Russian, Korean, Chinese, Italian,
  French, German, Japanese). Readers sort these into the themes above, in the original language.
- **NOISE** (38k): thanks, congratulations, laughing, condolences, forum announcements, removed
  posts, image links, self-promotion ("I built a poker app"), off-topic sport. Not read, except
  a 200-item spot check.
- **No topic** (96k): mostly short reactions. A 500-item sample is read to check nothing hides there.

## Tags a reader puts on an item

One theme code, then any that apply:

- `feel:` anger, shame, confusion, pride, fear, boredom, joy, suspicion, resignation
- `belief:` a claim the person holds as true (write it in their words, short)
- `ask:` a question they actually asked
- `trigger:` the moment that made them write (lost with AA, first casino night, bought chips)
- `term:` a word or phrase they use that a script should reuse (or avoid)
- `stake:` free chips, home game, freeroll, micro online, 1/2 or 1/3 live, higher
- `who:` rec (plays, wants to stop losing), edge (starting to study), reg (out of scope)
- `rg:` chasing losses, spending to recover, can't stop, playing to escape. Never quoted in a script
  as a hook; it marks where helping ends.
- `quote:` worth keeping verbatim (short, typical, no names)

## Who is a regular (out of scope)

Code first, reader confirms. An item counts as **reg** when it uses two or more of: range, solver,
GTO, 3-bet/4-bet, c-bet, SPR, EV, ICM, VPIP, PFR, HUD, bb/100, NL10–NL200, hero/villain, polarized,
nit, reg, x/r. One of them alone is **edge**. None is **rec**. Whole sources that lean reg:
r/Poker_Theory, GipsyTeam, Poker Académie; most of THEORY.

## Source caveats (found while reading the topics)

- **CardsChat posts are rewarded.** Members post to qualify for freerolls ("keep making quality posts
  so you will qualify"), so many replies are polite, generic and formulaic, some likely machine-written.
  Good for *which questions get asked*; weak for *how people really talk*. Never quote it as voice
  without a second source type.
- **World Poker Tour Shorts** is 24% of all items. Its comments are reactions to a clip, not people
  describing their own play: strong for FOLLOW, CALL, PROS, TABLE; weak for problems and stakes.
- **App reviews** are one person, one review: the cleanest count of distinct voices. They cover
  free-chip players only.
- **Yahoo! Chiebukuro** is 204 search snippets (the site blocks Europe): not a deep source.
- **GipsyTeam** is mostly personal grind diaries by low-stakes regulars: edge and reg, rich in
  feelings (downswings), poor in beginner questions.

## Changes

- 2026-11-15: first version, from topic pass 2.
- 2026-11-16, after the reading (23 readers, 31,000 items):
  - **New theme BINGO:** tables where everyone shoves any two cards (free chips, freerolls). Nine
    readers found it; it is about how others play, so it is neither RIG nor APP.
  - **BLUFF was framed backwards.** The talk is "never bluff at low stakes, nobody folds" and "a big
    bet is never a bluff"; the confessed leak is calling because "he must be bluffing".
  - **THEORY is not mostly regulars.** Among items that backed a claim: 649 edge, 345 rec, 37 reg.
  - **The regulars rule failed** in every reader and language: jargon spreads faster than skill, and
    German, Korean, French and Italian players use terms the list lacks. Tag by what people say about
    themselves; publish no rec/edge/reg split.
  - **RIG is two audiences:** free-chip reviewers (drained to sell chips) and real-money players
    (bots, the site's RNG, favoured streamers). Many rigged stories are FOLLOW misreadings.
  - **WHY** missed its strongest motives: a job would kill it, the home game, quitting after a loss.
  - **PROS** splits: recreational players admire personality; the studying edge trusts teachers.
  - **Reach figures above are topic sizes**, two to seven times the real size of each theme.
  - **GipsyTeam** is closer to the edge profile than to regulars; **r/Poker_Theory** is where
    beginners ask where to start.
  - No theme fits comments about the creator and the video itself; filed under PROS or FOLLOW.
