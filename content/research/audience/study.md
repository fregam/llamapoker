# Audience study (phase 1)

For the founder. What we learned about the people LlamaPoker's reels are for, how we know it, and
where the evidence is thin. Built 2026-11-14 to 2026-11-16. The short version for script agents is
`pack.md`; reel ideas are in `topics.md`; every quote id (Q-…) resolves in `quotes.md`; the evidence
behind each finding is in `findings.json`.

## The answer in ten lines

1. There isn't one viewer. There are four: the **free-chip app player**, the **home-game and low-stakes
   player**, the player **starting to study**, and the **clip viewer** who may not play at all.
2. The most widely shared pain is not strategy. It is **not being able to read which hand wins**:
   the board playing, kickers, split pots [Q-BOARD-1] [Q-BOARD-2].
3. That confusion feeds the loudest belief, **"the app is rigged"**: many rigged stories are a
   misread hand [Q-BOARD-3].
4. Rigged belief is strongest among free-chip app players [Q-RIG1-1] [Q-RIG2-1], exists in a
   different form among real-money online players [Q-RIG4-1], and is nearly absent among viewers of
   live tournament channels (Korean, Chinese).
5. They judge a play by how it ended, and ask **"did I play it badly or was I just unlucky?"**
   [Q-RESULT-2]. Separating the decision from the result is the idea a few are already reaching for
   [Q-RESULT-1].
6. They already know the standard advice (fold more, be patient, manage your bankroll) and can't live
   by it [Q-CANTFOLD-2] [Q-BORED-3] [Q-YOYO-1]. Repeating it is useless.
7. **"Bingo"** is their word for tables where everyone shoves any two cards. Nine readers found it
   independently [Q-BINGO-2].
8. The format that makes viewers answer is a **fold-or-call spot before the reveal** (YouTube
   comments in English, Korean and Italian; forum players ask it about their own hands) [Q-VOTE-2]; the
   format they say teaches them is **someone thinking out loud through a hand** (lead) [Q-ALOUD-3].
9. They want it **at their stakes**: a $40 home game, freerolls, not $1,500 "low stakes"
   [Q-MYSTAKES-1].
10. The tone that loses them is the regular's: "fold pre", "go study", "you suck" [Q-MOCKED-1].

## How it was done

| Step | What | Result |
|---|---|---|
| Source map | 8 agents found candidates in ~25 languages; code ranked them; 8 agents judged the top 204 from real samples | 3,023 candidates → 28 sources to mine |
| Collection | Code, not agents: every item of the last 12 months per source | 672,000 items collected; 379,000 loaded and analysed (see limits) |
| Cleaning | Video descriptions, removed posts and self-repeats marked; different people saying the same thing never merged | 372,000 kept |
| Topics | Embedded on the GPU, clustered on a balanced sample (max 10,000 per source) | 145 topics → 16 themes (`apps/research/codebook.md`) |
| Reading | 23 readers (16 themes, 6 languages, 1 check of unplaced items), batches of 150 balanced by source, until three batches added almost nothing | 31,000 items read, 1,379 claims |
| Synthesis | Claims grouped across readers; a finding needs two source types, CardsChat not counted | 30 findings, 5 leads, 105 verified quotes |

Sources: 8 app-review pages (Google Play, App Store), 8 forum sections (CardsChat ×4, Replay Poker,
Poker Académie, GipsyTeam ×2), r/poker, r/Poker_Theory, Yahoo! Chiebukuro, 9 YouTube channels
(English, French, Italian, Korean ×2, Chinese, German, plus World Poker Tour Shorts).

## The questions, one by one

**How they talk.** Plain and absolute: "always", "never", "every time". Their words: cracked, bingo,
the algorithm, station, fish and donkey, run good / run bad [Q-TERMS-1] [Q-NOBLUFF-2]. Strategy words
stop them and they ask what they mean [Q-EXPLAIN-1] [Q-EXPLAIN-2]. "Results oriented" appeared once
in 1,350 items about judging plays; the idea needs plain words.

**What problems they have.** Reading the board (T01); telling a mistake from bad luck (T02);
calling when they know they're beat [Q-CANTFOLD-1]; boredom and forcing hands [Q-BORED-3]; the
bankroll yo-yo [Q-YOYO-1]; bingo tables [Q-BINGO-2]; being mocked for asking [Q-MOCKED-2].

