# Personal brand notes

Raw material for the founder's personal brand: the interesting choices made while building
LlamaPoker, in the order they happened. Each entry is a story that could become a post, a thread,
a reel or a talk. Fed continuously by Claude, without being asked, whenever a decision is worth
telling (see `CLAUDE.md`, "Personal brand notes"). Newest at the bottom. Not for publishing as is:
these are notes, the voice and the angle come later.

Entry shape: **date · title** — what we chose, what we rejected and why, what happened, the
lesson, and a hook line that could open the post.

---

## 2026-11-10 · We stopped generating video with AI and started rendering it from code

- **Choice:** scrap the AI-video pipeline (Higgsfield, Kling, Seedance, ComfyUI video, Blender
  guides, LoRA training) after three bake-offs, and build the reels as React code with Remotion:
  every frame drawn, every number computed by the same poker engine that runs the website.
- **Why:** the account we were modelling turned out not to use AI video at all. Its hits are clean
  motion graphics where the voice leads and the picture answers. AI clips looked impressive and
  said nothing; code looks like the brand and is exact, cheap and repeatable.
- **Lesson:** look at what the winners actually do before buying the tool everyone talks about.
- **Hook:** "I spent three days and a pile of credits on AI video before noticing the channel I was
  copying doesn't use any."

## 2026-11-11 · The editing was bad, so we reverse-engineered the hits frame by frame

- **Choice:** instead of "making it better", step through the four biggest reels of the reference
  account one frame at a time and write down the grammar: caption = the phrase being spoken, one
  change on screen per phrase, one big object in the middle, scenes that evolve rather than cut,
  headline only in the first three seconds, no character art inside the video.
- **What happened:** the rules became code. A script format where every word can trigger
  something on screen, and a stage that cannot put two things in the same place.
- **Lesson:** "guided" is a mechanical property. You can build it so the mistakes are impossible.
- **Hook:** "The viewer gets lost when two things happen at once. So I made it impossible for my
  videos to do that."

## 2026-11-11 · Picking a voice by measuring it, because I can't listen

- **Choice:** the AI assistant doing the work cannot hear audio. So instead of picking a narrator
  by its catalogue name ("warm", "confident"), we measured each candidate: median pitch, pitch
  spread, words per second, share of pauses, and later a transcription check.
- **What happened:** the voice I had hated measured 229 Hz with a huge swing, i.e. theatrical.
  The calm ones sat around 120–140 Hz with a small spread and 2.4 words a second. The numbers
  matched my ears every time.
- **Lesson:** taste can be turned into a number when you need to delegate it.
- **Hook:** "My AI can't hear. It still picked a better narrator than I did."

## 2026-11-11 · We moved the voice from a paid API to my own graphics card

- **Choice:** drop the ElevenLabs-via-Higgsfield voice (about half a credit per line, rate-limited)
  for Microsoft's VibeVoice-Large running locally in ComfyUI on an RTX 4060 with 8 GB, model
  quantised to fit. Cost per take: electricity.
- **Rejected:** cloning a famous YouTuber's voice from his videos. Claude declined: no consent,
  impersonation. We went for a voice that doesn't belong to anyone instead.
- **What happened:** with generation free, we rendered a board of twelve invented voices on the
  same paragraph, measured them, and kept the calm, low one. The result sounded better than the
  paid voice and better than I expected from cloning.
- **Lesson:** "free and unlimited" changes the method: you stop choosing from a menu and start
  generating until it's right. And the voice that is nobody's is the one you can build a brand on.
- **Hook:** "The best narrator we found doesn't exist. We generated twelve people and kept one."

## 2026-11-11 · Three traps in local voice cloning, and the fixes

- The model recited the reference clip before reading the script when the reference was long and
  opened with the same words as the script. Fix: a nine-second cut from the middle of the clip.
- The same seed does not give the same voice twice: seven scenes generated separately came out in
  seven voices. Fix: generate the whole reel as one recording and cut it into scenes afterwards.
- It stops short of the last sentence. Fix: append a throwaway line and cut it away.
- **Lesson:** every "it just works" tool has three of these. The work is finding them before the
  audience does, with a check that runs every time (we transcribe every take and compare).
- **Hook:** "Our narrator kept reading the wrong paragraph. Here's what a 7B voice model is
  actually doing when you hand it a sample."

## 2026-11-11 · The lines were fine, the flow was dead

