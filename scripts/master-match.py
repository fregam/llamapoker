"""Reference mastering: match a reel's mix to a reference soundtrack's tone and dynamics.

    py -3.11 scripts/master-match.py <reel.mp4> <reference video or audio> <out.mp4> [--keep-loudness]

Uses matchering (GPL-3, py -3.11 -m pip install matchering) to give the reel's audio the reference's
frequency balance, peak and RMS character, then (with --keep-loudness, the A/B default) puts the
result back at the reel's original integrated loudness, so an A/B compares the tone and not the
level. The picture is copied untouched.
"""

import argparse
import re
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg
import matchering as mg

FF = imageio_ffmpeg.get_ffmpeg_exe()


def ff(*args):
    subprocess.run([FF, "-v", "error", "-y", *map(str, args)], check=True)


def lufs(p: Path) -> float:
    err = subprocess.run([FF, "-v", "info", "-i", str(p), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True, errors="replace").stderr
    return float(re.search(r"I:\s*(-?[\d.]+) LUFS", err[err.rfind("Summary:"):]).group(1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("reel", type=Path)
    ap.add_argument("reference", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--keep-loudness", action="store_true")
    a = ap.parse_args()
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        target, ref, mastered = tmp / "target.wav", tmp / "ref.wav", tmp / "mastered.wav"
        ff("-i", a.reel, "-vn", "-ac", "2", "-ar", "44100", target)
        ff("-i", a.reference, "-vn", "-ac", "2", "-ar", "44100", ref)
        mg.process(target=str(target), reference=str(ref), results=[mg.pcm24(str(mastered))])
        gain = lufs(target) - lufs(mastered) if a.keep_loudness else 0.0
        ff("-i", a.reel, "-i", mastered, "-filter_complex", f"[1:a]volume={gain:.2f}dB,alimiter=limit=0.75:level=false[m]",
           "-map", "0:v", "-map", "[m]", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", a.out)
        print(f"-> {a.out} (loudness correction {gain:+.2f} dB)")


if __name__ == "__main__":
    main()
