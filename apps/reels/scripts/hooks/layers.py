"""The four layers of each sampled reel's opening (spec: .scratch/hook-dissection/spec.md, method 3).

    python layers.py media [--limit N]      download sampled reels, frames at 0/0.5/1/2/3/5 s, cut count (first 5 s)
    <comfyui-venv>/python.exe layers.py speech   Whisper large-v3 transcript of the first 15 s (local GPU)

Files: media/research/hooks/<shortcode>/ (git-ignored): reel.mp4, f_<t>.jpg, layers.json.
On-screen text and the first frame are read from the frames by agents (ticket 04).
"""
import json
import re
import sqlite3
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
REPO = HERE.parents[3]
DB = HERE / "data" / "corpus.sqlite"
OUT = REPO / "media" / "research" / "hooks"
BIN = REPO / "apps" / "reels" / "node_modules" / "@remotion" / "compositor-win32-x64-msvc"
FFMPEG = str(BIN / "ffmpeg.exe")
TIMES = [0, 0.5, 1, 2, 3, 5]
TRANSIENT = re.compile(r"Could not resolve|timed out|bytes read|Connection (reset|aborted)|Temporary failure", re.I)


def sampled(limit=None):
    con = sqlite3.connect(DB)
    q = ("select shortcode, permalink, caption from reels where sampled in ('outlier','ordinary') "
         "order by username, timestamp")
    rows = con.execute(q).fetchall()
    return rows[:limit] if limit else rows


def cuts_in_first(path: Path, seconds=5) -> int:
    """Hard cuts in the first `seconds`: a frame whose 16-bin grey histogram moves > 0.5 (or whose
    pixels move > 45/255 on average) from the last; hits within 0.25 s are one cut. PyAV decodes
    (the bundled ffmpeg has no null muxer, so its scene filter returned 0 for every reel)."""
    import av
    import numpy as np
    cuts, prev, last = 0, None, -1.0
    with av.open(str(path)) as c:
        for f in c.decode(video=0):
            if f.time is None or f.time > seconds:
                break
            g = f.to_ndarray(width=48, height=64, format="gray").astype(np.int16)
            h = np.histogram(g, bins=16, range=(0, 256))[0] / g.size
            if prev is not None and (np.abs(h - prev[1]).sum() > 0.5 or np.abs(g - prev[0]).mean() > 45):
                if f.time - last > 0.25:
                    cuts += 1
                last = f.time
            prev = (g, h)
    return cuts


def recount():
    """Rewrites cuts_first_5s for every laid-out reel."""
    for meta in sorted(OUT.glob("*/layers.json")):
        info = json.loads(meta.read_text(encoding="utf-8"))
        video = meta.parent / "reel.mp4"
        if "error" in info or not video.exists():
            continue
        try:
            info["cuts_first_5s"] = cuts_in_first(video)
        except Exception as e:
            print(f"{meta.parent.name}: {e}")
            continue
        meta.write_text(json.dumps(info, indent=2, ensure_ascii=False), encoding="utf-8")
    print("recount done")


def media(limit=None):
    import yt_dlp  # system python
    done = 0
    for code, url, caption in sampled(limit):
        d = OUT / code
        meta = d / "layers.json"
        if meta.exists():
            info = json.loads(meta.read_text(encoding="utf-8"))
            if "caption_first_line" not in info and "error" not in info:
                info["caption_first_line"] = (caption or "").strip().split("\n")[0][:200]
                meta.write_text(json.dumps(info, indent=2, ensure_ascii=False), encoding="utf-8")
            continue
        d.mkdir(parents=True, exist_ok=True)
        video = d / "reel.mp4"
        if not video.exists():
            try:
                with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True, "noprogress": True, "format": "b[ext=mp4]/b",
                                       "outtmpl": str(video), "ffmpeg_location": str(BIN)}) as y:
                    y.download([url])
            except Exception as e:  # deleted, private or blocked: note it and move on
                if TRANSIENT.search(str(e)):  # network blip: leave no mark, the next run retries
                    print(f"{code}: network error, retry later")
                    continue
                meta.write_text(json.dumps({"shortcode": code, "error": str(e)[:200]}), encoding="utf-8")
                print(f"{code}: download failed")
                continue
        for t in TIMES:
            subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(t), "-i", str(video),
                            "-frames:v", "1", "-vf", "scale=540:-2", "-q:v", "3", str(d / f"f_{t}.jpg")])
        info = {"shortcode": code, "url": url, "frames": [f"f_{t}.jpg" for t in TIMES if (d / f"f_{t}.jpg").exists()],
                "cuts_first_5s": cuts_in_first(video),
                "caption_first_line": (caption or "").strip().split("\n")[0][:200]}
        meta.write_text(json.dumps(info, indent=2), encoding="utf-8")
        done += 1
        print(f"{code}: {len(info['frames'])} frames, {info['cuts_first_5s']} cuts")
    print(f"media: {done} new")


def speech():
    import torch
    from transformers import pipeline  # ComfyUI venv
    asr = pipeline("automatic-speech-recognition", model="openai/whisper-large-v3",
                   torch_dtype=torch.float16, device="cuda:0")
    for code, _, _ in sampled():
        meta = OUT / code / "layers.json"
        if not meta.exists():
            continue
        info = json.loads(meta.read_text(encoding="utf-8"))
        if "speech" in info or "error" in info:
            continue
        video = meta.parent / "reel.mp4"
        wav = meta.parent / "first15.wav"
        subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-t", "15", "-i", str(video),
                        "-ac", "1", "-ar", "16000", str(wav)])
        if not wav.exists() or wav.stat().st_size < 2000:
            info["speech"] = ""  # no audio track
        else:
            import wave
            import numpy as np
            with wave.open(str(wav)) as w:
                audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
            r = asr({"raw": audio, "sampling_rate": 16000}, return_timestamps=True, generate_kwargs={"task": "transcribe"})
            info["speech"] = r["text"].strip()
            info["speech_chunks"] = [{"t": c["timestamp"], "text": c["text"].strip()} for c in r.get("chunks", [])]
            wav.unlink()
        meta.write_text(json.dumps(info, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"{info['shortcode']}: {info['speech'][:80]}")


def sheets():
    """sheet.jpg per reel: frames at 0, 1 and 3 s side by side, so a tagger opens one image per reel."""
    from PIL import Image  # ComfyUI venv
    n = 0
    for d in sorted(p for p in OUT.iterdir() if p.is_dir()):
        parts = [d / f"f_{t}.jpg" for t in (0, 1, 3)]
        if (d / "sheet.jpg").exists() or not all(p.exists() for p in parts):
            continue
        ims = [Image.open(p).convert("RGB") for p in parts]
        w = 360
        ims = [im.resize((w, round(im.height * w / im.width))) for im in ims]
        sheet = Image.new("RGB", (3 * w + 16, max(im.height for im in ims)), "white")
        for i, im in enumerate(ims):
            sheet.paste(im, (i * (w + 8), 0))
        sheet.save(d / "sheet.jpg", quality=80)
        n += 1
    print(f"sheets: {n} new")


if __name__ == "__main__":
    if sys.argv[1] == "recount":
        recount()
    elif sys.argv[1] == "sheets":
        sheets()
    elif sys.argv[1] == "media":
        media(int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None)
    else:
        speech()
