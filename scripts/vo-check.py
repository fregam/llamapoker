"""Check a reel's voice-over takes before they go into the cut.

    <comfyui-venv>/python.exe scripts/vo-check.py <reel-id>

For every take in apps/reels/public/vo/<reel-id>/: length, words per second, median pitch and
pitch spread (same method as voice-measure.py: is it the same voice on every take?), and the word
error rate of a wav2vec2 transcript against the script (did it say the words, and only the words?).
A take that is far longer than its words need, or whose WER is above ~15%, has wandered: regenerate
it (vo-comfy.mjs ... --take <name> --seed <other>).
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import torch
import torchaudio

sys.path.insert(0, str(Path(__file__).resolve().parent))
from voice_measure import analyse  # noqa: E402  (scripts/voice_measure.py)

ROOT = Path(__file__).resolve().parent.parent
rid = sys.argv[1]
script = json.loads((ROOT / "apps/reels/src/scripts" / f"{rid}.json").read_text(encoding="utf-8"))
vo_dir = ROOT / "apps/reels/public/vo" / rid


def spoken(t: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[|*]", "", re.sub(r"\[[^\]]+\]", "", t))).strip()


takes: list[tuple[str, str]] = []
for ln in script["lines"]:
    if ln.get("take") or not takes:
        takes.append([ln.get("take") or str(len(takes) + 1), []])
    takes[-1][1].append(spoken(ln["t"]))
takes = [(n, " ".join(p)) for n, p in takes]

bundle = torchaudio.pipelines.WAV2VEC2_ASR_BASE_960H
model = bundle.get_model().eval()
labels = bundle.get_labels()
NUM = {"34": "thirty four", "35": "thirty five", "36": "thirty six", "38": "thirty eight", "39": "thirty nine", "18": "eighteen", "10": "ten", "1,326": "one thousand three hundred and twenty six"}


def norm(s: str) -> list[str]:
    s = s.lower().replace("-", " ").replace("’", "'").replace("per cent", "percent").replace("gut shot", "gutshot")
    s = " ".join(NUM.get(w.strip(".,:;?!"), w) for w in s.split())
    return re.sub(r"[^a-z' ]", "", s).split()


def wer(ref: list[str], hyp: list[str]) -> float:
    d = list(range(len(hyp) + 1))
    for i in range(1, len(ref) + 1):
        p, d[0] = d[:], i
        for j in range(1, len(hyp) + 1):
            d[j] = min(p[j] + 1, d[j - 1] + 1, p[j - 1] + (ref[i - 1] != hyp[j - 1]))
    return d[len(hyp)] / max(1, len(ref))


def transcribe(path: Path) -> str:
    wav, sr = torchaudio.load(str(path))
    wav = torchaudio.functional.resample(wav.mean(0, keepdim=True), sr, bundle.sample_rate)
    with torch.inference_mode():
        em, _ = model(wav)
    out, prev = [], None
    for i in em[0].argmax(-1).tolist():
        if i != prev and i != 0:
            out.append(labels[i])
        prev = i
    return "".join(out).replace("|", " ")


print(f"{'take':8s} {'sec':>6s} {'words':>5s} {'wps':>5s} {'F0':>4s} {'IQR':>4s} {'WER':>6s}")
bad = 0
for name, text in takes:
    path = vo_dir / f"{name}.wav"
    if not path.exists():
        print(f"{name:8s} missing")
        bad += 1
        continue
    words = text.split()
    m = analyse(str(path), words=len(words))
    e = wer(norm(text), norm(transcribe(path)))
    flag = ""
    if e > 0.15 or m["wps"] < 1.4:
        flag = "  <- wandered? regenerate"
        bad += 1
    print(f"{name:8s} {m['sec']:6.2f} {len(words):5d} {m['wps']:5.2f} {m['f0_med']:4d} {m['f0_iqr']:4d} {e*100:5.1f}%{flag}")
sys.exit(1 if bad else 0)
