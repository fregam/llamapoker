"""Give a reel's narration room to breathe: lengthen every sentence-end pause that is too short.

The counterpart of vo-tighten.py, which caps long silences (0.55 s). A sampled read sometimes runs
two sentences together (reel 003's "thirteen hearts in it. You can..." had 0.02 s between them),
and that reads as rushed next to a reel where every full stop gets a breath (reel 002: 0.42-0.70 s).
This pads each gap after a word ending in . ? ! or : up to --min (default 0.5 s), inserting silence
at the quietest 20 ms of the gap, and shifts the later word times in src/vo/<id>.words.json by the
same amount. Run vo-manifest.mjs afterwards so src/vo/<id>.json picks up the new lengths.

    python scripts/vo-breathe.py <reel-id> [--min 0.5] [--dry-run]

Reads/writes apps/reels/public/vo/<id>/<take>.wav (16-bit PCM) and apps/reels/src/vo/<id>.words.json.
Order in the voice chain: clean -> tighten -> split -> align -> breathe -> manifest.
"""

import argparse
import json
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
ENDS = (".", "?", "!", ":")


def read(path: Path):
    with wave.open(str(path)) as w:
        assert w.getsampwidth() == 2, f"{path}: expected 16-bit PCM"
        ch, sr = w.getnchannels(), w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, ch)
    return x, sr


def write(path: Path, x: np.ndarray, sr: int):
    with wave.open(str(path), "wb") as w:
        w.setnchannels(x.shape[1])
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(x.astype(np.int16).tobytes())


def quietest(x: np.ndarray, sr: int, a: float, b: float) -> int:
    """Sample index of the quietest 20 ms window between times a and b (falls back to the middle)."""
    win = max(1, int(0.02 * sr))
    lo, hi = int(a * sr), int(b * sr)
    if hi - lo <= win:
        return (lo + hi) // 2
    mono = x[lo:hi].astype(np.float32).mean(axis=1)
    e = np.convolve(mono**2, np.ones(win), mode="valid")
    return lo + int(np.argmin(e)) + win // 2


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("id")
    ap.add_argument("--min", type=float, default=0.5, help="shortest pause after a sentence end, seconds")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    words_path = ROOT / "apps/reels/src/vo" / f"{args.id}.words.json"
    words = json.loads(words_path.read_text(encoding="utf-8"))
    total = 0.0
    for take, ws in words.items():
        wav = ROOT / "apps/reels/public/vo" / args.id / f"{take}.wav"
        x, sr = read(wav)
        inserts = []  # (sample index, seconds to add, word index after which later words shift)
        for i, (a, b) in enumerate(zip(ws, ws[1:])):
            gap = b["s"] - a["e"]
            if a["w"].rstrip('"”)').endswith(ENDS) and gap < args.min:
                inserts.append((quietest(x, sr, a["e"], b["s"]), args.min - gap, i))
                print(f"  {take:8} {a['w']!r:>14} -> {b['w']!r:<12} {gap:.2f}s -> {args.min:.2f}s")
        if not inserts:
            continue
        # Splice from the end so earlier sample indices stay valid; shift word times from the start.
        out = x
        for at, add, _ in sorted(inserts, reverse=True):
            out = np.concatenate([out[:at], np.zeros((int(round(add * sr)), x.shape[1]), dtype=x.dtype), out[at:]])
        shift = 0.0
        for at, add, i in sorted(inserts):
            shift += add
            for w in ws[i + 1 :]:
                w["s"] = round(w["s"] + add, 3)
                w["e"] = round(w["e"] + add, 3)
        total += shift
        if not args.dry_run:
            write(wav, out, sr)
    if not args.dry_run:
        words_path.write_text(json.dumps(words, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{'would add' if args.dry_run else 'added'} {total:.2f}s of breath")


if __name__ == "__main__":
    main()
