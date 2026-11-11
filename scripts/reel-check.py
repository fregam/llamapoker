"""Quality gate for a rendered reel: pace, sound and a contact sheet, against the approved reference.

Reel 002 v9 ("Only playing aces?") is the reference the founder approved; reel 003 v9 shipped
rushed (two sentences run together, 3.7 words/s in one take), busier and hotter in sound, with a
docked number sitting on a row of cards, and no check caught it. Every reel passes this before
the founder sees it; a FAIL goes back to the edit, not to review.

    python scripts/reel-check.py <reel-id> <render.mp4> [--sheet out.png]

Pace (from apps/reels/src/vo/<id>.json, the measured word times):
  - every pause after . ? ! >= 0.40 s, after : >= 0.30 s      (002: 0.42-0.70 and 0.34; fix: vo-breathe.py)
  - every take but the outro <= 3.5 words/s                    (002: 2.4-3.2)
  - whole reel <= 3.2 words/s                                  (002: 3.0)
Sound (from the render's audio):
  - peak <= -2.5 dBFS                                          (002: -2.9)
  - (info only) onsets a minute, 002: 114. Not a limit: it counts syllables as well as effects,
    so a faster read scores higher even with fewer effects (003 v10: 134 with ~49 effects a
    minute, 002: ~73). Effect levels are judged by the peak (plucks/reveals at 0.6-0.7) and by ear.
  - quiet floor (10th percentile of 0.4 s RMS) <= -30 dBFS     (002: -31)
Layout: an overview sheet (one frame a second, small) and detail pages (the same frames at half
size, eight a page: out/<id>.sheet-NN.png). Read every detail page; the numbers can't see a 36% on
a card, and the small overview can't see a rule line through a number.
Exit code 1 if any measured check fails.
"""

import argparse
import json
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = ROOT / "apps/reels/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe"
ENDS = (".", "?", "!", ":")
LIMITS = dict(min_sentence_gap=0.40, min_colon_gap=0.30, max_take_wps=3.5, max_reel_wps=3.2, max_peak_db=-2.5, max_floor_db=-30.0)


def db(v: float) -> float:
    return 20 * np.log10(max(v, 1e-9))


def pace(reel: str, vo_path: Path | None = None):
    vo = json.loads((vo_path or ROOT / "apps/reels/src/vo" / f"{reel}.json").read_text(encoding="utf-8"))
    rows, words, speech = [], 0, 0.0
    for t in vo["takes"]:
        ws, span = t["words"], t["to"] - t["from"]
        words += len(ws)
        speech += span
        wps = len(ws) / span
        if t["name"] != "outro" and wps > LIMITS["max_take_wps"]:
            rows.append(f"take {t['name']}: {wps:.2f} words/s > {LIMITS['max_take_wps']}")
        for a, b in zip(ws, ws[1:]):
            gap = b["s"] - a["e"]
            word = a["w"].rstrip('"”)')
            floor = LIMITS["min_colon_gap"] if word.endswith(":") else LIMITS["min_sentence_gap"]
            if word.endswith(ENDS) and gap < floor:
                rows.append(f"take {t['name']}: {a['w']!r} -> {b['w']!r} only {gap:.2f} s (run vo-breathe.py)")
    reel_wps = words / speech
    if reel_wps > LIMITS["max_reel_wps"]:
        rows.append(f"reel: {reel_wps:.2f} words/s > {LIMITS['max_reel_wps']}")
    return reel_wps, rows


