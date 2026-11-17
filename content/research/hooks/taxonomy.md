# Hook mechanisms: the merged taxonomy

Built blind (ticket 04) from two independent lists, each drawn from its own sample of 150 Instagram
reels in many niches; nobody building them knew which reels performed. The two source lists are at
`apps/reels/scripts/hooks/data/blind/taxonomy-{a,b}.out.md` (git-ignored).

**How the lists were merged:**
- A move found by both lists is kept, under the clearer name and definition.
- A move found by only one list was checked against its example reels and kept when the move was
  real: `paradox_premise`, `named_villain`, `proof_display`, `before_state`, `pending_risk`,
  `come_with_me`, `subversion`.
- One list's broad "bold claim" was split into `counterintuitive_claim` and `magnitude_claim`, the
  other list's split, because a single broad tag drifts between taggers.
- "List" and "how-to" became one tag, `structure_promise`.
- "Attention annotation" (an arrow or circle on the image) became a context field.

## How to tag

- A mechanism is a move a writer or editor makes on purpose. Tag every one that is clearly present
  by about 5 s. A reel can carry several, and **an empty list is valid**: an opening that only
  greets the viewer or states a topic carries none.
- A move can sit in any layer: spoken, on-screen text, first frame and pace, or caption. Judge from
  the sheet (frames at 0 s, 1 s and 3 s), the transcript and the caption's first line.
