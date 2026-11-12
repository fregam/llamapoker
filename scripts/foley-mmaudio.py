"""Video-to-foley with MMAudio: generate effects from a rendered reel's own frames and mix them in.

    py -3.11 scripts/foley-mmaudio.py <silent-fx.mp4> <out.mp4> [--gain-db 0] [--cuts 9,17] [--seed 42]

<silent-fx.mp4> is a render with the effects muted (variant `{"sfx":"none"}`: voice and bed only).
The video is cut into windows near MMAudio's 8 s training length (--cuts, in seconds), each
window gets its own foley from the frames plus a text prompt, the windows are joined with 0.1 s
crossfades, and the foley is mixed under the render's audio at --gain-db. Outputs the mixed mp4 and
<out>.foley.wav (the foley alone).

MMAudio lost its A/B (round 2) and was uninstalled on 2026-11-12; this script is kept as the
recipe. To rerun: clone github.com/hkchengrex/MMAudio to C:/Users/matia/tools/mmaudio, make a venv,
`pip install -e .`, then force CUDA PyTorch (pip replaced it with the CPU build: torch==2.14.1 from
the cu130 index) and pin numpy<2.1, pillow<12. Weights (~11 GB with the venv, + 4 GB of Hugging
Face models) download on the first run. ~6 GB VRAM in 16-bit, fits the RTX 4060.
"""

import argparse
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg

MMAUDIO = Path("C:/Users/matia/tools/mmaudio")
PY = MMAUDIO / ".venv/Scripts/python.exe"
FF = imageio_ffmpeg.get_ffmpeg_exe()
# torchcodec (MMAudio's video reader) needs FFmpeg's shared DLLs; Remotion ships FFmpeg 7 ones.
# Python doesn't search PATH for them, so the launcher registers the folder before running demo.py.
DLLS = Path(__file__).resolve().parent.parent / "apps/reels/node_modules/@remotion/compositor-win32-x64-msvc"
# The Remotion FFmpeg can't write FLAC either, so torchaudio.save is swapped for a soundfile WAV.
LAUNCH = ("import os, sys, runpy; os.add_dll_directory(sys.argv.pop(1)); sys.argv[0] = 'demo.py'; "
          "import torchaudio, soundfile; "
          "torchaudio.save = lambda p, a, sr, **k: soundfile.write(str(p).rsplit('.', 1)[0] + '.wav', a.float().cpu().numpy().T, sr); "
          "runpy.run_path('demo.py', run_name='__main__')")
PROMPT = ("foley for an animated poker explainer: playing cards slapping onto a table, cards sliding, "
          "poker chips clicking, soft whooshes as graphics move, a firm stamp as a number lands")
NEGATIVE = "music, speech, voice, singing, talking"


def ff(*args):
    subprocess.run([FF, "-v", "error", "-y", *map(str, args)], check=True)


def duration(p: Path) -> float:
    out = subprocess.run([FF, "-i", str(p)], capture_output=True, text=True, errors="replace").stderr
    h, m, s = out.split("Duration: ")[1].split(",")[0].split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--gain-db", type=float, default=0.0)
    ap.add_argument("--cuts", default="9,17")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--prompt", default=PROMPT)
    a = ap.parse_args()
    total = duration(a.video)
    edges = [0.0, *[float(c) for c in a.cuts.split(",")], total]
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        parts = []
        for i, (s, e) in enumerate(zip(edges, edges[1:])):
            # each window overlaps the next by 0.1 s for the crossfade
            seg = tmp / f"seg{i}.mp4"
            dur = min(e + 0.1, total) - s
            ff("-ss", f"{s:.3f}", "-i", a.video, "-t", f"{dur:.3f}", "-an", "-c:v", "libx264", "-crf", "16", seg)
            outdir = tmp / f"o{i}"
            subprocess.run([str(PY), "-c", LAUNCH, str(DLLS), f"--video={seg}", f"--duration={dur:.3f}", "--prompt", a.prompt,
                            "--negative_prompt", NEGATIVE, f"--output={outdir}", f"--seed={a.seed + i}",
                            "--skip_video_composite"], check=True, cwd=MMAUDIO)
            flac = next(outdir.glob("*.wav"))
            wav = tmp / f"p{i}.wav"
            ff("-i", flac, "-ac", "1", "-ar", "48000", wav)
            parts.append(wav)
            print(f"window {i}: {s:.1f}-{s + dur:.1f} s done")
        # join with 0.1 s crossfades
        joined = parts[0]
        for i, p in enumerate(parts[1:], 1):
            nxt = tmp / f"j{i}.wav"
            ff("-i", joined, "-i", p, "-filter_complex", "acrossfade=d=0.1:c1=tri:c2=tri", nxt)
            joined = nxt
        foley = a.out.with_suffix(".foley.wav")
        ff("-i", joined, "-t", f"{total:.3f}", foley)
        ff("-i", a.video, "-i", foley, "-filter_complex",
           f"[1:a]volume={a.gain_db}dB,aresample=48000[f];[0:a][f]amix=inputs=2:duration=first:normalize=0[m]",
           "-map", "0:v", "-map", "[m]", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", a.out)
    print(f"-> {a.out} (+ {foley.name})")


if __name__ == "__main__":
    main()
