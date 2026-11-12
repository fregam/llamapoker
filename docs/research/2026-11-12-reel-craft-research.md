---
title: Reel craft research (motion, sound, assets)
date: 2026-11-12
spec: .scratch/reel-craft-research/spec.md
status: rounds 1-5 done; next = rebuild 002 motion in the host + draw-on direction, then sound
---

# Reel craft research

How the best short-form explainers move, sound and source their assets, against our reels 002
("Only playing aces?", v9, the approved reference) and 003. Ends in a ranked upgrade list proven by
blind A/B rounds.

## Benchmark

Picked for craft, not niche: each one is a short-form explainer whose motion or sound is the reason
it works. View counts from YouTube on 2026-11-12. Shorts download with yt-dlp; the Instagram
reference may need the OBS fallback.

| # | Reel | Channel | Length | Views | Why it's here |
|---|---|---|---|---|---|
| 1 | [How many organs can YOU live without?](https://www.youtube.com/shorts/xP2tHAXjZhI) | Kurzgesagt | 75 s | 6.7 M | The gold standard of flat vector motion and a scored sound design (Epic Mountain); closest to our "drawn world" look |
| 2 | [POV: A Nuclear War Just Started](https://www.youtube.com/shorts/x7IrzHMxEMM) | Kurzgesagt | 161 s | 6.0 M | Same studio at long length: how they hold 2½ minutes, tension in the music bed |
| 3 | [The medical test paradox](https://www.youtube.com/shorts/xIMlJUwB1m8) | 3Blue1Brown | 57 s | 11.0 M | Code-rendered (manim) probability explainer: our method and our maths, at 11 M views |
| 4 | [Evolving Rock Paper Scissors](https://www.youtube.com/shorts/TNnc4T9m9tA) | Primer | 48 s | 71 k | Code-rendered simulation with character; low views, kept for craft (how code motion gets personality) |
| 5 | [Why Dobermans Have Cropped Ears](https://www.youtube.com/shorts/gyOZv_ckZQU) | Zack D. Films | 31 s | 50 M | The loudest hook-and-foley machine in Shorts: every motion has a sound, 50 M in two weeks |
| 6 | [Why do computers suck at math?](https://www.youtube.com/shorts/s9F8pu5KfyM) | Fireship | 54 s | 8.8 M | Fast-cut, dense-graphics explainer with meme sound; the pace extreme |
| 7 | [How a nuclear bomb really works](https://www.youtube.com/shorts/_FsJJGlT4uo) | Johnny Harris | 114 s | 8.5 M | Collage and map motion with a cinematic score; premium texture without leaving 2D |
| 8 | [Why Canada is WAY Further South Than You Think](https://www.youtube.com/shorts/3wFAMwKi3O0) | RealLifeLore | 59 s | 3.8 M | One idea proven by one evolving map: the "scene evolves, it isn't replaced" rule done by someone else |
| 9 | [The Boomerang: Beyond a Toy, a Lethal Weapon](https://www.youtube.com/shorts/CyGJFg_BxLo) | Sideprojects | 56 s | 2.4 M | Object-centred 3D explainer: one focal object turned and annotated, like our cards |
| 10 | [The Scary Solution to the Chinese Debt Crisis](https://www.youtube.com/shorts/GLH0GOUk8-o) | Economics Explained | 60 s | 1.5 M | Numbers-heavy finance explainer: how stats land without a chart wall |
| 11 | [@ziramium_poker](https://www.instagram.com/ziramium_poker/) top reels | Ziramium Poker | 50–112 s | — | Our niche reference, already torn down for editing (content/research/2026-11-06-ziramium_poker.md); here for motion and sound only |

Considered and left out: Veritasium and other live-action shorts (we don't film), motion-design
tutorial channels (Ben Marriott, School of Motion: craft lessons, not explainers; mined in ticket 03
if a technique needs a how-to), Vox and The Economist Shorts (low views, mostly cut-downs of long videos).

## Tools and libraries (ticket 03)

Free only (free tiers fine). Licences are tagged, never filtered. Verdict = whether it earns a
place in an A/B round.

### Sound effects

| Source | What | Licence | Verdict |
|---|---|---|---|
| [Sonniss GDC bundles](https://sonniss.com/gameaudiogdc) | Pro foley and design libraries from paid vendors, given away yearly (2026: 7.5 GB; back catalogue ~200 GB) | Royalty-free, commercial, no attribution (check the no-AI-training clause) | **Top pick.** Real recorded foley at studio quality: card slides, chips, paper, wood knocks, cinematic hits. Replaces generated effects where realism matters |
| [Earshot SFX](https://nicholasjudy567.itch.io/the-designers-choice-earshot) | ~650 MB by film sound designer Paul Urmson (*Crouching Tiger*, *Alien Resurrection*) | Free / pay what you want; read its License.txt | **Test.** Film-grade design sounds (hits, whooshes, textures) |
| [Freesound](https://freesound.org) via [Openverse](https://api.openverse.org/v1/audio/) | Community library; Openverse searches it with no key (tested: 240 "whoosh" results, CC0 / BY / BY-NC) | Per sound | **Use for one-offs** (a specific card riffle, a chip stack). Quality varies a lot |
| [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk) | 16 k archive recordings | RemArc, non-commercial (fine per our rule) | **Use for one-offs**: room tones, real casino ambience |
| [Pixabay sound effects](https://pixabay.com/sound-effects/) | Large, uneven | Pixabay licence, commercial, no attribution | Backup |
| [FilmCow SFX](https://filmcow.itch.io/filmcow-sfx) | 4 k effects, comedic leaning | Free / pay what you want | Backup (tone is jokier than ours) |
| [Real Foley SFX](https://store.godotengine.org/asset/dailysounds/real-foley-sfx/) (DailySounds) | 20 mic-recorded props | Free | Too small; skip |
| MOSS-SoundEffect v2 (local, current) | Generated on our GPU | Model licence | Keep as baseline; the A/B decides whether recorded foley beats it |

### Music beds

| Source | Licence | Verdict |
|---|---|---|
| ACE-Step 1.5 (local, planned) | Model licence | **Test.** Generated to length and mood; still blocked on the ComfyUI Desktop update |
| [Free Music Archive](https://freemusicarchive.org) / Jamendo via Openverse | CC per track (BY, BY-NC…) | **Test.** Real composed beds; minimal/ambient/tension tags |
| [Incompetech](https://incompetech.com) (Kevin MacLeod) | CC BY | Backup; heavily overused on YouTube |
| [Pixabay music](https://pixabay.com/music/) | Pixabay licence | Backup |
| Stable Audio Open (local) | Stability community licence | Alternative to ACE-Step for short loops and risers |

### Motion (code libraries for `apps/reels`)

| Tool | Licence | Verdict |
|---|---|---|
| `@remotion/motion-blur` (`<CameraMotionBlur>`, `<Trail>`) | Remotion licence (free for us) | **Test.** Real motion blur on moving objects; whether the benchmark uses it is checked in the teardown sheets |
| `@remotion/transitions` (wipes, slides, custom presentations) | Remotion licence | **Test** for idea changes, the one place we cut |
| `@remotion/paths` (draw-on strokes, morphs) | Remotion licence | **Test.** Engravings that draw themselves on, lines that morph |
| `@remotion/noise` | Remotion licence | **Test.** Organic drift and handheld micro-movement instead of dead-still holds |
| Remotion `spring()` | Remotion licence | **Test** against our current eases (physical overshoot vs `outBack`) |
| [GSAP 3](https://gsap.com) with SplitText / MorphSVG / DrawSVG | Free "no charge" licence, all plugins included since 2025 | Possible, but Remotion's own tools cover most of it; only if a variant needs SplitText-grade type animation |
| `@remotion/lottie` + LottieFiles free animations | Per file | Skip: off-brand stock motion |

### Art (fits the engraving brand)

| Source | Licence | Verdict |
|---|---|---|
| [Openverse images](https://api.openverse.org/v1/images/) (Wellcome Collection, Flickr Commons, museums) | Mostly CC BY / public domain | **Use.** Tested: "playing cards engraving" returns 169 results, many real 19th-century engravings of card players: brand-native material |
| The Met / Rijksmuseum / British Library open access | CC0 / public domain | **Use** for engraved props and scenes; same look as our library |
| Our engraving library (`content/library/`) | Ours | Baseline |

## Tech stack (ticket 03b)

Every layer of the pipeline, not only the animation engine. Judged on: free (cloud free tiers
allowed), scriptable end to end (the factory needs it), quality ceiling, fit with our hardware
(RTX 4060, **8 GB VRAM**) and with `apps/web/src/poker/` as the source of numbers. Repository
activity, stars and licence read from GitHub on 2026-11-12. NC and research-only licences are fine.

**Compute.** Local 8 GB fits most audio and vision models below. Bigger ones (HunyuanVideo-Foley,
large music models) run free on **Kaggle** (about 30 GPU-hours a week, 16 GB T4/P100), **Colab**
(T4, session limits) or Hugging Face ZeroGPU Spaces: one notebook per model, called from a script,
output back into `media/`.

**What the benchmark uses** (secondary sources, likely): Kurzgesagt, After Effects + Illustrator
(Cinema 4D lately); RealLifeLore and Johnny Harris, After Effects + the GEOlayers map plugin;
3Blue1Brown, Manim; Primer, Blender. Only the last two render from code like us.

### 1. Animation engine

| Option | Status | Verdict |
|---|---|---|
| **Remotion** (current) | 4.0.543, pushed 2026-11-11, 72 k ★; free for us (≤3 people) | **Keep as the spine.** Engine, cues, sound layer and reel-check are built on it |
| Motion Canvas | MIT, 20 k ★, last push 2026-07 | No: a rewrite to get a camera node we can build; slowing |
| Revideo | original repo gone, forks only | No |
| Manim | MIT, 42 k ★, very active | No: Python rewrite, loses React and the poker engine; its signature (a camera over a math world) is upgrade 1 |
| Cavalry | free since 2026-04 (Canva) | Hand-made assets only: command-line render needs an Enterprise licence |
| Theatre.js | Apache, last push 2024-08 | No: unmaintained |
| After Effects | paid | Out |

### 2. Motion inside Remotion (all 4.0.543, free)

| Package | What it adds | Verdict |
|---|---|---|
| **`@remotion/three`** + react-three-fiber (MIT, 34 k ★) + **pmndrs/postprocessing** (Zlib) | Real 3D: perspective camera, depth of field, bloom, lit cards and chips with thickness | **Test** (upgrades 1-3D, 8, 11) |
| `@remotion/motion-blur` | Camera and trail blur | **Test** (upgrade 5) |
| `@remotion/noise` | Organic drift, handheld micro-movement | **Test** (upgrade 3) |
| **`@remotion/skia`** | GPU shaders in a frame: ink-bleed reveals, animated engraved line shading | **Test** for brand-native transitions (upgrade 13) |
| `@remotion/paths` + **vtracer** (MIT, pushed today) | Vectorise an engraving, then draw it on stroke by stroke | **Test** (upgrade 14) |
| `@remotion/transitions` | Wipes, slides, custom presentations | **Test** for idea changes |
| `@remotion/shapes`, `layout-utils`, `animation-utils` | Primitives, text fitting, interpolation helpers | Use when needed |
| `@remotion/rive`, `@remotion/lottie` | Play Rive / Lottie files | Skip: off-brand stock motion |
| `@remotion/light-leaks`, `@remotion/starburst` | Film effects | Skip: the brand forbids period effects |
| GSAP 3 (free, all plugins) | SplitText, MorphSVG | Only if a type animation needs it; must be driven by the frame |

### 3. Assets: turning flat engravings into material a camera can move through

| Tool | Status | Verdict |
|---|---|---|
| **Qwen-Image-Layered** | Apache, 2025-12 | **Test.** Splits one image into separate RGBA layers (figure, props, background): an engraving becomes a parallax scene |
| **Depth Anything V2** | Apache, 9 k ★ | **Test.** Depth map from one image: 2.5D camera pushes with real parallax on our engravings |
| **SAM 2** | Apache, 20 k ★ | **Test.** Cut out any object in an engraving by a click or a box, for carry-over and layering |
| vtracer | MIT | Draw-on engravings (see 2) |
| LayerDiffuse | Apache, last push 2024-06 | Backup for generating new transparent engraved props |
| Openverse, The Met, Rijksmuseum, BL | CC0 / PD / BY | Source art (see Tools and libraries) |

### 4. Sound effects

| Tool | Status | Verdict |
|---|---|---|
| Recorded libraries (Sonniss, Earshot, Freesound, BBC) | free | **Test** (upgrade 4) |
| **MMAudio** (video to audio) | MIT code, NC weights, 2.3 k ★ | **Test.** Watches our rendered frames and generates synchronised foley: a card slide sounds like the slide it sees. The automatic version of "a sound for every motion" |
| **HunyuanVideo-Foley** (video to audio) | open weights, research licence; 16-20 GB VRAM | **Test on Kaggle.** Claims state of the art on fidelity and sync |
| Sony Woosh (video to audio, 2026-05) | open weights, NC | Watch: newer, claims to beat the baseline on FoleyBench |
| MOSS-SoundEffect v2 (current) | local | Baseline |
| Stable Audio Open (`stable-audio-tools`, MIT, active) / TangoFlux | open | Text-to-effect alternatives for risers and whooshes |

### 5. Music bed

| Tool | Status | Verdict |
|---|---|---|
| **ACE-Step 1.5** (planned) | MIT, 14.6 k ★, pushed 2026-11-08 | **Test.** Still blocked on the ComfyUI Desktop update |
| Stable Audio Open | MIT tooling | **Test** for short loops and stingers |
| MusicGen (audiocraft) | MIT, 24 k ★ | Backup; older |
| YuE, HeartMuLa | Apache | Skip: built for songs with lyrics |
| Composed CC tracks (FMA, Jamendo via Openverse) | per track | **Test** against generated beds |

### 6. Voice (chosen by a measured board on 2026-11-11; any change goes through a new board)

| Model | Status | Note |
|---|---|---|
| **VibeVoice** (current) | MIT (research use), 57 k ★ | Baseline, read B |
| **IndexTTS-2** | open, 25 k ★ | **Board candidate**: emotion control and duration control (a line can be told to last 2.4 s, so the voice could fit the motion instead of the reverse) |
| Chatterbox | MIT, 28 k ★, active | **Board candidate**: emotion-intensity dial, light enough for 8 GB |
| Higgs Audio v2, Fish Speech, F5-TTS | open, active | Second-tier candidates |
| Kokoro, Dia | open, quiet since 2025 | Skip |

### 7. Mix and master

| Tool | Status | Verdict |
|---|---|---|
| **matchering** | GPL-3, active | **Test.** Masters our mix to match a reference track's loudness and tonal balance, e.g. 3Blue1Brown's or Kurzgesagt's soundtrack, automatically, every reel |
| **pedalboard** | GPL-3, Spotify, active | **Test.** Compressor, EQ, limiter, sidechain-style ducking in code (upgrade 12) |
| pyloudnorm | MIT | Exact LUFS targeting in reel-check |
| DeepFilterNet (current) | active | Keep for the voice |
| resemble-enhance | MIT, quiet since 2024 | Skip |

### 8. Analysis (for the research and for reel-check)

| Tool | Status | Verdict |
|---|---|---|
| **PySceneDetect** | BSD, pushed 2026-11-10 | **Adopt** in `reel-teardown.py`: replaces the cut counter that failed on Zack D. Films |
| **CoTracker** | Meta, active | **Adopt** for measuring camera motion (pan, zoom) separately from object motion |
| **python-audio-separator** (BS-RoFormer models) | MIT, active | **Adopt**: cleaner voice / music split than Demucs (Demucs read Primer's music as voice) |
| **CLAP** | CC0 | **Adopt**: label what kinds of effects the benchmark uses (whoosh, hit, click, riser) |
| whisperX | BSD, 25 k ★ | Word timings for references without captions (Instagram) |
| TransNetV2, madmom | stale / mixed | Skip |

**Reviewed, unchanged:** AI video generation (Wan, LTX, Kling, Seedance) stays out by the 2026-11-10
decision: every frame from code, every number exact. New engravings keep coming from the library
pipeline (`content/library/README.md`); nothing found here beats it for the brand look.

### Conclusion

The animation engine stays (Remotion). The real gains are around it, in layers the first pass
skipped:
- **Video-to-foley** (MMAudio, HunyuanVideo-Foley) could generate synchronised sound from our own
  frames: the automatic version of our hardest manual rule.
- **Engraving decomposition** (Qwen-Image-Layered, Depth Anything V2, SAM 2) turns flat art into
  layers a camera can move through, which the virtual camera needs to look like Kurzgesagt rather
  than a zoom on a flat picture.
- **Reference mastering** (matchering) makes the mix match a benchmark automatically.
- **Shaders** (`@remotion/skia`) and **draw-on** (vtracer + `@remotion/paths`) give brand-native
  motion the benchmark can't copy: ink that bleeds in, engravings that draw themselves.
- Better **analysis** tools fix the teardown's blind spots (cuts, camera motion, sound types).

## Motion graphics generation (ticket 03c)

Founder, 2026-11-12, after round 3: the 002 outro art is a leftover generated image that doesn't sit
in the edit; this is the moment to review how we generate art and motion, staying on brand. Higgsfield
builds its own workflows; so can we.

### What the leaders actually do

- **Claude Motion** (Anthropic, beta since 2026-10-08): short animated explainers exported as MP4.
  It is **code-driven animation, not a video model**: 2D type, charts, shapes and images. Access is
  reported as Team/Enterprise (sources disagree). Same family as our Remotion pipeline.
  ([pexo](https://pexo.ai/blog/what-is-claude-motion-3387), [How-To Geek](https://www.howtogeek.com/claude-can-create-motion-graphics-now-heres-how-easy-it-is/))
- **Higgsfield**: three routes. An After Effects agent (2026-09-10) that builds editable layers and
  keyframes; an MCP that lets Claude drive a whole pipeline into an editable AE project; and Vibe
  Motion, code-based motion for infographics and type. All paid (credits / AE).
  ([Higgsfield](https://higgsfield.ai/blog/ai-motion-designer-after-effects-gpt), [AlphaSignal](https://alphasignal.ai/news/higgsfield-lets-claude-build-fully-editable-after-effects-projects), [technology.org](https://www.technology.org/2026/02/06/bridging-code-with-canvas-higgsfields-vibe-motion-unlocks-professional-motion-design-for-everyone/))
- **Prompt-to-motion apps** (MotionVid, Swishy, Hera, Jitter, fluos…): templated looks, paid tiers,
  no control over our numbers or engravings. Not a fit.

**Conclusion:** nobody's edge is the engine. It is (1) a library of strong motion primitives,
(2) art made to move, and (3) a workflow that chains generators into the code. Ours is missing (2)
almost entirely: our art is flat, single-layer images placed on a stage.

### Our own workflow: five layers, all free

| Layer | What it gives | Tools (free) | Verdict |
|---|---|---|---|
| **1. Engraving in 3D** | Cards, chips, the table, the llama rendered live as copperplate engraving (cross-hatching that follows the form and the light) under a real camera. Exact text stays crisp. Nobody in poker, and none of the benchmark, has this | `@remotion/three` + an engraving / hatching shader ([spite/sketch](https://awesome.ecosyste.ms/projects/github.com%2Fspite%2Fsketch), [shaders.com engraving](https://shaders.com/docs/components/engraving), Moebius-style hatch pass) | **Top bet** for uniqueness and personality |
| **2. Art made to move** | New on-brand art generated *in layers*: figure, props, background separate; vectorised so it can draw itself on; depth for parallax | A **style LoRA** trained on our approved engravings (AI-Toolkit, FLUX.2 klein on a free 16 GB Kaggle/Colab GPU, to verify); Qwen-Image-Layered, SAM 2, Depth Anything V2; vtracer / [OmniSVG](https://huggingface.co/OmniSVG/OmniSVG) for vectors | **Build**: replaces one-off Higgsfield images with a repeatable, free, style-locked source |
| **3. A character with a performance** | The Gentleman as a host who reacts (glance, raised brow, a tap on the table) instead of a static bookend | Cut into parts (SAM 2) and puppeteered in code with springs; or Rive bones played through `@remotion/rive` (free tier); Wan-Animate-2 (open, 2026-08) driven by the founder's own movements, kept only if it holds the engraving look | **Test** in code first (exact, on brand); AI animation only as a later experiment |
| **4. A motion vocabulary** | Our own named primitives (ink bleed, draw-on, stamp, hatch-shade, parallax push, card orbit, count, morph), each previewed in a sampler composition, so every reel draws from the same toolkit | `src/motion/` + a `motion-sampler` composition; Remotion's official agent skills (`remotion-best-practices`) so Claude writes them well | **Build** alongside 1–3 |
| **5. Ambient texture from video models** | Living backgrounds (smoke, a night city in engraving style) behind the code layer, never text or numbers | Wan 2.2 5B / LTX-2.3 GGUF on 8 GB with the style LoRA | **Hold.** Reopens part of the 2026-11-10 decision (AI video drifted off style); only after layer 2's LoRA exists, as one test shot |

Not used: Claude Motion (overlaps what we do; plan access unclear), Higgsfield's AE agent and Vibe
Motion (paid), prompt-to-motion apps (templated, no exact numbers), Cavalry (no free scripted render).

### Next: a style-frame round (round 4)

Not a one-change A/B yet: four short sketches (5–8 s) of the **hook rebuilt in each direction**, so
the founder picks a direction before we A/B inside it:
1. **Engraved 3D**: the aces slam onto an engraved table in 3D, the camera orbits, hatching shifts with the light.
2. **Layered engraving scene**: a newly generated on-brand card-room plate in layers, the camera pushes through it with parallax.
3. **Draw-on**: the cards and the headline draw themselves in engraved strokes, then fill.
4. **The Gentleman performs**: the host reacts to the cost landing (glance, brow, a tap), puppeteered in code.

## Teardown (ticket 02)

Measured with `scripts/reel-teardown.py` (new; calibrated on 002 v9: 2.96 words/s against
reel-check's 3.0, 53 effects a minute against ~52 scripted in its `SoundDesign`). Videos, captions,
contact sheets and the per-reel JSON are in `media/tests/2026-11-12_motion-refs/` (manifest:
`content/tests/assets.json`). Read every overview sheet; the numbers only point.

| Reel | Motion (median frame change) | Voice over bed (dB) | Effects / min | Words / s | Loudness (LUFS) |
|---|---|---|---|---|---|
| 01 Kurzgesagt, organs | 0.60 | 31.4 | 19 | 3.53 | −10.7 |
| 02 Kurzgesagt, nuclear war | 0.54 | 13.3 | 28 | 2.91 | −22.4 |
| 03 3Blue1Brown, medical test | 0.00 | 25.3 | 12 | 2.88 | −15.6 |
| 04 Primer, rock paper scissors | 0.01 | −4.1 | 46 | 2.31 | −22.6 |
| 05 Zack D. Films, dobermans | 7.52 | 24.2 | 33 | 3.27 | −10.4 |
| 06 Fireship, computers & math | 0.00 | 16.7 | 69 | 3.57 | −18.0 |
| 07 Johnny Harris, nuclear bomb | 0.09 | 19.1 | 53 | 2.93 | −12.9 |
| 08 RealLifeLore, Canada | 0.68 | 23.1 | 113 | 3.61 | −17.4 |
| 09 Sideprojects, boomerang | 2.09 | 23.9 | 107 | 3.69 | −14.7 |
| 10 Economics Explained, China | 0.59 | 17.2 | 28 | 3.50 | −24.0 |
| **Benchmark median** | **0.56** | **21.1** | **40** | **3.51** | **−16.5** |
| **002 Only playing aces? (v9)** | **0.06** | **15.3** | **56** | **2.96** | **−15.9** |
| **003 Will it get there?** | **0.07** | **15.1** | **36** | **3.17** | **−16.0** |

Measurement limits: hard-cut counting failed across styles (Zack D. Films and Johnny Harris change
shots by camera moves and morphs, not cuts), so cuts are read from the sheets, not counted. "Motion"
is near zero for thin lines on black (3Blue1Brown, Fireship) even when the camera moves, so it
separates styles more than quality. Primer's voice-over-bed is negative because Demucs read its
music as voice. Ziramium (Instagram) is not downloaded yet (blocked without a login).

### What the sheets show

- **Kurzgesagt (01, 02):** never still for long. The camera pushes from the whole body into one
  organ, then pulls back. Data lives inside the object: the kidney fills to 38 %, the body drains from
  100 % to 80 %. A game frame (EASY, HARD, EXPERT, an HP bar) carries the structure. Each section
  gets its own colour field. Organs have faces and react. The hook frame is the last frame (loop).
- **3Blue1Brown (03):** the closest to us: black, thin lines, a 1,000-dot grid counting up from 0.
  The difference is a **camera**: it zooms into the 1 % box, pans across to the 99 % box, pulls back
  to the equation, and one whip-pan streaks with motion blur. Captions 2–3 words, upper case, the key
  word coloured. 11 M views with almost no effects (12 a minute) and a quiet bed (25 dB under the voice).
- **Primer (04):** the counter-example. The bars sit at 33 % for ~20 s with nothing moving; the
  lowest views on the list.
- **Zack D. Films (05):** frame 0 is mid-action (the ear is already being cut). Macro close-ups with
  shallow depth of field, a camera that never stops, a shot change about every second (by moves,
  not cuts), captions of 2–3 words.
- **Johnny Harris (07):** a face for three seconds, then one object (the warhead) for a minute and a
  half. It evolves: cutaway, labels on leader lines, the camera pushes in as the explanation goes
  deeper, the background changes for the flight section. Our "a scene evolves" rule, plus a camera.
- **RealLifeLore (08):** one map for the whole reel and a camera that keeps travelling: push into
  Washington, Lake Erie, California, Detroit. Areas flood with colour on the word. One-word captions.
  113 effects a minute: almost every camera move and fill has a whoosh or a hit.
- **Sideprojects (09):** one object, turned and annotated in 3D; a shot change every 2.7 s.

## Gap analysis

Scored against the benchmark, 1 (far behind) to 5 (level).

- **Motion: 2/5.** Our objects move well (eases, `Move` carry-overs), but the **frame** never
  moves: 95 % of our frames are held against about half in the benchmark, and our motion measure is
  a tenth of the median. Every top explainer except Fireship has a virtual camera that travels over
  a larger world (3Blue1Brown, RealLifeLore, Johnny Harris, Kurzgesagt) or never stops (Zack D. Films).
  We already have the "one evolving scene" grammar they use; we lack the camera that makes it feel alive.
- **Sound: 3/5.** Effect density (56 a minute) is in range (median 40) and loudness is right (−16
  LUFS vs −16.5). But the **bed and effects sit hot under the voice**: 15 dB below it against a 21 dB
  median (3Blue1Brown 25, Kurzgesagt organs 31). Our effects are generated; the best (Zack D. Films,
  RealLifeLore) sound recorded and layered.
- **Assets: 3/5.** The engraving library is distinctive and on brand, a strength none of them
  share. It is small, though, and nothing in it moves by itself (no draw-on, no depth layers).
- **Pace: in range, slow end.** 2.96 words/s against a 3.51 median. Not a defect (3Blue1Brown and
  Johnny Harris sit at 2.9), and the founder already rejected a faster cut once (2026-11-11). Tested last.

## Ranked upgrade list

Each is one change, testable on the bench (002 hook take and plan take). Rank = strength of the
evidence × size of the gap ÷ cost.

| # | Upgrade | Evidence | Bench scene | Cost |
|---|---|---|---|---|
| 1 | **Virtual camera**: the stage becomes a larger world and a camera moves over it on cues (push in on the number as it lands, travel from the cards to the grid, pull back for the total) | 3Blue1Brown, RealLifeLore, Johnny Harris, Kurzgesagt; our motion 0.06 vs 0.56 | both | medium: a `<Camera>` wrapper in `stage.tsx` with cue-driven keyframes |
| 2 | **Bed and effects 6 dB lower under the voice** (voice over bed 15 → ~21 dB) | benchmark median 21 dB, the calmest hits 25–31 | both | trivial: duck levels in `sound.tsx` |
| 3 | **Never-still holds**: a 2–3 % slow push or a noise drift whenever nothing else moves | Primer's 20 s hold vs everyone else; our 95 % held frames | plan | small: `@remotion/noise` |
| 4 | **Recorded foley** for the physical sounds (card slap, chips, table knock) from Sonniss GDC / Earshot instead of generated ones | Zack D. Films, Sideprojects | hook | small: swap files, re-level |
| 5 | **Motion blur on fast moves** (card slam, `Move` travels, whip-pan) | 3Blue1Brown whip-pan, Zack D. Films | hook | small: `@remotion/motion-blur` |
| 6 | **Shorter captions**: 1–3 words a chunk instead of 2–6 | RealLifeLore (one word), 3Blue1Brown and Zack D. Films (2–3) | both | small: re-chunk the script's `\|` marks |
| 7 | **Data inside the object**: the share fills the object itself (a flood across the grid, a level rising in a chip stack) instead of a number beside it | Kurzgesagt kidney and body, 3Blue1Brown red fill, RealLifeLore flooded areas | plan | medium |
| 8 | **Depth of field**: what isn't the focus blurs slightly (HUD dock, ghosted grid) | Zack D. Films, Sideprojects | plan | small |
| 9 | **A sound for every camera move** (soft whoosh on travel, low hit on a push-in), once #1 wins | RealLifeLore (113 a minute) | both | small, depends on #1 |
| 10 | **Faster read**, about 3.4 words/s, pauses kept at 0.55 s | benchmark median 3.51 | hook | medium (voice regen); the founder rejected a faster cut once, so last |
| 11 | **3D hero objects** (`@remotion/three`): cards and chips with thickness, lit, flipping and slamming under a perspective camera | Sideprojects, Zack D. Films, Primer | hook | medium |
| 12 | **Mix bus** (pedalboard): gentle compression and a limiter on the bed + effects, so they sit as one layer under the voice | the benchmark's beds sound glued, ours sound placed | both | small |
| 13 | **Ink transitions** (`@remotion/skia` shader): ideas change by ink bleeding in / out instead of a fade | brand-native; benchmark changes ideas by camera or wipe | both | medium |
| 14 | **Draw-on engravings** (vtracer + `@remotion/paths`): the art draws itself on the cue | brand-native; Johnny Harris builds objects up line by line | hook | small |
| 15 | **Parallax engravings** (Qwen-Image-Layered / Depth Anything V2): the camera moves through layered art | Kurzgesagt, Johnny Harris (depth under camera moves) | hook | medium, pairs with #1 |
| 16 | **Video-to-foley** (MMAudio): effects generated from our own frames, synced to every motion | RealLifeLore and Zack D. Films (a sound on almost every move) | both | medium |
| 17 | **Reference mastering** (matchering) against a benchmark soundtrack | the benchmark's glued, bright mixes | both | small |

**Round 1 proposal:** #1 camera, #2 quieter bed, #4 recorded foley, #5 motion blur. If the 2D
camera wins, a later round tests it against the 3D camera (#1 vs #11).

## A/B rounds

### Round 1 (2026-11-12): the 2D camera won both scenes

Bench: reel 002 v9, frames 0-740 (hook + plan). Four one-change variants, all level-matched to
-16.1 LUFS, blind on the page (key in `.scratch/reel-craft-research/round-01-key.md`). Clips in
`media/tests/2026-11-12_motion-ab/round-01/outputs/`.

| Variant | Measured |
|---|---|
| 2D camera | Our layouts leave no headroom: the grid fills the graphics band, so any zoom over ~5 % pushed the grid into the captions or the docked HUD into the kicker. The first cut failed the frame check twice. A camera needs layouts designed smaller inside a bigger world |
| Bed and effects -6 dB | Voice over bed 15.1 -> 21.4 dB (benchmark median 21.1), loudness unchanged |
| Recorded foley (Freesound) | Level-matched to the generated set (15.2 vs 15.1 dB); only the character changes |
| MMAudio video-to-foley | Synced: 10 of 11 visual events have a generated onset within 0.1 s (the first card deal 0.26 s late). Busier than ours: 124 onsets a minute vs 46. Runs on the 8 GB GPU in three ~8 s windows |

**Result:** the founder picked the camera (clip 2) for the hook and the plan. They also heard its
sound as better, though its audio was identical to Current, sample for sample: the picture lifts how
the sound is heard. So sound variants are only judged on top of the winning picture, never alone,
and the page now asks for a verdict per clip (better / same / worse) instead of one pick per scene,
since a single pick can't tell whether the losers beat the old baseline.

### Round 2 (2026-11-12): the quieter mix won; blur and both foley sources lost

Current = the round 1 camera. Variants on top of it: motion blur (`@remotion/motion-blur`,
5 samples, 180° shutter), MMAudio foley, bed and effects -6 dB, recorded foley. All five at
-16.1 to -16.3 LUFS. Key in `.scratch/reel-craft-research/round-02-key.md`.

**Result:** bed and effects -6 dB **better** (new baseline: camera + quieter mix, voice 21.4 dB over
the bed, the benchmark median). Motion blur **worse**, MMAudio foley **worse**, recorded foley
**worse**: the generated MOSS set stays, the frame stays sharp, and the factory gets no
video-to-foley step for now. No note left.

### Round 3 (2026-11-12): nothing beat Current

Current = camera + quieter mix. Variants: the 2.6 % as a level filling the grid (#7), reference
mastering to 3Blue1Brown's soundtrack with loudness kept (#17: brighter, spectral centre 333 -> 401
Hz, low-end share 63 -> 47 %), never-still holds (#3: slow push to 2.5 % + faint wobble), captions of
at most 3 words (#6). Key in `.scratch/reel-craft-research/round-03-key.md`.

**Result:** fill-the-grid **same**, never-still holds **same**, short captions **same**, reference
mastering **worse** ("the voice sounds boxed"). No winner, so by the stop rule the picture and mix
upgrades on this bench are done; "same" costs work and earns nothing, so none is adopted. The founder
heard harsh sibilance ("maths"): the voice chain gets a de-esser as a fix, not an A/B.

**Next: round 4 is a style-frame round** (see "Motion graphics generation"): the founder rejected the outro as a bench (its art is a leftover generated image) and asked for a review of how we generate art and motion.

### Round 4 (2026-11-12): draw-on and the host beat Current; engraved 3D lost

The real hook (frames 0-262: voice, captions, sound, cost, folds) in three directions, camera +
quieter mix underneath (`src/styleframes/`, composition `hook-looks`):
- **Engraved 3D** (`Engraved3D.tsx`): the aces as 3D cards on a round table, shaded by a custom
  hatching shader (line weight follows a tight lamp pool; lines too fine for a pixel sink into the
  black, so no moire); the camera settles after the slam and rises as the cost lands. Card faces
  are canvas textures, so the type stays exact. Fine moving lines are heavy to encode (86 MB at
  render, 9.5 MB at 9 Mbps with the hatching intact): test against Instagram's encoder before adopting.
- **Draw-on** (`DrawOn.tsx`): real Bodoni outlines (`scripts/glyph-paths.py`) traced, hatched, then
  filled letter by letter; the cards outline, hatch, fill, and get their rank and suit last.
- **Host** (`GentlemanHost.tsx`): the Gentleman (expressions v02, cell 1, background keyed to
  alpha) on the left in profile, watching the hook on his right; his head is a feathered cut-out
  that rotates at the neck: a glance at the slam, a double take on the cost, a shake on "nobody".
- **Layered scene**: deferred by the founder until a direction wins (art follows the direction). Local FLUX dev (`scripts/image-comfy.py`) crashed ComfyUI loading the
  17 GB all-in-one checkpoint with 16 GB RAM.

**Result:** draw-on **better**, the host **better**, engraved 3D **worse** (no note). The 3D route
(three.js, the hatching shader, layer 1 of the generation plan) is dropped; the draw-on vocabulary
and the performing Gentleman go forward, and the next round tests them together and inside the
rest of the reel.

**Correction (founder caught it):** round 4's host clip carried no sound effects (the hook's
effects lived inside the old hook component, which the host look replaced), so it was judged
with voice and music only. Round 5 re-tests it with identical audio across all clips (-16.5
LUFS, 41 effects a minute, voice 19.3 dB over the bed, measured), and Current was re-rendered
with the de-essed voice. Rule from here: style and picture rounds carry identical audio, measured
before publishing; the winning direction gets its own sound round.

### Round 5 (2026-11-12): host + draw-on is the provisional hook direction

With identical audio: host + draw-on **better**, host **better**, draw-on alone **same** (round 4's
"better" for draw-on likely came from the silent host clip beside it). The founder chose
**host + draw-on** over host alone, as a provisional direction: it was judged on the hook alone
and is re-judged once the whole reel's motion is rebuilt. Next: a sound round for this hook (strokes, the host's
reactions), then carrying the direction into the body (the grid drawing itself, the host reacting
at key moments, which needs new Gentleman poses).

## Brand proposals (outside the A/B rounds, founder decides)

- **Objects with a face.** Kurzgesagt's organs react; our engraved chips and cards could glance or
  flinch. Strong for retention, but it moves the brand from editorial to cartoon.
- **A colour field per section.** Kurzgesagt changes the background per idea; ours is always flat
  black. A warm-black / deep-green / oxblood rotation would mark sections, but breaks "flat black".
- **A game frame for a whole reel.** Kurzgesagt's EASY → HARD → EXPERT with an HP bar. A format,
  not a technique: e.g. "Fold or call: level 1, 2, 3". Worth a reel of its own.
