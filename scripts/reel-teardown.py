"""Measure how a short-form video moves and sounds, so our reels can be compared with the best.

    py -3.11 scripts/reel-teardown.py <video.mp4> [--words words.json3|vo.json] [--out dir] [--sheet]

Used for the reel craft research (docs/research/2026-11-12-reel-craft-research.md). Writes
<out>/<stem>.teardown.json and prints one summary line. Needs Demucs on the system Python 3.11
(voice / everything-else split, CPU is fine for a minute of audio).

Picture (64x114 grey frames at 30 fps):
  cuts            hard cuts (ffmpeg scdet), cuts a minute and the median shot length
  still_share     share of frames that barely change (mean abs diff < 0.6 of 255): held frames
  motion_median   median frame-to-frame change: how much is always moving
Sound (full mix and the two Demucs stems):
  lufs, lra       integrated loudness and loudness range of the mix (EBU R128)
  peak_db         sample peak of the mix
  voice_over_bed  voice level minus music+effects level while someone speaks (dB): the mix margin
  duck_db         music+effects level in the pauses minus under the voice (dB): how hard it ducks
  fx_per_min      onsets in the music+effects stem a minute (no syllables: the voice is removed)
  fx_on_cut       share of hard cuts with an effects onset within 0.1 s: sound marks the cut
  bed_low_share   share of the music+effects energy below 150 Hz (lost on a phone speaker)
  bed_centroid    spectral centroid of the music+effects stem (Hz): how bright the bed and effects are
Words (YouTube json3 captions, or our vo.json):
  wps             words a second over the voiced span
"""

import argparse
import importlib.util
import json
import re
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
# A full build (scdet, ebur128, rawvideo); the Remotion bundle lacks them. py -3.11 -m pip install imageio-ffmpeg
import imageio_ffmpeg
FFMPEG = Path(imageio_ffmpeg.get_ffmpeg_exe())
SR = 22050


def run(args, **kw):
    return subprocess.run([str(FFMPEG), "-v", "error", "-y", *args], check=True, **kw)


def read_wav(p: Path) -> np.ndarray:
    with wave.open(str(p)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        ch = w.getnchannels()
    return x.reshape(-1, ch).mean(1) if ch > 1 else x


def db(v):
    return 20 * np.log10(np.maximum(v, 1e-9))


def frames_rms(x, hop):
    n = len(x) // hop
    return np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1))


def onsets(x, hop=None):
    """Spectral-flux peaks above 3x the local median, at most one per 60 ms. Calibrated on reel 002
    v9: 53 a minute on its effects stem, against ~52 counted from its SoundDesign (ticks, stamps,
    deals, whooshes). The reel-check energy rule found 14: effects under a bed rarely rise 6 dB."""
    n, h = 1024, 512
    fr = np.lib.stride_tricks.sliding_window_view(x, n)[::h] * np.hanning(n)
    L = np.log1p(100 * np.abs(np.fft.rfft(fr, axis=1)))
    flux = np.maximum(np.diff(L, axis=0), 0).sum(1)
    med = np.convolve(flux, np.ones(31) / 31, "same")
    pk = np.where((flux[1:-1] > flux[:-2]) & (flux[1:-1] >= flux[2:]) & (flux[1:-1] > med[1:-1] * 3 + flux.mean() * 0.3))[0] + 1
    pk = pk[np.insert(np.diff(pk) > int(0.06 * SR / h), 0, True)]
    return (pk + 1) * h / SR


def picture(mp4: Path):
    raw = subprocess.run([str(FFMPEG), "-v", "error", "-i", str(mp4), "-vf", "fps=30,scale=64:114,format=gray",
                          "-f", "rawvideo", "-"], check=True, capture_output=True).stdout
    f = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 114, 64).astype(np.float32)
    d = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
    err = subprocess.run([str(FFMPEG), "-v", "info", "-i", str(mp4), "-vf", "scdet=threshold=12", "-an", "-f", "null", "-"],
                         capture_output=True, text=True, errors="replace").stderr
    cuts = sorted({round(float(t), 2) for t in re.findall(r"lavfi\.scd\.time:\s*([\d.]+)", err)})
    dur = len(f) / 30
    shots = np.diff([0, *cuts, dur])
    return dict(dur=round(dur, 1), cuts=len(cuts), cuts_per_min=round(len(cuts) / dur * 60, 1),
                shot_median_s=round(float(np.median(shots)), 2), still_share=round(float(np.mean(d < 0.6)), 2),
                motion_median=round(float(np.median(d)), 2)), cuts


