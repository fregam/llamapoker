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