**What they want to understand, and why.** Which hand wins and why it was a split; whether a loss
was their fault; where to start and what "study" means [Q-START-1]; how to review a hand
[Q-REVIEW-1]; table rules nobody taught them [Q-RULES-1]. The why is mostly social: losing to
friends in the home game, and not wanting to look like an idiot at a first live table.

**How they play, and why.** App players shove and call because the chips are free, and say so
[Q-BINGO-3]. Low-stakes players limp because "before the flop there are no bad hands" [Q-LIMP-1],
call to see [Q-CANTFOLD-1], and don't bluff because "nobody folds" [Q-NOBLUFF-1]. Believers in the
algorithm change their play to dodge it (lead) [Q-RIG5-1].

**Who they follow.** Free YouTube first, Jonathan Little most named. Recreational players admire
personality and people-reading (Negreanu, Ivey); those who study trust teachers. Hellmuth is the one
they mock. They trust a creator's teaching and distrust the sponsor [Q-CREATOR-1] [Q-CREATOR-3].

**How they feel.** Suspicion (app players), resignation ("destined to lose") [Q-LUCK-1], the sting
of a folded hand that would have hit [Q-BORED-1], shame at studying and still losing (lead)
[Q-STILLLOSE-2], pride in never paying or never folding kings, love of the home game [Q-WHYPLAY-2].

**Myths.** The ten in `pack.md`. Two cut both ways and must not be stated as rules: "never bluff at
low stakes" (a minority reports the opposite works) and "tight is right" (some say over-folding is
their leak).

**Where they play.** Free-chip apps where real-money poker is banned or out of reach
[Q-FREECHIPS-1]; home games at $20-60; freerolls as the road from zero [Q-MYSTAKES-3]; live 1/2;
small online tournaments. Tournaments over cash. Korea: hold'em pubs. Taiwan: club tournaments.
Germany: border casinos.

**What they tried and why they quit.** A few weeks of YouTube, unfinished courses, a book that made
it worse [Q-STILLLOSE-2], solver plays copied without the why [Q-STILLLOSE-1] (both leads).
Reviewing hands without knowing which hand [Q-REVIEW-1].

**Trigger moments.** A big pair losing; a loss they can't explain; losing to friends; the first live
game; a clip they couldn't follow.

**Questions too embarrassing to ask.** Which hand beats which; why it's a split; what a word means;
whether slow-rolling is rude [Q-EXPLAIN-3] [Q-BOARD-2].

**Who they trust and mock.** Above. They also doubt famous players are winning players, so a pro's
name is weak proof.

**Hooks and formats.** Fold-or-call before the reveal (viewers in three languages) [Q-VOTE-1]; thinking out loud
(lead); their stakes [Q-GTO-2]. Aces losing is now expected (lead) [Q-PREDICT-3]. Any slip in a card
graphic takes over the comments (lead) [Q-ERRORS-1].

**Responsible-gambling signals.** Present in nearly every theme: chasing losses, spending real money
to win back play chips, can't stop, playing to escape. 49 reader claims are flagged. None is quoted
or used as a hook, and the check script's inputs exclude them. One reader found viewers saying that
streamers' big-win clips plant the urge to gamble: keep big-win clips out of reels.

## By market

- **The US is not its own section, though you asked for one.** Comments and posts carry no country.
  The only country signal is the App Store storefront and the Google Play language, and Google Play
  returned one English pool for the US, UK, India and the Philippines. US-specific points that did
  surface: real-money online poker banned by state [Q-FREECHIPS-1], live 1/2 and 1/3 as the entry
  game, bar leagues. A US section needs sources that are American by construction (state-level
  communities, US live-room channels): a task for phase 2.
- **English (worldwide):** carries most of the evidence; all 30 findings.
- **Free-chip apps in other languages** (Spanish, Portuguese, Indonesian, Turkish, Thai, Chinese,
  French, German, Italian, Russian): the same rigged and bingo complaints, almost word for word
  [Q-RIG1-1].
- **Russian (GipsyTeam):** wage earners grinding the lowest online stakes in public diaries; closest
  thing to our "edge" profile outside English.
