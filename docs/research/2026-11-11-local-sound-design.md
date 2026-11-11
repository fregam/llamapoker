# Local sound design stack for the reels (2026-11-11)

The reels had voice only. The user asked for a real sound layer, a cleaner voice and local tools.
Nothing on the machine generated audio (ComfyUI had no music or effects models; the Remotion ffmpeg
has only `adelay`, `amix`, `atempo`, `volume`). Chosen, all free and local:

| Job | Tool | Licence | Fit on the RTX 4060 (8 GB) | Status |
|---|---|---|---|---|
| Music bed | **ACE-Step 1.5 Turbo** in ComfyUI (official nodes) | MIT | < 4 GB VRAM, a 2-min bed in seconds | files downloaded (`models/diffusion_models/acestep_v1.5_turbo.safetensors` 4.8 GB, `text_encoders/qwen_0.6b_ace15` 1.2 GB + `qwen_1.7b_ace15` 3.7 GB, `vae/ace_1.5_vae` 0.3 GB); needs the ComfyUI Desktop core updated (the Jan-2026 core has no `TextEncodeAceStepAudio1.5`) |
| Sound effects | **MOSS-SoundEffect v2.0** (OpenMOSS, May 2026) | Apache 2.0 | 1.3B params, bf16, 48 kHz, ≤ 30 s | own venv at `C:\Users\matia\Documents\moss-tts\moss_soundeffect_v2` (install run by the user: the sandbox refuses to clone external code); weights (11 GB) download on first run |
| Voice cleaning | **DeepFilterNet 3** | MIT | CPU, seconds per take | works on the system Python 3.11 with `torch==2.8.0 torchaudio==2.8.0` (CPU wheels) + `soundfile`; the ComfyUI venv (3.12) has no wheel, and torchaudio 2.9 removed `torchaudio.backend` which DeepFilterNet imports |

Rejected: Stable Audio Open / Open Small (gated, Stability community licence), MMAudio and
AudioGen (non-commercial weights), MusicGen (CC-BY-NC), paid APIs (Higgsfield music, ElevenLabs
SFX). Sources: [ComfyUI blog on ACE-Step 1.5](https://blog.comfy.org/p/ace-step-15-is-now-available-in-comfyui),
[ComfyUI wiki](https://comfyui-wiki.com/en/news/2026-01-23-ace-step-1-5-music-generation),
[MOSS-SoundEffect v2.0 model card](https://huggingface.co/OpenMOSS-Team/MOSS-SoundEffect-v2.0).

## Scripts

- `scripts/music-comfy.mjs --out apps/reels/public/music/bed.wav --seconds 120 --batch 4`: the bed
  through the ComfyUI API (UNETLoader → DualCLIPLoader type `ace` with both Qwen encoders →
  TextEncodeAceStepAudio1.5 with lyrics `[inst]` → EmptyAceStep1.5LatentAudio →
  ModelSamplingAuraFlow shift 3 → KSampler 8 steps, cfg 1, euler/simple → VAEDecodeAudio),
  levelled to −18 LUFS mono 48 kHz. Tags for the brand bed are in the script: ambient, cinematic,
  minimal, dark, warm pads, sub drone, felt piano, 72 bpm, D minor, no vocals.
- `scripts/sfx-moss.py`: the eight effects (tick, pluck, fold, deal, chip, whoosh, stamp, reveal),
  three candidates each into `media/tests/2026-11-11_sfx-board/`, first of each copied to
  `apps/reels/public/sfx/`. Prompts describe one dry, close, single event.
- `scripts/sfx-synth.py`: the **provisional** set, synthesised with numpy/scipy, same names, plus
  a 60 s procedural ambient bed. Built so the sound layer (`apps/reels/src/sound.tsx`) could be
  written and rendered before the generators were usable. In use until the generated set lands.
- `scripts/vo-enhance.py <id>`: DeepFilterNet on every take (keeps `<take>.raw.wav`), then
  loudnorm back to −16 LUFS. Measured on reel 003's "sheet" take: floor between words −30.4 →
  −38.9 dBFS, speech level unchanged (−15.5 dBFS), transcript unchanged.

## MOSS-SoundEffect on an 8 GB card: three gotchas

1. `torch.compile` is on by default and needs Triton, which Windows has no wheel for → run with
   `TORCH_COMPILE_DISABLE=1`.
2. The DiT loads in **float32** (1.42B params, 5.4 GB) whatever `torch_dtype` says; with the text
   encoder (1.72B, bf16) and the VAE (0.37B, fp32) all on the GPU that is 10 GB → OOM, and with
   the driver's system-memory fallback it "works" at 16 s per step. Fix in `scripts/sfx-moss.py`:
   `pipe.engine.vram_management_enabled = True` (the pipeline then keeps only the stage in use
   on the GPU) and `pipe.engine.dit.to(torch.bfloat16)`.
3. `pipe.save_audio` goes through torchaudio 2.9, which now needs torchcodec (not installed, no
   wheel for this setup) → the script saves the `(B, C, T)` tensor with soundfile itself.
4. With the DiT in bf16 a 1.5 s clip takes about 25 s at 60 steps (2.4 it/s); two candidates per
   sound, eight sounds, under ten minutes.

## Mixing rules (in `sound.tsx`)

Voice at −16 LUFS. Bed −20 dB under the voice while it speaks, −12 dB in the pauses between takes,
−9 dB before the first word and after the last (hook and loop point), 10-frame ramps. Effects
peak at −6 dBFS in the file and are placed with a per-use gain (0.5–1.0). One sound per change on
screen; the same sound for the same kind of change.