- Only tag a spoken move from a voiceover or a voice to camera. Song lyrics, Whisper loops ("oh, oh,
  oh…") and background TV are not speech. Never quote lyrics.
- A caption that only asks viewers to comment is a CTA (a context field), not a mechanism.

---

## A. Claims: what the opening asserts (these stack)

**`counterintuitive_claim`:** states a fact or rule that contradicts what the viewer probably
believes, or names a common belief or habit and calls it wrong. Look for "than you think",
"actually", "not X but Y", "yet", "you've been doing X wrong", "X and Y are not the same thing".
- Examples: "Clouds are way heavier than most people think", "Platinum is 30 times rarer than gold,
  yet costs less", "Guys, I thought we were past cooking in glass".
- NOT `magnitude_claim`: size or importance alone contradicts nothing.
- NOT `named_villain`: here the target is a belief, not an agent.
- Ex.: `Der9FQ6Iwnj`, `DfFA032M64N`, `CywIahUpC3m`

**`magnitude_claim`:** a superlative the video must justify: biggest, first, only, craziest, "will
change X forever", "never seen".
- Examples: "the biggest building in human history", "This photo made Einstein famous".
- A plain "did you know" fact with no superlative and no contradiction is neither claim. Leave it
  untagged.
- Ex.: `DZCzcJGuHQk`, `DcQ2lETuRi1`, `DHl29mCR2hb`

**`paradox_premise`:** the premise joins two things that shouldn't go together, so it sounds
impossible until explained.
- Examples: "use a single ice cube to boil water", "Upgrading my deck with trash", "ocean water is
  going to save a lake".
- Co-tag a claim when one is also there.
- NOT `subversion`, which undercuts itself for a laugh.
- Ex.: `DezWylqpW3U`, `DVgnIC6EUvZ`, `DRkV-QeD8ir`

**`named_villain`:** a specific agent (an industry, company, product or type of business) is named
as what fails or exploits the viewer.
- Examples: "ashamed of the fitness industry", "POV: Using Microsoft Outlook" as a skit of the
  product failing, "Private Equity Slop Restaurants".
- NOT `counterintuitive_claim` (that corrects a belief) and NOT `stakes_warning` (a loss with no one
  to blame).
- Ex.: `DavN-wxIjuU`, `DZJVUzwo0NX`, `DaoDmVQyvWM`

**`fresh_news`:** tied to a public event that just happened or is about to, with a time word ("just",
"this week", "over the past 72 hours", "next week", a date).
- Examples: "OpenAI just solved…", "Astronomers just found…".
- A historical or personal event is `incident_headline`.
- Ex.: `DY7GAsGuwGr`, `Dd69xVCIGPY`, `DeAKXjtsXcq`

**`specific_figure`:** a precise number carrying the point (money, count, weight, percentage, age,
time) is spoken in the first sentence or on screen by 3 s.
- Examples: "$30,000 for a single coaching session", "200lb Tungsten Vest".
- Round words ("millions") don't count, nor does the count of a list's items, nor a year used as a
  label.
- Ex.: `DdEslFzxcSY`, `DeQFeAYxodz`, `Dan70Rfgrg2`

**`stakes_warning`:** the viewer risks a loss, harm, mistake or embarrassment unless they watch or
change. Often "Don't…", "Never…", "or else", "can save your life".
- Examples: "never, ever combine these two liquids", "Don't get on an international flight without
  doing these five things".
- NOT `pending_risk`, where the creator takes the risk on camera.
- Ex.: `DezsyjCTU9a`, `DQEv-3nES_7`, `DdwKQD9T2Io`

## B. Gaps: what the opening withholds

Work through these in order and stop at the first that fits.

1. **`viewer_task`:** the viewer must produce an answer (guess, spot, choose, judge) that the reel
   then reveals or scores.
   - Examples: "Can you spot the fake?", "WHICH VIDEO WAS FAKE? A / B / C", "Which hook got more
     views?".
   - Ex.: `DaOospJzMRw`, `DfwS85mgcax`, `DHLZ21RNyAM`
2. **`withheld_payoff`:** names a specific payoff and holds it back.
   - Examples: a hidden name ("a secret halal country many Muslims don't know about"), "results at
     the end", "do you want to know the scariest part?", "Nobody talks about this, but…", a headline
     missing its figure ("how much $ I made today").
   - Ex.: `Ddly9SZplAk`, `Dd5dkfyzwgv`, `De4opuTz5MC`
3. **`open_question`:** any other genuine question in the first line or title that the video answers.
   - Examples: "Should you wash your face?", "Why is this image so much more interesting than this
     one?".
   - Ex.: `DbbJUqExLkL`, `DBqRDkktJNR`, `DbvoaQppj6_`

**`structure_promise`:** announces the shape of what's coming: N items, levels, steps, a ranking, or
"how to" / "let me show you".
- Examples: "Three art direction techniques you should know", "Level one, cheese", "here's how", a
  row of "?" slots or a tier list on screen.
- Stacks with `withheld_payoff` when the items are also hidden.
- Ex.: `DeR89g6APZF`, `DeNGH9yhlWy`, `DVrISjOkTQn`

**`experiment_premise`:** the creator announces an attempt, test, challenge or goal whose outcome is
still open, often with a rule or a scale.
- Examples: "how many elastics it takes to hold it up", "Day 15 of riding in my followers' cars until
  I get scared", "making my boyfriend try things with no explanation".
- NOT `structure_promise`: a how-to hands over a method, while an experiment has an open outcome.
- Ex.: `DWb_OHOif_u`, `DcmED3FBwUv`, `Dd7vvf5lfhk`

**`pending_risk`:** a risky, forbidden or impossible-looking act is set up but hasn't happened yet,
so the viewer waits for the consequence.
- Examples: "100% ethanol… so we'll open this up", standing on giant lily pads, "Today we're making
  money. Fake money."
- When both this and `experiment_premise` fit and danger is the draw, tag this one.
- Ex.: `DXzVGjTkvhe`, `DcY4d49ulnZ`, `DUhcUFNEcmJ`

## C. Who and what happened: casting the viewer or the creator

**`identity_callout`:** names the real viewer the video is for, by role, situation or group.
- Examples: "If you're…", "If I were growing an Instagram audience as a coach…", "Only physics
  students will understand".
- Ex.: `DVrISjOkTQn`, `DHFgBbqOwBl`, `Det0yd6x6K0`

**`scenario_label`:** a label frames the clip as a recognisable situation or character type, so the
viewer thinks "that's me" or "I know that person".
- Examples: "POV: …", "When your kid…", "The gym bro who…", "8 year old me:".
- "POV:" is always this one, never `identity_callout`. Co-tag `named_villain` if the POV names a
  villain product or business.
- Ex.: `DeteGdvtZu0`, `DYflDClPJmt`, `DfizLFAsFWz`

**`incident_headline`:** one line reports a specific dramatic event (personal, or historical), with
the story to follow.
- Examples: "My maid of honor begged me not to marry my fiancé a week before our wedding", "I had to
  call the police on the family I worked for", "In 1991, a mysterious particle hit the Earth".
- NOT `scenario_label` (a type, not an event) and NOT `fresh_news` (a recent public event).
- Ex.: `Daf7o4LuIGP`, `DZsoSM8JuC1`, `DcyoCCFufUv`

**`raw_disclosure`:** the creator's own feelings or vulnerability are on show: crying, an admission,
a confession, a private reaction caught live.
- Examples: "My name is Steele and I'm an alcoholic", "I JUST RAN MY FIRST EVER MILE".
- Stacks with `incident_headline`.
- Ex.: `DfcxRnkpDMk`, `DcMdRH3pHwR`, `DZ6KIrxIL3P`

**`come_with_me`:** the creator invites the viewer along for an outing, a day or a task, with the
camera as their companion.
- Examples: "come with me to…", "spend a day with me", "come play poker with me".
- Ex.: `Dd4ATqIonLs`, `DbyAKWlMUl8`, `DZ8np64sONS`

**`subversion`:** sets up an expectation and undercuts it for a laugh, in one line or across setup
and caption.
- Examples: a twisted saying ("money can't buy happiness… never hit a one outer"), a misdirect
  revealed in the caption ("I was talkin about the truck").
- NOT `counterintuitive_claim`, which is a factual surprise the video argues for.
- Ex.: `DeM1l7Dz-I9`, `DDXJAI2MDpY`, `Dc6kqa5syEw`

## D. Borrowed attention

**`found_artifact`:** an outside piece of content (a comment, post, tweet, someone else's clip, an
ad seen in the wild) is shown so the creator can answer, debunk or react to it.
- Examples: a reply-to-comment bubble, "I'm gonna prove these people wrong", a split screen with
  someone's TikTok.
- NOT `proof_display`.
- Ex.: `DWNZcXogvsC`, `DfX4pMosn6U`, `DepPLRIoBwH`

**`proof_display`:** external evidence for the creator's *own* claim is on screen early: an article
screenshot, a receipt, a view or follower counter, a chart.
- Ex.: `DaNrCWaNVRU`, `De22OW-SrQP`, `DfZ_q_pFbX1`

**`famous_face`:** a celebrity or household-name brand is on screen at 0 s or named in the first
sentence, and recognising them is part of the pull.
- Ex.: `DdMXaNfMYan`, `DfGGT2kIhCy`, `DekeqHQMcvs`

## E. First frame and pace

Of `result_first`, `mid_action_start` and `pending_risk`, choose one per subject, decided from
frame 0: finished, happening now, or about to happen with risk. The rest stack freely.

**`result_first`:** the finished outcome is visible by 3 s (the dish, the build, the climactic event),
or the voice opens as if at the end ("And there you have it").
- Ex.: `DeQFeAYxodz`, `DdkBjraSQFw`, `DTveDJFkVKu`

**`mid_action_start`:** frame 0 is already inside an action or conversation, with no greeting or
setup: hands sawing or pouring, skit dialogue under way, step 1 straight away.
- A talking head who simply starts talking is not mid-action.
- Ex.: `DfP6gCdPbq3`, `DeKRBYYxDmr`, `DYU7wLPM87k`

**`before_state`:** the bad, messy or unfinished starting point is shown or named, implying a
transformation, without showing the after.
- Ex.: `DbJBiXAMBkt`, `DadTI1dslvi`, `DSTEcr-EeEW`

**`side_by_side`:** two states, versions or options are staged together to compare (A vs B, then vs
now, with vs without, a 1 s / 1 min / 1 h ladder).
- Ex.: `DbvuLbIh060`, `Dd2gFFxTPp-`, `C-nAuYZNpi-`

**`visual_anomaly`:** frame 0 holds something wrong, impossible or out of place (an ostrich in
traffic, a mascot playing tournament chess, a small bucket said to hold 100 lb of metal).
- NOT `visual_appeal`: odd, not pleasing.
- Ex.: `DZVKVEaMpS8`, `DeC45RcyRjl`, `Dd90W5NxdHa`

**`visual_appeal`:** frame 0's subject is there to be looked at for its own sake (an attractive
person, a food hero shot, a grand interior, a vista), held with no verbal hook yet.
- Ex.: `DU4YmAtDIaA`, `DfimVxYhiXB`, `De8LfJVNlYJ`

