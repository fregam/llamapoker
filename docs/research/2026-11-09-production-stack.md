---
title: Content production stack — what to run locally, on a server, or via API
date: 2026-11-09
status: research / decision pending
---

# Production stack for LlamaPoker reels

**The question:** Reel 001 cost about 99 Higgsfield credits for 40 seconds, the motion felt
isolated and stiff, Arthur misread lines, and there was no music. What can we run ourselves,
what should we rent, and what does an API cost?

## 0. Hardware we have

| Part | Spec | What it means |
|---|---|---|
| GPU | RTX 4060, **8 GB VRAM** | Fine for voice, music, SFX and images. Video only with small/quantized models, slowly. |
| RAM | **16 GB** | The real bottleneck for local video (models offload to RAM). Upgrade to 64 GB ≈ €120–180. |
| CPU | Ryzen 7 7700X | Plenty. |
| Disk | 3 TB free on E: | Plenty for a media library. |

## 1. Why Reel 001 felt "isolated" (and the fix)

- Each 10-second block was generated as one clip with five cuts inside it. The model invents
  each shot on its own, so nothing connects: no shared action, no continuity, no rhythm.
- **Fix: generate shorter, precise shots (3–5 s each) from keyframes.** For each shot:
  make a still keyframe first (exact pose, framing, lighting) from our cast/set sheets, then
  animate it image-to-video with ONE described action. Chain shots by using the last frame of
  one as the first frame of the next where the action continues.
- **Cut to the voice, not to a 10 s grid.** Record narration first, then build the shot list on
  its words; each cut lands on a beat. Do the edit in code (Remotion, already in `apps/reels`),
  which also gives us on-screen numbers, the llamapoker.com end card and exact captions.
- **Sound bridges cuts:** a card snap or chip clack that starts on one shot and lands on the next
  (J/L cuts) makes separate clips feel like one scene.

## 2. Direction: what to borrow from great filmmakers (techniques, not their films)

Our brand is a dark, quiet card room and a deadpan gentleman who reads you. These directors'
*techniques* fit that, adapted to 9:16:

| From | Technique to adopt | How it looks in a LlamaPoker reel |
|---|---|---|
| David Fincher | Camera moves only when a character moves; precise, locked frames; procedural inserts | Tight inserts of hooves, cards, chips: the *procedure* of a decision. Slow push-ins, never wobbling. |
| Roger Deakins (cinematographer) | One motivated light source, silhouettes, strong negative space | The hanging lamp is the only light. Faces half in shadow. Black space for captions. |
| Edgar Wright | Rhythm editing: rapid insert montages cut on sound, match cuts, whip transitions | "Fold, fold, fold" as a 1-second montage of card snaps; a chip stack match-cut to a clock. |
| Wes Anderson | Centred, symmetrical frames; deadpan direct address; snap zooms; title-card beats | The Gentleman dead centre, looking into the lens for the payoff (the Read). Cheat-sheet beats as title cards. |
| Martin Scorsese | Narrator explaining "how the system works" over freeze frames and quick illustrative inserts | Voice-over explains, frame freezes on the key moment, a number appears. |
| Sergio Leone | Extreme close-ups of eyes in a standoff; silence before the cut | The "read" moment: eyes across the table, two seconds of quiet, then the reveal. |

**Rules for vertical (9:16):** tight framing with the character filling the frame; push-ins,
pull-outs and tilts instead of horizontal pans; key action in the upper two-thirds (captions and
app UI cover the bottom); hook in the first second; a visible change every 1–2 seconds.

## 3. Voice (local, free)

| Model | Licence | Cloning | Notes |
|---|---|---|---|
| **Chatterbox** (Resemble AI) | MIT | ~5 s sample | Best-rounded permissive option; top open-weight on TTS Arena per one source. Small (0.5B), runs on 8 GB. **Test first.** |
| **Qwen3-TTS** | Apache 2.0 | yes + voice design | Can *design* a new synthetic voice from a description, so no real person's voice is needed. **Test second.** |
| MOSS-TTS v1.5 / dots.tts | Apache 2.0 | yes | Strong in one blind cloning test. |
| Avoid commercially | — | — | XTTS-v2 (CPML), F5-TTS (weights CC BY-NC), Fish Audio S2 (non-commercial), IndexTTS-2 (custom licence). |

**Whose voice:** clone only a voice we have the right to use: your own, or a voice actor hired
with a written licence for AI cloning (common on voice marketplaces), or a synthetic voice
designed in Qwen3-TTS. Never a celebrity or anyone who hasn't agreed.

