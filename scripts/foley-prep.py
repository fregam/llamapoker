"""Cut a recorded sound into a drop-in replacement for one of our effects.

    py -3.11 scripts/foley-prep.py <source audio> <name> [--max 1.2] [--swell-peak 0.33] [--skip 0.0]

Writes apps/reels/public/sfx-rec/<name>.wav: 48 kHz mono, matched in loudness (RMS over the sound)
to the generated apps/reels/public/sfx/<name>.wav, so an A/B between the two sets changes the
character of the sounds, not their level. Placement follows the sound.tsx rules:
  - a hit (default): the first onset after --skip lands 20 ms into the file
  - a swell (--swell-peak S): the loudest moment lands S seconds into the file (whoosh 0.33 s =
    10 frames, riser 0.73 s = 22 frames, matching their negative delays in the reels)
Peak is capped at -6 dBFS. Needs imageio-ffmpeg (py -3.11 -m pip install imageio-ffmpeg).
"""

import argparse
import subprocess
import tempfile
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 48000


def load(p: Path) -> np.ndarray:
    with tempfile.TemporaryDirectory() as t:
        w = Path(t) / "x.wav"
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-y", "-i", str(p), "-ac", "1", "-ar", str(SR), str(w)], check=True)
        with wave.open(str(w)) as f:
            return np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).astype(np.float32) / 32768


def active_rms(x: np.ndarray) -> float:
    """RMS over the part of the sound within 30 dB of its loudest 10 ms."""
    h = SR // 100
    r = np.sqrt(np.array([np.mean(x[i : i + h] ** 2) for i in range(0, len(x) - h, h)]) + 1e-12)
    return float(np.sqrt(np.mean(r[r > r.max() * 10 ** (-30 / 20)] ** 2)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src", type=Path)
    ap.add_argument("name")
    ap.add_argument("--max", type=float, default=1.2, help="seconds to keep")
    ap.add_argument("--swell-peak", type=float)
    ap.add_argument("--skip", type=float, default=0.0, help="ignore the first S seconds of the source")
    a = ap.parse_args()
    x = load(a.src)[int(a.skip * SR) :]
    h = SR // 200
    env = np.sqrt(np.convolve(x**2, np.ones(h) / h, "same"))
    if a.swell_peak is not None:
        peak = int(np.argmax(env[: int(4 * SR)]))
        start = peak - int(a.swell_peak * SR)
        x = np.concatenate([np.zeros(max(0, -start)), x[max(0, start) :]])
    else:
        onset = int(np.argmax(env > env.max() * 0.1))
        start = onset - int(0.02 * SR)
        x = np.concatenate([np.zeros(max(0, -start)), x[max(0, start) :]])
    x = x[: int(a.max * SR)].copy()
    fade = min(len(x) // 4, int(0.08 * SR))
    x[-fade:] *= np.linspace(1, 0, fade)
    ref = load(ROOT / "apps/reels/public/sfx" / f"{a.name}.wav")
    x *= active_rms(ref) / max(active_rms(x), 1e-9)
    peak = np.abs(x).max()
    if peak > 10 ** (-6 / 20):
        x *= 10 ** (-6 / 20) / peak
    out = ROOT / "apps/reels/public/sfx-rec" / f"{a.name}.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    print(f"{a.name}: {len(x) / SR:.2f} s, peak {20 * np.log10(np.abs(x).max() + 1e-9):.1f} dBFS -> {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