**`prop_to_lens`:** at 0–1 s the creator pushes a physical object at the camera so it dominates the
frame, and the first line is about it.
- Ex.: `DezsyjCTU9a`, `DXZ26XWCPIB`, `DdOno-xBUGz`

**`instant_cutaway`:** by 3 s the full frame switches to a different scene or register: the speaker
cuts to what is being described (CGI, archive, b-roll, a graphic), or the place or live-action /
animation register changes.
- A camera move within one scene doesn't count, and neither does a split layout present from 0 s.
- Ex.: `DeAKXjtsXcq`, `DcjODGPIGjg`, `DITrz1osdkx`

---

## Candidates, not yet mechanisms

Propose these as `new_mechanism` if you see them:
- **Pre-empting the sceptic:** the creator admits the trick or objection first ("we both know
  there's a fork in the back of the apple").

## Context fields (recorded per reel; not mechanisms)

| Field | Values |
|---|---|
| `format` | talking head · sketch / role-play · selfie vlog / walk-and-talk · hands or object demo · b-roll / tour · green-screen / stitch / reaction · interview or stage clip · CGI / animation with voiceover · screen recording · text over a static shot |
| `audio` | to-camera voice · voiceover · in-scene dialogue · song only · song under voice · ambient only |
| `transcript_reliable` | yes · no (lyrics, loops, background TV, junk) |
| `language` | e.g. English, Hindi, Arabic, Spanish |
| `text_style` | none · word-by-word captions · persistent headline at 0 s · keyword pop · meme label · dense paragraph |
| `face_at_0s` | yes · no |
| `annotation` | arrow, circle or pointer on the image by 3 s (yes · no) |
| `series_marker` | "Part N", "Day N" (text, or none) |
| `caption_cta` | none · comment keyword · comment opinion · follow · save · link · tag a friend |
| `sponsored` | yes · no |
| `repost` | another creator's watermark on the frame (yes · no) |

The pace count, `cuts_first_5s`, is measured by code and is not tagged.