## 4. Music and sound effects (local, free)

| Model | Licence | Runs on 8 GB | Use |
|---|---|---|---|
| **ACE-Step 1.5** | MIT, output usable commercially | yes (<4 GB claimed) | Music beds: jazzy, noir, lounge. **Pick.** |
| **MOSS-SoundEffect v2.0** | Apache 2.0 | yes (1.3B) | Foley: card snaps, chip clacks, clock ticks, room tone. **Pick.** |
| Stable Audio Open | Community licence (free under $1M revenue) | yes | Backup for SFX/ambience. |
| MMAudio | check licence | yes | Generates sound *from a video clip*, synced. Worth testing. |
| Avoid commercially | — | — | YuE2 (CC BY-NC), Meta AudioGen weights (CC BY-NC). |

Also free: CC0 sound libraries (e.g. Freesound CC0) for basic foley.

## 5. Video: local vs rented GPU vs API

### On our PC (RTX 4060, 8 GB): free, slow, limited
- **Wan 2.2 TI2V-5B** (Apache 2.0) and **LTX-2.5** (quantized) through **WanGP**, a front-end
  built for low-VRAM cards. Expect 480–720p, minutes per 5 s clip, and 16 GB RAM will struggle.
- Good for testing prompts and drafts; probably not for final quality.

### Rented GPU by the minute (RunPod / Vast.ai): cheap, open models at full size
- RTX 4090 ≈ **$0.34–0.50/hour**, RTX 5090 ≈ $0.47–0.69/hour, H100 ≈ $0.90–4.40/hour
  (spot listings vary).
- Runs the full-size open models (Wan 2.2 14B, LTX-2.5) that don't fit on our card.
- Rough estimate (not benchmarked): a 40 s reel ≈ 12–15 shots ≈ under an hour on a 4090 ≈
  **under $1 of GPU time**, plus setup time. Quality below the best paid models.

### Video APIs (pay per generated second): best quality, predictable
Prices for 720p unless noted, Nov 2026, from comparison posts. **Verify on live pricing pages.**

| Model | ≈ $/second | 40 s reel* |
|---|---|---|
| Hailuo (MiniMax), via reseller | $0.04 (768p) | **~$3** |
| Kling 3.0 Standard (fal) | $0.084 no audio / $0.126 with audio | ~$6–8 |
| Veo 3.1 Fast (Google) | $0.10 with audio (1080p $0.12) | ~$7 |
| Wan 2.7 (fal) | $0.10 (1080p $0.15) | ~$7 |
| Seedance 2.5 | ~$0.21 (1080p ~$0.52) | ~$14 |
| Veo 3.1 (full, 1080p + audio) | ~$0.40 | ~$27 |

\* 12 shots × 4 s = 48 s, plus ~40 % retakes ≈ 67 generated seconds.

**Higgsfield today:** ~99 credits per 40 s reel. Divide what the plan costs by its credits to
compare in dollars.

## 6. Servers for the future agent workforce

| Option | ≈ Cost | When it makes sense |
|---|---|---|
| Always-on CPU VPS (Hetzner) | €5–20 / month | Agents, workflows, schedulers, site, database. **Start here.** |
| GPU on demand (RunPod serverless / pods) | pay per minute | Rendering video, voice and music only while a job runs. |
| Always-on GPU server (Hetzner GPU, monthly RTX 4090/5090 rental) | ~€180–350 / month | Only once the GPU is busy most of the day (daily volume of reels). |

**Recommended architecture:** a cheap always-on Hetzner box runs the agents and the job queue;
when a reel needs rendering it spins up a rented GPU, runs the open models, saves the files to
storage, and shuts the GPU down. Paid APIs (Kling/Hailuo) stay as a quality fallback for hero
shots.

## 7. Recommendation

1. **Voice:** install Chatterbox locally; test Qwen3-TTS voice design. Decide the Gentleman's
   voice (yours, a licensed actor, or designed).
2. **Music + SFX:** install ACE-Step 1.5 and MOSS-SoundEffect locally; build a small brand sound
   library (room tone, card snap, chip clack, clock, 3 lounge-noir beds).
3. **Video:** run one head-to-head test on the same 3 shots: local Wan 2.2 5B, rented-4090
   Wan 2.2 14B, Kling 3.0 and Hailuo via API. Pick on quality per dollar.
4. **Pipeline v2:** keyframes from our cast/set sheets → 3–5 s image-to-video shots →
   voice-first edit in Remotion with sound design, numbers and end card.