- **Choice:** the scripts felt like a list of facts read one at a time. Two causes: every sentence
  was its own audio file (the voice restarted cold each time), and the writing had no connective
  tissue. We rewrote so each line leans on the last ("Trouble is…", "So by the time…", "So what
  happens?") and recorded each scene as one continuous take.
- **Lesson:** flow lives in the joints between sentences, in both the words and the audio.
- **Hook:** "Same facts, same voice, same pictures. One change made it watchable."

## 2026-11-11 · Sound design, locally, and what to do while the tools download

- **Choice:** the reels had voice only. The user asked for a real sound layer and insisted on
  local tools. Research landed on ACE-Step 1.5 Turbo (music, MIT, runs under 4 GB VRAM, official
  ComfyUI support) for the bed and MOSS-SoundEffect v2.0 (Apache 2.0, 48 kHz effects) for the
  hits; DeepFilterNet 3 for cleaning the voice. Rejected: Stable Audio Open (gated licence),
  MMAudio and AudioGen (non-commercial weights), paid APIs.
- **What happened:** 20 GB of downloads and two installs the sandbox would not let the assistant
  run, so the user ran them. Rather than wait, the whole sound layer was built against a
  provisional set of effects synthesised from code (a tick, a pluck, a fold, a card, a chip, a
  whoosh, a stamp, a bell) and a procedural ambient bed, with the same file names the generated
  set will use. Swapping in the real sounds later is a file copy.
- **Lesson:** build the system first with placeholders of the right shape; the expensive asset is
  the last thing to drop in, not the first thing to wait for.
- **Hook:** "My sound designer was a Python script, for exactly one afternoon."

## 2026-11-11 · The hook was polite, so it was weak

- **Choice:** the first version opened with the question, three "folds" and a promise ("here's
  exactly how much"): twelve seconds before anything changed on screen. Retention dies there. The
  rewrite puts the payoff in the first sentence (the cost in big blinds stamps in at second two,
  the table folds at second four) and the body then earns it. Same for the outs reel: the
  thirty-six percent lands under the cards before the explanation starts.
- **Lesson:** a hook is not a question, it is the answer shown early enough that the viewer wants
  the proof.
- **Hook:** "Stop asking the question in your first three seconds. Show the number."

## 2026-11-11 · Four traps between "pip install" and the first sound

- **What happened:** the open sound-effects model worked on the fourth attempt. It wanted a GPU
  compiler Windows doesn't have (switch it off). It loaded its main network in full precision,
  twice the size it needed, and the driver quietly spilled it into system memory at sixteen
  seconds a step instead of failing (cast it down, but keep the one complex tensor complex). Its
  own save function depended on a library that wasn't there (save the array yourself). None of
  this is in the README. All of it took an hour, and then every effect took twenty-five seconds.
- **Lesson:** "open source" means the model is yours to fix. Budget the hour. Write the four
  lines down so the next person doesn't pay it again.
- **Hook:** "Free AI models cost one hour. Here's the hour."

## 2026-11-11 · "The graphics are isolated per frame": the fix was a verb, not a layout

- **Choice:** the scenes were each correct and each alone: a grid, then a counter, then cards,
  then a table. The user said the same thing about the graphics that he had said about the
  script: they don't flow. The fix was one new primitive, an object that *travels* between poses
  on spoken cues. Now the cost stamped in the hook docks into the corner while the maths runs; the
  grid sinks under the counter instead of vanishing; the aces shrink into the corner and stay;
  the button grid flies into its own row of the final table; the percentages fly into the cells
  of the table that checks them.
- **Lesson:** continuity is not a transition effect, it's the same object being somewhere else.
  If the next scene is *about* a thing, that thing should still be on screen.
- **Hook:** "Your motion graphics don't flow because nothing in them has a past."

## 2026-11-11 · Pace is a property of the audio file

- **Choice:** to go faster we didn't talk faster. We cut every silence in the narration to 0.3 s
  and lifted the tempo 6 %, pitch kept. Ten seconds gone from a 90-second reel and nobody can
  hear the difference in the voice. The script's pauses between scenes shrank from 20 frames to 9.
- **Lesson:** retention leaks in the gaps, not in the sentences.
- **Hook:** "I made the video 11 % shorter without cutting a word."

## 2026-11-11 · "You made everything worse": the round where the rules got precise

- **What happened:** the previous round added a tick on every caption change (so the words would
  "keep time"), cut every pause in the narration to 0.3 s and sped it up 6 %, put the portrait in
  the hook, and left the range cells lighting up in silence. The user's verdict, one line:
  everything worse. Each item was the same mistake: optimising a number (pace, density, motion)
  instead of the experience.
- **What changed:** sounds only for things that move, and a sound for *every* thing that moves;
  nothing for the captions. Pauses back to 0.55 s, no tempo change: narration needs breath. The
  portrait out of the hook and into the outro, centred and large. Cards slamming in from frame 0
  with a frame shake on the number. A voice board with four takes for the user to pick by ear.
- **Lesson:** retention tricks that fight the medium lose. A narration that no longer breathes
  isn't faster, it's broken. And every rule you write down this precisely came from a complaint.
- **Hook:** "I optimised my video for retention and my first viewer said it felt wrong. He was
  right about all four things."

## 2026-11-11 · The first planning session found the leak before the reel

- **Choice:** before building anything for growth, audit the whole path from reel to welcome
  email. Rejected: posting the three rendered reels first and "getting data" (the brief's own
  instinct, and mine).
- **What happened:** the site passed every technical check (types, tests, build, headers,
  structured data, redirects). The path did not: the signup form lives on one page, the welcome
  email in Beehiiv was switched off, the list had two subscribers and both were me, and the only
  attribution field could say one word: "home". Search had sent seventeen impressions. A week of
  seven reel pipeline versions sat on top of a funnel with no bottom.
- **Lesson:** the machine is never the bottleneck when the list is empty. Check where a viewer
  would land before you polish what they'd watch.
- **Hook:** "I rebuilt my video pipeline seven times. My newsletter's welcome email was off."

## 2026-11-11 · CI can't gate a deploy it doesn't own

- **Choice:** the site deploys straight from GitHub to Cloudflare Pages on every push. The
  obvious "safety net" is a CI job that runs the tests. But Pages builds `main` on its own the
  moment the push lands; a red CI job changes nothing. The gate had to be a branch rule (no
  merge without green checks), not the checks themselves. Rejected: moving the deploy into CI
  with a token, which would have added a secret and a second deploy path for the same result.
- **Lesson:** a check only protects what it can block. Find who actually pulls the trigger
  before writing the test that is supposed to stop it.
- **Hook:** "My CI was green and useless. The deploy never asked it."

## 2026-11-11 · The screenshot found what the tests passed

- **What happened:** the new letter form went into every guide's footer and into the site's
  colophon. Tests green, build green. The screenshot showed two identical forms thirty pixels
  apart on every guide. One line fixed it; a test now counts forms per page.
- **Lesson:** render the page. A test that checks a form exists can't tell you it exists twice.
- **Hook:** "All tests passed. The page had two signup forms."

## 2026-11-11 · The ASR said every word was right; the alignment said the "s" was missing

- **Choice:** for the voice round (hook A vs the livelier B, the founder's ear decides) the
  B clip was rendered with its own measured word times through an untracked copy of the reel,
  instead of muxing B's audio under A's picture. Rejected: the mux, because captions drifting
  against the voice would have biased the ear test against B.
- **What happened:** the pause-tightening gate could not see any silence in the sampled read:
  its noise floor sat 26 dB above the greedy read's, so "cut every gap over 0.55 s" cut nothing.
  Cleaning first, then tightening, fixed it. Then two transcript checks disagreed: the
  language-model ASR heard every word; the letter-level alignment put near-zero confidence on
  the final "s" of "costs" and the "th" of "maths". The founder's ear has to settle it.
- **Lesson:** for sampled voices, clean before you tighten. And a transcript check needs two
  models: one autocorrects what the other hears missing.
- **Hook:** "My speech recogniser passed the take. My aligner said the consonants were gone."
## 2026-11-11 · The overview is the contract, the tests are its audit

- **Choice:** when the signup path landed (form on every guide, the trainer and the colophon,
  first-touch channel to Beehiiv, /go bio links, dormant Turnstile), the docs were brought up in a
  separate pass against the code, not from the plan: every claim in overview.md was read off the
  file it describes, and the two new test files are now listed under "things to keep in sync".
- **Rejected:** letting the header comments carry it alone. They say what a file does; only the
  overview says where the form may appear and why there is exactly one per page.
- **Lesson:** a placement rule you can state in one paragraph is a rule a test can hold.
- **Hook:** "My docs are the spec and my tests check the docs, not the other way round."
## 2026-11-11 · The pause cutter found nothing to cut, because the noise hid the pauses

- **Choice:** rolling the livelier voice (B, sampled instead of greedy) into both reels, the
  documented chain was tighten first, clean second. Run that way on B, the silence cutter removed
  0.0 s from a 100-second recording that plainly breathes. The sampled read has a higher noise
  floor than the greedy one, and the floor sat above the −42 dBFS gate that defines "silence": to
  the cutter the whole file was speech. Cleaning first (DeepFilterNet) dropped the floor; the same
  rule then cut 12.3 s. The order in the README is now clean → tighten → cut.
- **Rejected:** lowering the gate to match the noise. It would have cut the right pauses on this
  file and the wrong ones on the next; the gate is a definition of silence and the fix is to make
  the file honest, not the gate lenient.
- **What happened:** the two transcript models (wav2vec2 forced alignment and Whisper large-v3)
  agreed on two doubtful spots out of 442 words ("save this" heard as "say this"; "But say the turn
  is a blank" heard as "I'll tell you the turn is a blank"). Flagged for the ear, not fixed.
- **Lesson:** a measurement that returns exactly zero is a measurement of the instrument. Check
  what the instrument assumes before trusting the number.
- **Hook:** "My silence detector found no silence in a file full of pauses. The noise was louder
  than its idea of quiet."

## 2026-11-11 - Three on-brand mockups, and the answer was "like Batman"

- **What happened:** the first round of command-center designs was built, carefully, from the
  brand book: cream on black, Bodoni numbers, hairlines. The founder's reaction: not that. The
  wall is a private instrument, and he wanted phosphor on black glass, segmented digits, glow.
  Round 2 took the same data and the same spec and rendered it as three VFD screens. Nothing in
  round 1 was wasted: the spec's content was right, only the skin was.
- **Lesson:** a brand book governs what the audience sees. The operator's own tools can want
  the opposite of the brand, and asking "who looks at this?" before designing would have saved
  a round.
- **Hook:** "I designed my dashboard in my brand's colours. My founder wanted the Batcomputer."

## 2026-11-11 - The safety net cost either $4 a month or the privacy of the repo

- **Choice:** a branch rule that stops untested code reaching production is free on public
  repos and paid on private ones. The founder chose public over paying. Before flipping it:
  a full-history secret scan and a grep for key-like strings, both clean, because a public
  history cannot be unpublished.
- **Lesson:** "free tier" is a product decision somebody else made for you. Read the condition
  before you depend on the feature.
- **Hook:** "I open-sourced my company to get a free checkbox."

## 2026-11-11 - The rule said "every media file in a manifest". 819 of 844 weren't.

- **Choice:** the repo's own README demanded a manifest for every binary, and the check script
  only ever looked at the 25 library images. Rather than soften the rule, a `--init` mode now
  lists a whole folder (sha256, size, dimensions) so the reels and the 1.2 GB of bake-off outputs
  are covered too, and a check finally means something.
- **Rejected:** deleting the test outputs (they are the evidence behind the research notes);
  leaving the rule as decoration.
- **Lesson:** a check that only covers the easy part is a false green. Point the instrument at
  the whole thing before trusting it.
- **Hook:** "My integrity check said 'all 25 verified'. There were 844 files."

## 2026-11-11 - The command center shipped the night it was approved, with half its panels empty on purpose

- **Choice:** the founder said build it. The spec's hardest rule was "real data only, no
  decorative charts, no panels for things that don't exist yet". So the wall went live with the
  machine, threats, approvals, the north star, channels, feed and budget, and without the map
  and reach: no location or view data flows yet, so those panels would have been theatre.
- **Rejected:** seeding the panels with invented numbers "so it looks finished"; a dashboard
  library (nothing fits a phosphor screen; it is SVG and one stylesheet); a route inside the
  public site (private surface, separate project, separate secrets).
- **What happened:** the first run showed the real operation: two subscribers, zero letters
  sent, no signup event in the store. Three threats, all true. The empty approvals panel is the
  honest state of a pipeline that has no drafting agent yet.
- **Lesson:** an instrument that shows "no data" where there is no data is worth more than one
  that shows a pretty curve. The empty panels are the to-do list.
- **Hook:** "I built my mission-control wall. Half of it says NO DATA. That's the point."
