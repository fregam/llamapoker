"""Tighten a reel's narration for pace: shorten the long silences and lift the tempo a little.

    <comfyui-venv>/python.exe scripts/vo-tighten.py <reel-id> [--max-gap 0.30] [--tempo 1.06]

Works on public/vo/<id>/_whole.wav (the one-take recording), keeps the original as
_whole.raw.wav and always cuts from that, so it can be re-run with other settings; never delete
_whole.raw.wav (the per-take <take>.raw.wav files from vo-enhance.py can go: `rm [!_]*.raw.wav`).
The original is also archived in media/reels/<reel>/audio/vo/. Then run the usual chain:
vo-align.py <id> --split, vo-enhance.py <id>, vo-check.py <id>, vo-manifest.mjs <id>.

VibeVoice breathes generously: sentence gaps of 0.6–1.2 s. Viewers don't wait. Every silence
longer than `max_gap` (RMS under -42 dBFS for that long) is cut down to `max_gap`, with 15 ms
cross-fades so nothing clicks; then the whole file is sped up by `tempo` with ffmpeg's atempo
(pitch preserved). 1.06 is inaudible as a change of voice and saves six seconds a minute.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = ROOT / "apps/reels/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe"


def tighten(x: np.ndarray, sr: int, max_gap: float, floor_db: float = -42.0) -> tuple[np.ndarray, float]:
    win = int(sr * 0.01)
    n = len(x) // win
    rms = np.sqrt(np.mean(x[: n * win].reshape(n, win) ** 2, axis=1))
    quiet = rms < 10 ** (floor_db / 20)
    keep = np.ones(n, dtype=bool)
    i = 0
    removed = 0.0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            length = (j - i) * win / sr
            if length > max_gap:
                k = int(max_gap * sr / win)
                head = i + k // 2
                tail = j - (k - k // 2)
                keep[head:tail] = False
                removed += (tail - head) * win / sr
            i = j
        else:
            i += 1
    # Rebuild with short cross-fades at every cut.
    xf = int(sr * 0.015)
    out = []
    i = 0
    while i < n:
        if keep[i]:
            j = i
            while j < n and keep[j]:
                j += 1
            seg = x[i * win : j * win].copy()
            if out and len(seg) > xf and len(out[-1]) > xf:
                ramp = np.linspace(0, 1, xf)
                out[-1][-xf:] = out[-1][-xf:] * (1 - ramp) + seg[:xf] * ramp
                seg = seg[xf:]
            out.append(seg)
            i = j
        else:
            i += 1
    out.append(x[n * win :])
    return np.concatenate(out), removed


def main(argv: list[str]) -> None:
    rid = argv[0]
    max_gap = float(argv[argv.index("--max-gap") + 1]) if "--max-gap" in argv else 0.30
    tempo = float(argv[argv.index("--tempo") + 1]) if "--tempo" in argv else 1.06
    vo_dir = ROOT / "apps/reels/public/vo" / rid
    whole = vo_dir / "_whole.wav"
    raw = vo_dir / "_whole.raw.wav"
    if not raw.exists():
        whole.replace(raw)
    x, sr = sf.read(str(raw), dtype="float32", always_2d=True)
    x = x.mean(1)
    y, removed = tighten(x, sr, max_gap)
    tmp = vo_dir / "_whole.tight.wav"
    sf.write(str(tmp), y, sr, subtype="PCM_16")
    subprocess.run([str(FFMPEG), "-y", "-loglevel", "error", "-i", str(tmp), "-af", f"atempo={tempo}", "-c:a", "pcm_s16le", str(whole)], check=True)
    tmp.unlink()
    before = len(x) / sr
    after = before - removed
    print(f"{rid}: {before:.1f} s -> {after:.1f} s after cutting {removed:.1f} s of silence -> {after / tempo:.1f} s at tempo {tempo}")


if __name__ == "__main__":
    main(sys.argv[1:])