def words(path: Path | None):
    if not path or not path.exists():
        return {}
    j = json.loads(path.read_text(encoding="utf-8"))
    times = []
    if "takes" in j:  # our vo.json: word times are per take, so rate = words / voiced span
        n = sum(len(t["words"]) for t in j["takes"])
        return dict(words=n, wps=round(n / sum(t["to"] - t["from"] for t in j["takes"]), 2))
    else:  # YouTube json3
        for ev in j.get("events", []):
            for s in ev.get("segs", []) or []:
                if s.get("utf8", "").strip():
                    times.append((ev["tStartMs"] + s.get("tOffsetMs", 0)) / 1000)
    if len(times) < 2:
        return {}
    return dict(words=len(times), wps=round(len(times) / (times[-1] - times[0]), 2))


def sound(mp4: Path, tmp: Path, cuts):
    mix = tmp / "mix.wav"
    run(["-i", str(mp4), "-map", "0:a", "-ac", "2", "-ar", "44100", str(mix)])
    err = subprocess.run([str(FFMPEG), "-v", "info", "-i", str(mix), "-af", "ebur128", "-f", "null", "-"],
                         capture_output=True, text=True, errors="replace").stderr
    summ = err[err.rfind("Summary:"):]
    lufs = float(re.search(r"I:\s*(-?[\d.]+) LUFS", summ).group(1))
    lra = float(re.search(r"LRA:\s*([\d.]+) LU", summ).group(1))
    subprocess.run([sys.executable, "-m", "demucs", "--two-stems", "vocals", "-n", "htdemucs", "-d", "cpu",
                    "-o", str(tmp), str(mix)], check=True, capture_output=True)
    stem = tmp / "htdemucs" / "mix"
    for name in ("vocals", "no_vocals"):
        run(["-i", str(stem / f"{name}.wav"), "-ac", "1", "-ar", str(SR), str(tmp / f"{name}.wav")])
    voice, bed = read_wav(tmp / "vocals.wav"), read_wav(tmp / "no_vocals.wav")
    full = read_wav(mix)
    hop = int(0.02 * SR)
    v, b = db(frames_rms(voice, int(0.1 * SR))), db(frames_rms(bed, int(0.1 * SR)))
    n = min(len(v), len(b))
    v, b = v[:n], b[:n]
    speaking = v > v.max() - 30
    pause = (v < v.max() - 40)
    fx = onsets(bed)
    spec = np.abs(np.fft.rfft(bed[: SR * 60] if len(bed) > SR * 60 else bed))
    fr = np.fft.rfftfreq(len(bed[: SR * 60]) if len(bed) > SR * 60 else len(bed), 1 / SR)
    power = spec ** 2
    out = dict(lufs=lufs, lra=lra, peak_db=round(float(db(np.abs(full).max())), 1),
               voice_over_bed=round(float(np.median(v[speaking]) - np.median(b[speaking])), 1) if speaking.any() else None,
               duck_db=round(float(np.median(b[pause]) - np.median(b[speaking])), 1) if pause.sum() > 5 and speaking.any() else None,
               fx_per_min=round(len(fx) / (len(bed) / SR) * 60, 1),
               fx_on_cut=round(float(np.mean([np.any(np.abs(fx - c) < 0.1) for c in cuts])), 2) if cuts else None,
               bed_low_share=round(float(power[fr < 150].sum() / power.sum()), 2),
               bed_centroid=int((fr * power).sum() / power.sum()))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    ap.add_argument("--words", type=Path)
    ap.add_argument("--out", type=Path)
    ap.add_argument("--sheet", action="store_true", help="also write contact sheets (reel-check's)")
    a = ap.parse_args()
    out = a.out or a.video.parent.parent / "teardown"
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        pic, cuts = picture(a.video)
        snd = sound(a.video, tmp, cuts)
        res = dict(video=a.video.name, **pic, **snd, **words(a.words), cut_times=cuts)
        if a.sheet:
            spec = importlib.util.spec_from_file_location("rc", ROOT / "scripts/reel-check.py")
            rc = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(rc)
            rc.sheet(a.video, pic["dur"] - 1, out / f"{a.video.stem}.sheet.png", tmp)
    (out / f"{a.video.stem}.teardown.json").write_text(json.dumps(res, indent=1), encoding="utf-8")
    print(json.dumps({k: v for k, v in res.items() if k != "cut_times"}))


if __name__ == "__main__":
    main()
