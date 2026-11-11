"""Generate the reels' sound effects with MOSS-SoundEffect v2.0, locally (Apache 2.0, 48 kHz).

    C:/Users/matia/Documents/moss-tts/moss_soundeffect_v2/.venv/Scripts/python.exe scripts/sfx-moss.py [names...]
    ...python.exe scripts/sfx-moss.py --recut [names...]      re-cut public/sfx from the board, no generation

Writes apps/reels/public/sfx/<name>.wav for every entry in SOUNDS (or only the names given), each
trimmed to its first transient, faded, and peak-normalised to -6 dBFS, so it drops in over the
synthesised set with the same file names (scripts/sfx-synth.py). Several candidates per sound are
written to media/tests/2026-11-11_sfx-board/<name>-<k>.wav; the first is copied to public/sfx.
Weights download to the Hugging Face cache on first run (about 11 GB).
"""
import shutil
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "apps/reels/public/sfx"
BOARD = ROOT / "media/tests/2026-11-11_sfx-board"

# name: (prompt, seconds, candidates). Prompts describe one dry, close, single event.
SOUNDS = {
    "tick": ("A single short dry click of a mechanical counter advancing one step, close-miked, no reverb.", 1, 2),
    "pluck": ("One soft muted pluck of a nylon guitar string, a single clean note, close, short decay.", 1.5, 2),
    "fold": ("Two playing cards tossed face down onto a felt poker table, a soft slide and a dull landing, close.", 1.5, 2),
    "deal": ("A single playing card dealt quickly across a felt table and snapping flat, close-miked.", 1.5, 2),
    "chip": ("Two poker chips clicking together once in a hand, bright and short, close, no room.", 1.5, 2),
    "whoosh": ("A short smooth air whoosh passing left to right, cinematic, clean, half a second.", 1.5, 2),
    "stamp": ("A single heavy rubber stamp hitting paper on a wooden desk once, a low thump with a snap.", 1.5, 2),
    "reveal": ("A soft, short, warm two-note bell chime, gentle, like a notification, with a brief tail.", 2, 2),
    "riser": ("A short cinematic riser: a smooth filtered white-noise swell rising in pitch over one second, clean, ending abruptly.", 1.5, 2),
    "boom": ("A deep, soft cinematic sub-bass boom hit, single, short, no reverb tail.", 1.5, 2),
    "blip": ("A tiny soft rounded UI blip, a single very short muted tone, dry, close.", 1, 2),
    "shuffle": ("A single quick riffle shuffle of a deck of playing cards, close, dry, half a second.", 1.5, 2),
}


HITS = {"tick", "chip", "deal", "fold", "stamp", "boom", "blip", "shuffle"}  # percussive: the peak lands 20 ms in
CAPS = {"tick": 0.25, "chip": 0.45, "deal": 0.45, "fold": 0.7, "stamp": 0.6, "boom": 0.8, "blip": 0.25, "shuffle": 0.7, "pluck": 0.9, "reveal": 1.3, "whoosh": 0.9, "riser": 1.2}


def trim(x: np.ndarray, sr: int, name: str) -> np.ndarray:
    """Cut a candidate so it lands on its cue: a hit is cut 20 ms before its loudest sample; a
    swell (whoosh, riser, bell, pluck) starts at its first onset (within 20 dB of the loudest
    5 ms window). Capped per sound, faded, peak-normalised to -6 dBFS."""
    cap = CAPS.get(name, 1.0)
    if name in HITS:
        a = max(0, int(np.argmax(np.abs(x))) - int(0.02 * sr))
    else:
        win = int(sr * 0.005)
        e = np.array([np.mean(x[i : i + win] ** 2) for i in range(0, len(x) - win, win)])
        a = max(0, int(np.argmax(e > e.max() * 10 ** (-20 / 10))) * win - int(0.01 * sr))
    y = x[a : a + int(sr * cap)].copy()
    fi = min(len(y), int(0.003 * sr))
    y[:fi] *= np.linspace(0, 1, fi)
    tail = min(len(y), int(0.06 * sr))
    y[-tail:] *= np.linspace(1, 0, tail)
    return y / (np.abs(y).max() + 1e-9) * 10 ** (-6 / 20)


def recut(names: list[str]) -> None:
    """Re-cut public/sfx from the board candidates (candidate 1) without generating."""
    for name in SOUNDS:
        if names and name not in names:
            continue
        src = BOARD / f"{name}-1.wav"
        if not src.exists():
            continue
        x, sr = sf.read(str(src), dtype="float32", always_2d=True)
        y = trim(x.mean(1), sr, name)
        sf.write(str(OUT / f"{name}.wav"), y, sr, subtype="PCM_16")
        print(f"{name:8s} {len(y) / sr:.2f} s, peak at {int(np.argmax(np.abs(y))) / sr:.3f} s")


def main(names: list[str]) -> None:
    if names[:1] == ["--recut"]:
        recut(names[1:])
        return
    from moss_soundeffect_v2 import MossSoundEffectPipeline

    pipe = MossSoundEffectPipeline.from_pretrained("OpenMOSS-Team/MOSS-SoundEffect-v2.0", torch_dtype=torch.bfloat16, device="cuda")
    # 8 GB card: keep only the stage in use (text encoder, DiT, VAE) on the GPU, the rest on the CPU.
    # (The pipeline calls load_models_to_device() between stages; this flag makes it offload.)
    pipe.engine.vram_management_enabled = True
    # The DiT arrives in float32 (5.4 GB) whatever torch_dtype says; bf16 halves it and fits.
    # Cast floating tensors only: the rotary-embedding buffer is complex and must stay complex.
    for m in pipe.engine.dit.modules():
        for n, p in m._parameters.items():
            if p is not None and p.is_floating_point():
                p.data = p.data.to(torch.bfloat16)
        for n, b in m._buffers.items():
            if b is not None and b.is_floating_point():
                m._buffers[n] = b.to(torch.bfloat16)
    OUT.mkdir(parents=True, exist_ok=True)
    BOARD.mkdir(parents=True, exist_ok=True)
    for name, (prompt, seconds, k) in SOUNDS.items():
        if names and name not in names:
            continue
        for i in range(k):
            torch.manual_seed(100 + i)
            audio = pipe(prompt=prompt, seconds=seconds, num_inference_steps=60, cfg_scale=4.0)
            # (B, C, T) tensor -> mono numpy; saved with soundfile (torchaudio.save needs torchcodec)
            a = audio[0] if audio.dim() == 3 else audio
            x = a.float().cpu().numpy()
            x = x.mean(0) if x.ndim == 2 else x
            sr = int(getattr(pipe, "sample_rate", 48000))
            cand = BOARD / f"{name}-{i + 1}.wav"
            sf.write(str(cand), x.astype(np.float32), sr, subtype="PCM_16")  # the board keeps the uncut take
            y = trim(x.astype(np.float32), sr, name)
            print(f"{name}-{i + 1}: {len(y) / sr:.2f} s")
        sf.write(str(OUT / f"{name}.wav"), trim(sf.read(str(BOARD / f"{name}-1.wav"), dtype="float32", always_2d=True)[0].mean(1), sr, name), sr, subtype="PCM_16")
    print(f"done; candidates in {BOARD.relative_to(ROOT)}, first of each copied to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main(sys.argv[1:])