5. **Hardware:** 64 GB RAM is the cheapest upgrade that makes local video practical.

## Sources

- TTS: [Pinggy](https://pinggy.io/blog/best_open_source_self_hosted_text_to_speech_models/), [Yaps — licences checked](https://www.yaps.ai/blog/best-local-tts-models), [ScriptByAI](https://www.scriptbyai.com/best-open-source-tts-models/), [Eden AI](https://www.edenai.co/post/top-free-text-to-speech-tools-apis-and-open-source-models)
- Music: [ACE-Step 1.5 model card](https://huggingface.co/ACE-Step/Ace-Step1.5), [ACE-Step 1.5 GitHub](https://github.com/ace-step/ACE-Step-1.5), [ComfyUI blog](https://blog.comfy.org/p/ace-step-15-xl-commercial-grade-music), [Spheron guide](https://www.spheron.network/blog/deploy-open-source-ai-music-generation-gpu-cloud-2026/), [YuE2 (ThakiCloud)](https://thakicloud.com/tech-blog/en/owm/yue2-open-source-music-generation/)
- SFX: [MOSS-SoundEffect v2.0](https://studio.aifilms.ai/blog/moss-soundeffect-v2-open-source-sound-design), [Stable Audio Open](https://stability.ai/news-updates/introducing-stable-audio-open), [Invideo on MMAudio](https://invideo.io/blog/open-ai-voice-audio-models/)
- Local video: [WanGP](https://github.com/deepbeepmeep/WanGP), [LTX-Video](https://github.com/Lightricks/ltx-video), [Ossium 8–24 GB guide](https://blog.ossium.in/what-s-the-best-open-source-ai-video-model-you-can-actually-run-8gb-24gb-vram), [Thunder Compute](https://www.thundercompute.com/blog/best-open-source-ai-video-generation-models)
- API prices: [DEV — 100 videos cost](https://dev.to/arib_khan_ba8305927b74917/what-100-ai-videos-actually-cost-across-apis-seedance-25-veo-31-kling-466a), [Apiframe](https://apiframe.ai/blog/ai-video-api-pricing-2026), [Atlas Cloud](https://www.atlascloud.ai/blog/tips/cheapest-ai-video-generation-api-2026), [DevTk](https://devtk.ai/en/blog/ai-video-generation-pricing-2026/)
- GPU rental: [RunPod pricing](https://www.runpod.io/gpu-cloud/pricing), [Spheron comparison](https://www.spheron.network/blog/gpu-cloud-pricing-comparison-runpod-vs-vastai-2026/), [Vast.ai pricing](https://www.activepieces.com/blog/vast-ai-gpu-pricing-per-hour-in-2026-and-extra-fees.md)
- Vertical craft: [DEV — vertical composition](https://dev.to/cartney/vertical-video-composition-for-drama-the-2026-guide-567l), [Inorain](https://inorain.com/blog/vertical-filmmaking), [Film Shortage](https://filmshortage.com/the-vertical-revolution-why-916-is-the-new-frontier-for-indie-filmmakers/)

## 8. Proposed content file system

Text and recipes live in git; heavy media (video, audio, renders) lives outside git in a media
folder with the same layout (E:\llamapoker-media locally, later a storage bucket such as
Cloudflare R2), referenced from each item's `manifest.json`.

```
content/
  library/                     reusable brand production assets (one folder per kind)
    characters/  gentleman.md, rivals.md          ← description, prompt, generation ids, licence
    locations/   card-table.md, clock-corner.md, window-seat.md
    props/       chip-stack.md, pocket-aces.md
    voices/      gentleman-voice.md                ← model, voice sample, settings, consent/licence
    music/       noir-lounge-beds.md
    sfx/         card-snap.md, chip-clack.md …
    styles/      engraving.md                      ← style formula, style-key id
  reels/
    2026-11-08-only-aces/
      brief.md          idea, angle, hook, target viewer, link to the site page it promotes
      script.md         narration, word counts, measured timings
      shotlist.md       shot by shot: framing, action, camera, light, sound, duration
      manifest.json     every generation id, model, cost, file path in the media folder
      publish.md        caption, cover, posting date, links, results (views, saves, shares)
  letters/  articles/  social/  research/          (as now, one folder per item when it has media)
  _templates/  brief.md, script.md, shotlist.md, publish.md
```

Media folder mirror: `E:\llamapoker-media\reels\2026-11-08-only-aces\{keyframes,clips,audio\{vo,music,sfx},edit,renders}`.
