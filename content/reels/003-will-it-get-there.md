---
title: Will it get there?
status: rendered (v4), not posted
channel: Instagram Reels (9:16, narration-first, one voice take per scene, local VibeVoice voice)
date: 2026-11-11
made_with: apps/reels (Remotion), composition `will-it-get-there`; script `apps/reels/src/scripts/will-it-get-there.json`; cover `cover-will-it-get-there`
files: media/reels/2026-11-10_will-it-get-there/renders/will-it-get-there.mp4; audio/vo/will-it-get-there_vo-whole_v04.wav (the one-take narration the scene wavs are cut from)
cost: v4 voice free (local GPU); earlier v3 voice 12.6 Higgsfield credits
---

# Reel 003 — Will it get there?

Outs in two seconds (the rule of 4 and 2), the niche's third-biggest topic (208K views on the
reference account). v3 is cut narration-first like reel 002: see `apps/reels/README.md`,
"How a reel is built". v4 (2026-11-11) regroups the 28 lines into seven continuous takes (hook,
count, flop, turn, exact, sheet, outro) and rewrites them to flow ("Start with the deck…", "which
leaves nine…", "But say the turn is a blank", "And how close is that to the truth?"), with the voice
generated locally (see reel 002's v4 note).

## Scenes

| Scene | Voice says | On screen |
|---|---|---|
| Hook | "Will it get there? Four hearts. Two cards to come. You have two seconds to know your chance." | Headline, A♥5♥ big, K♥9♥2♣ under it |
| Count | "Thirteen hearts in the deck. You can see four. That leaves nine outs." | [count] the 13 hearts → [seen] the four known ones fade, **4** → [nine] counter to **9 OUTS** |
| On the flop | "On the flop, two cards to come. Outs times four. Nine times four: thirty-six percent. Roughly one in three." | [flop] the board, TWO CARDS TO COME → [x4] **9 × 4** → [r36] **36%** sage |
| On the turn | "The turn is a blank. One card to come: outs times two. Eighteen percent." | [turn] 7♠ joins the board → [x2] **9 × 2** → [r18] **18%** brass |
| How close | "How close is that? The real numbers: thirty-five and nineteen. Off by one. Good enough to decide in two seconds." | [exact] THE RULE 36/18 → [e35] **35** → [e19] **19** (47-card and 46-card maths) |
| Save this | "Gutshot, four outs. Two overcards, six. Open-ended, eight. Flush draw, nine. Flush draw with a pair, twelve. Flush and straight draw, fifteen. Send this to the friend who chases every gutshot." | [d4]…[d15] one row per draw as it is named, exact flop/turn % |
| Outro | "Which draw do you chase? Wrong answers in the comments. Run any spot free at llamapoker.com." | [outro] the squint + question → [cta] llamapoker.com |

Maths: rule from `outsToEquity` (`apps/web/src/poker/odds.ts`); exact turn = outs/47, exact by the
river = 1 − (47−outs)(46−outs)/(47·46).

## Post

**Caption:** Nine outs, two cards: your chance in two seconds. The rule of 4 and 2, and how
close it really is. For players who chase draws by feel. Run any spot free: link in bio.

## Voice-over

Voice: VibeVoice-Large in the local ComfyUI, the seed-3 board voice cloned from its 9 s cut
(as reel 002). Files `apps/reels/public/vo/will-it-get-there/<take>.wav`, one per scene, cut from
one continuous generation. Regenerate:
`node scripts/vo-comfy.mjs will-it-get-there --ref media/tests/2026-11-11_vibevoice-voice-board/outputs/seed-3_ref.wav --whole`,
then `scripts/vo-align.py will-it-get-there --split`, `scripts/vo-check.py will-it-get-there` and
`node scripts/vo-manifest.mjs will-it-get-there "VibeVoice-Large seed-3 clone"`.
