"""De-ess the voice takes of a reel: tame sharp "s" sounds without touching anything else.

    py -3.11 scripts/vo-deess.py <reel-id> [--over 3] [--max-cut 6] [--dry-run]

Founder, 2026-11-12: "de-s the voice a little, when he says maths the s is really sharp."
A split-band de-esser on every take in apps/reels/public/vo/<id>/ (not the _whole* sources). It
only touches the sibilants that are louder than this voice's usual "s": the threshold is the median
4.5-10 kHz level over all sibilant frames of the reel (band > half the frame's energy) plus --over dB;
above it the band alone is compressed 3:1, by at most --max-cut dB, with fast attack and slow
release. (A ratio trigger cut every "s" by the full amount: an "s" carries 95 % of its energy in
the band anyway.) Length and timing are unchanged, so the word alignment stays valid. Run it after
vo-breathe, as the last step of the voice chain. The takes are tracked in git, so the originals can
be restored from there.
"""

import argparse
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
N, HOP = 1024, 256
BAND = (4500.0, 10000.0)


def read(p: Path):
    with wave.open(str(p)) as w:
        sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return x.reshape(-1, ch).mean(1) if ch > 1 else x, sr


def write(p: Path, x: np.ndarray, sr: int):
    with wave.open(str(p), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def stft(x):
    pad = np.concatenate([np.zeros(N), x, np.zeros(N)])
    win = np.hanning(N)
    frames = np.lib.stride_tricks.sliding_window_view(pad, N)[::HOP] * win
    return np.fft.rfft(frames, axis=1), len(x)


def istft(S, length):
    win = np.hanning(N)
    frames = np.fft.irfft(S, n=N, axis=1) * win
    out = np.zeros(HOP * (len(frames) - 1) + N)
    norm = np.zeros_like(out)
    for i, f in enumerate(frames):
        out[i * HOP : i * HOP + N] += f
        norm[i * HOP : i * HOP + N] += win**2
    out /= np.maximum(norm, 1e-8)
    return out[N : N + length]


def band_levels(x, sr):
    S, length = stft(x)
    f = np.fft.rfftfreq(N, 1 / sr)
    # soft band edges (200 Hz ramps) so the cut never leaves a hard notch
    band = np.clip(np.minimum((f - BAND[0] + 200) / 400, (BAND[1] + 200 - f) / 400), 0, 1)
    P = np.abs(S) ** 2
    Eb = (P * band).sum(1)
    Et = P.sum(1) + 1e-12
    return S, length, band, 10 * np.log10(Eb + 1e-12), Eb / Et, Et


def deess(x, sr, threshold, max_cut):
    S, length, band, bd, r, Et = band_levels(x, sr)
    over = np.where((r > 0.5) & (Et > Et.max() * 1e-4), bd - threshold, 0)
    cut = np.clip(over * (1 - 1 / 3), 0, max_cut)  # 3:1 above the threshold
    want = 10 ** (-cut / 20)
    # attack fast (1 frame), release slow (~4 frames)
    g = np.ones_like(want)
    for i in range(len(want)):
        prev = g[i - 1] if i else 1.0
        g[i] = want[i] if want[i] < prev else prev + (want[i] - prev) * 0.25
    S = S * (1 - band[None, :] * (1 - g[:, None]))
    return istft(S, length), int((cut > 0.5).sum()), float(cut.max())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("reel")
    ap.add_argument("--over", type=float, default=3.0, help="dB above the median sibilant level where cutting starts")
    ap.add_argument("--max-cut", type=float, default=6.0)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    d = ROOT / "apps/reels/public/vo" / a.reel
    takes = [p for p in sorted(d.glob("*.wav")) if not p.name.startswith("_") and ".raw" not in p.name]
    audio = {p: read(p) for p in takes}
    sib = []
    for x, sr in audio.values():
        _, _, _, bd, r, Et = band_levels(x, sr)
        sib.append(bd[(r > 0.5) & (Et > Et.max() * 1e-4)])
    threshold = float(np.median(np.concatenate(sib))) + a.over
    print(f"threshold {threshold:.1f} dB (median sibilant + {a.over} dB), 3:1, max {a.max_cut} dB")
    for p, (x, sr) in audio.items():
        y, n, deepest = deess(x, sr, threshold, a.max_cut)
        print(f"{p.name}: {n} frames cut, deepest {deepest:.1f} dB")
        if not a.dry_run:
            write(p, y, sr)


if __name__ == "__main__":
    main()