def sound(mp4: Path, tmp: Path):
    wav = tmp / "a.wav"
    subprocess.run([str(FFMPEG), "-v", "error", "-y", "-i", str(mp4), "-map", "0:a", "-ac", "1", "-ar", "22050", str(wav)], check=True)
    with wave.open(str(wav)) as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    win = int(0.4 * sr)
    rms = np.array([np.sqrt(np.mean(x[i : i + win] ** 2)) for i in range(0, len(x) - win, win)])
    h = int(0.02 * sr)
    e = np.array([np.mean(x[i : i + h] ** 2) + 1e-10 for i in range(0, len(x) - h, h)])
    prev = np.convolve(e, np.ones(5) / 5, mode="full")[: len(e)]
    on = np.where(10 * np.log10(e[5:] / prev[4:-1]) > 6)[0]
    on = on[np.insert(np.diff(on) > 5, 0, True)]  # at most one onset per 100 ms
    peak_i = int(np.argmax(np.abs(x)))
    m = dict(dur=len(x) / sr, peak_db=db(float(np.abs(x[peak_i]))), peak_at=peak_i / sr,
             onsets_per_min=len(on) / (len(x) / sr) * 60, floor_db=db(float(np.percentile(rms, 10))))
    rows = []
    if m["peak_db"] > LIMITS["max_peak_db"]:
        rows.append(f"peak {m['peak_db']:.1f} dBFS at {m['peak_at']:.1f} s > {LIMITS['max_peak_db']}")
    if m["floor_db"] > LIMITS["max_floor_db"]:
        rows.append(f"floor {m['floor_db']:.1f} dBFS > {LIMITS['max_floor_db']} (bed too loud between words)")
    return m, rows


def tile(frames: list, labels: list, cols: int, out: Path):
    w, fh = frames[0].size
    rows = (len(frames) + cols - 1) // cols
    img = Image.new("RGB", (cols * w, rows * fh), (40, 40, 40))
    d = ImageDraw.Draw(img)
    for i, (f, label) in enumerate(zip(frames, labels)):
        x, y = (i % cols) * w, (i // cols) * fh
        img.paste(f, (x, y))
        d.rectangle([x, y, x + 46, y + 18], fill=(0, 0, 0))
        d.text((x + 4, y + 3), label, fill=(255, 220, 120))
    img.save(out)


def sheet(mp4: Path, dur: float, out: Path, tmp: Path) -> list[Path]:
    """An overview (one frame a second, 216 px wide: the shape of the reel) and detail pages
    (the same frames at 540 px, eight a page). The overview cannot show a hairline through a
    number: reel 003 v10 passed review with 35% cut by a rule line at 0:42. Read every detail page."""
    big = []
    for s in range(int(dur) + 1):
        p = tmp / f"f{s:03d}.png"
        subprocess.run([str(FFMPEG), "-v", "error", "-y", "-ss", f"{min(s + 0.5, dur - 0.05):.2f}", "-i", str(mp4), "-frames:v", "1", "-vf", "scale=540:-1", str(p)], check=True)
        big.append(Image.open(p).convert("RGB"))
    labels = [f"{s}.5s" for s in range(len(big))]
    tile([f.resize((216, f.height * 216 // 540)) for f in big], labels, 10, out)
    pages = [out]
    for n, i in enumerate(range(0, len(big), 8), 1):
        page = out.with_name(out.stem + f"-{n:02d}.png")
        tile(big[i : i + 8], labels[i : i + 8], 4, page)
        pages.append(page)
    return pages


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("reel")
    ap.add_argument("mp4", type=Path)
    ap.add_argument("--sheet", type=Path)
    ap.add_argument("--vo", type=Path, help="word-time manifest to check instead of src/vo/<id>.json (an older version)")
    args = ap.parse_args()
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        wps, pace_fail = pace(args.reel, args.vo)
        snd, sound_fail = sound(args.mp4, tmp)
        out = args.sheet or args.mp4.with_suffix(".sheet.png")
        pages = sheet(args.mp4, snd["dur"], out, tmp)
    print(f"{args.reel}: {snd['dur']:.1f} s, {wps:.2f} words/s, peak {snd['peak_db']:.1f} dBFS at {snd['peak_at']:.1f} s, "
          f"{snd['onsets_per_min']:.0f} onsets/min, floor {snd['floor_db']:.1f} dBFS")
    fails = pace_fail + sound_fail
    for r in fails:
        print("  FAIL", r)
    print(f"  overview: {pages[0]}")
    print(f"  detail:   {len(pages) - 1} pages, {pages[1].name} ... {pages[-1].name}")
    print("PASS (now read every detail page: numbers on lines, text on text)" if not fails else f"FAIL ({len(fails)})")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