- **Korean, Chinese, Italian, German, French:** each is mostly one YouTube channel plus a little
  else. They confirm fold-or-call, luck-versus-skill and the jargon wall; they cannot stand alone.
- **Spanish / Latin America:** app reviews only. No Spanish forum or channel was mined, so there is
  **no Spanish-specific finding**. This named market is not answered.
- **Japanese:** 204 search snippets (the site blocks Europe). A gap.

## Does every question have two source types?

The spec's bar for phase 1. "Finding" = two source types, CardsChat not counted. "Lead" = one.
"Readers only" = said in reader reports, not yet a checked finding in `findings.json`.

| Question | Status | Backed by |
|---|---|---|
| How they talk, their terms | Finding | TERMS, EXPLAIN |
| Problems they have | Finding | BOARD, RESULT, CANTFOLD, BORED, YOYO, BINGO, MOCKED |
| What they want to understand, and why | Finding (the "why" is readers only) | BOARD, START, REVIEW, RULES |
| How they play, and why | Finding | LIMP, CANTFOLD, NOBLUFF, BINGO |
| Who they follow, what they see there | Finding for trust in creators; names are readers only | CREATOR |
| How they feel in play | Finding | LUCK, BORED, CANTFOLD, WHYPLAY |
| Myths | Finding | RIG1-4, ACES, AKJJ, LUCK, NOBLUFF, BIGBET, GTO, NOTGAMBLE |
| Where, what stakes, which format | Finding for apps and home games; Korea, Taiwan and Germany venues are readers only | FREECHIPS, MYSTAKES, WHYPLAY |
| What they tried and why they quit | **Lead only** | STILLLOSE |
| Trigger moments | **Readers only** | (learning and big-pairs readers) |
| Questions too embarrassing to ask | Finding | BOARD, EXPLAIN, RULES |
| Who they trust and mock | Finding for sponsor distrust; pro names are readers only | CREATOR |
| Hooks and formats | Finding for fold-or-call; the rest are leads | VOTE; ALOUD, PREDICT, ERRORS |
| Responsible-gambling signals | Recorded by 20 of 23 readers; deliberately not quoted | 49 flagged claims |

So phase 1's bar is met for 11 of 14 questions. "What they tried and quit" and "trigger moments"
are not, and "who they follow" is only partly. `claims.md` lists everything two or more readers said.

## What not to trust

- **Counts are not shares of the audience.** Readers counted items in samples balanced by source;
  late batches were often one forum. Strength in this study means several readers, source types and
  languages agree.
- **Topic sizes overstated most themes**, some by two to seven times (can't-follow 13% on theme,
  judging a call 24%, big pairs 38%, rigged 45%). Two were accurate: bluffing (99% on theme) and
  bankroll (85%). The reach table in the codebook is topic size, not belief size.
- **CardsChat rewards posting.** Its polite, generic answers inflated advice-type claims in every
  theme. It never counts as one of the two source types and is avoided for quotes.
- **The "regular" rule failed.** Jargon spreads faster than skill; beginners use the words. Readers
  judged by what people said about themselves. No recreational/regular split is published.
- **Stopping.** Five readers hit the 12-batch cap before settling (learning, strategy, tilt,
  Russian, Italian). Some readers dated claims by first evidence, which can make a reading look
  settled a batch or two early.
- **Unread:** about 290,000 items collected after the store was last loaded, almost all r/poker
  comments; 50,000 very short items;
  17,500 GipsyTeam items.
- **Short video:** the only short-video comments are one YouTube Shorts channel. TikTok and
  Instagram wait for phase 2.
- **Five leads** rest on one source type: thinking out loud, graphic errors, aces expected to lose,
  studied-and-still-losing, playing to dodge the algorithm.

## What this suggests beyond scripts

- A reel must **show the five cards that play** and define any term it uses. The render step should
  check card graphics against the hand, since errors take over the comments.
- The hand-review tool answers a stated gap: "which hand do I look at, and was it a mistake or bad
  luck?"
- App players ask for readable type and contrast, a slower timer and seeing the cards that beat
  them. One viewer rejected a trainer for its dark scheme and small text: worth a legibility check
  on our cream-on-black.
- A sponsor will be judged separately from the teaching.
