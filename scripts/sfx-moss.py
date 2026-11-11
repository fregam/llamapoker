"""Generate the reels' sound effects with MOSS-SoundEffect v2.0, locally (Apache 2.0, 48 kHz).

    C:/Users/matia/Documents/moss-tts/moss_soundeffect_v2/.venv/Scripts/python.exe scripts/sfx-moss.py [names...]

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
    "tick": ("A single short dry click of a mechanical counter advancing one step, close-miked, no reverb.", 1, 3),
    "pluck": ("One soft muted pluck of a nylon guitar string, a single clean note, close, short decay.", 1.5, 3),
    "fold": ("Two playing cards tossed face down onto a felt poker table, a soft slide and a dull landing, close.", 1.5, 3),
    "deal": ("A single playing card dealt quickly across a felt table and snapping flat, close-miked.", 1.5, 3),
    "chip": ("Two poker chips clicking together once in a hand, bright and short, close, no room.", 1.5, 3),
    "whoosh": ("A short smooth air whoosh passing left to right, cinematic, clean, half a second.", 1.5, 3),
    "stamp": ("A single heavy rubber stamp hitting paper on a wooden desk once, a low thump with a snap.", 1.5, 3),
    "reveal": ("A soft, short, warm two-note bell chime, gentle, like a notification, with a brief tail.", 2, 3),
}


def trim(x: np.ndarray, sr: int, max_s: float) -> np.ndarray:
    """Cut to the first transient (−40 dB below peak) and fade the tail; cap the length."""
    peak = np.abs(x).max() + 1e-9
    thr = peak * 10 ** (-40 / 20)
    idx = np.where(np.abs(x) > thr)[0]
    if not len(idx):
        return x[: int(sr * max_s)]
    a = max(0, idx[0] - int(0.005 * sr))
    y = x[a : a + int(sr * max_s)]
    tail = min(len(y), int(0.08 * sr))
    y[-tail:] *= np.linspace(1, 0, tail)
    return y / (np.abs(y).max() + 1e-9) * 10 ** (-6 / 20)


def main(names: list[str]) -> None:
    from moss_soundeffect_v2 import MossSoundEffectPipeline

    pipe = MossSoundEffectPipeline.from_pretrained("OpenMOSS-Team/MOSS-SoundEffect-v2.0", torch_dtype=torch.bfloat16, device="cuda")
    OUT.mkdir(parents=True, exist_ok=True)
    BOARD.mkdir(parents=True, exist_ok=True)
    for name, (prompt, seconds, k) in SOUNDS.items():
        if names and name not in names:
            continue
        for i in range(k):
            torch.manual_seed(100 + i)
            audio = pipe(prompt=prompt, seconds=seconds, num_inference_steps=100, cfg_scale=4.0)
            tmp = BOARD / f"{name}-{i + 1}.raw.wav"
            pipe.save_audio(audio, str(tmp))
            x, sr = sf.read(str(tmp), dtype="float32", always_2d=True)
            y = trim(x.mean(1), sr, max_s=seconds)
            cand = BOARD / f"{name}-{i + 1}.wav"
            sf.write(str(cand), y, sr, subtype="PCM_16")
            tmp.unlink()
            print(f"{name}-{i + 1}: {len(y) / sr:.2f} s")
        shutil.copy2(BOARD / f"{name}-1.wav", OUT / f"{name}.wav")
    print(f"done; candidates in {BOARD.relative_to(ROOT)}, first of each copied to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main(sys.argv[1:])
