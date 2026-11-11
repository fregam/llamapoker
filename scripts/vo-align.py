"""Word timestamps for a reel's voice-over takes, by CTC forced alignment (torchaudio wav2vec2).

    <comfyui-venv>/python.exe scripts/vo-align.py <reel-id>            align each take wav
    <comfyui-venv>/python.exe scripts/vo-align.py <reel-id> --split    first cut _whole.wav into takes
    <comfyui-venv>/python.exe scripts/vo-align.py --file <wav> --text "<what it says>"   (prints the words)

Reads apps/reels/src/scripts/<reel-id>.json and apps/reels/public/vo/<reel-id>/<take>.wav and
writes apps/reels/src/vo/<reel-id>.words.json: { "<take>": [{ "w": "Only", "s": 0.31, "e": 0.52 }, ...] }
in the order of the script's words, so narration.ts can place every caption word and cue on the
moment it is actually spoken instead of estimating it. Runs on the GPU if free, else CPU (fast
anyway: the model is 95 MB). The model (WAV2VEC2_ASR_BASE_960H, 360 MB) lives in ~/.cache/torch.
"""
import json
import re
import sys
from pathlib import Path

import torch
import torchaudio

ROOT = Path(__file__).resolve().parent.parent
TRAILER = "That's the whole idea. See you at the next one."  # must match vo-comfy.mjs --whole


def spoken(t: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[|*]", "", re.sub(r"\[[^\]]+\]", "", t))).strip()


bundle = torchaudio.pipelines.WAV2VEC2_ASR_BASE_960H
device = "cuda" if torch.cuda.is_available() and torch.cuda.mem_get_info()[0] > 1 << 30 else "cpu"
model = bundle.get_model().to(device).eval()
labels = bundle.get_labels()
dictionary = {c: i for i, c in enumerate(labels)}

NUMBERS = {
    "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven",
    "8": "eight", "9": "nine", "10": "ten", "12": "twelve", "15": "fifteen", "18": "eighteen", "34": "thirty four",
    "35": "thirty five", "36": "thirty six", "38": "thirty eight", "39": "thirty nine", "1,326": "one thousand three hundred twenty six",
}


def letters(word: str) -> str:
    """The word as the acoustic model hears it: upper-case letters and apostrophes only."""
    w = word.lower().replace("’", "'")
    w = re.sub(r"[^a-z0-9',]", "", w)
    if w in NUMBERS:
        w = NUMBERS[w]
    elif re.fullmatch(r"[\d,]+", w):
        w = " ".join(NUMBERS.get(d, d) for d in w)
    return re.sub(r"[^A-Z'|]", "", w.upper().replace(" ", "|"))


def align(path: Path, words: list[str]):
    wav, sr = torchaudio.load(str(path))
    wav = wav.mean(0, keepdim=True)
    if sr != bundle.sample_rate:
        wav = torchaudio.functional.resample(wav, sr, bundle.sample_rate)
    with torch.inference_mode():
        emission, _ = model(wav.to(device))
    emission = torch.log_softmax(emission, dim=-1).cpu()
    # Transcript: words joined by the word separator "|", letters only.
    spelled = [letters(w) or "A" for w in words]
    transcript = "|".join(spelled)
    tokens = [dictionary[c] for c in transcript]
    targets = torch.tensor([tokens], dtype=torch.int32)
    aligned, scores = torchaudio.functional.forced_align(emission, targets, blank=0)
    spans = torchaudio.functional.merge_tokens(aligned[0], scores[0].exp())  # one span per transcript char
    frame_sec = wav.shape[1] / bundle.sample_rate / emission.shape[1]
    out = []
    wi = 0
    si = 0  # index into spans (one per transcript char, separators included)
    for wi, sp in enumerate(spelled):
        mine = [spans[si + k] for k, ch in enumerate(sp) if ch != "|"]
        si += len(sp) + 1  # the word's chars plus the separator after it
        out.append({"w": words[wi], "s": round(mine[0].start * frame_sec, 3), "e": round(mine[-1].end * frame_sec, 3)})
    wi = len(out)
    if wi != len(words):
        raise RuntimeError(f"{path.name}: aligned {wi} of {len(words)} words")
    return out


def split_whole(vo_dir: Path, takes: list[tuple[str, list[str]]]) -> None:
    """Cut public/vo/<id>/_whole.wav (the reel generated in one go) into one wav per take.
    The cut falls in the silence between takes: 0.25 s before a take's first word, or the midpoint
    of the gap when the gap is shorter; the file ends 0.35 s after the take's last word."""
    import subprocess

    whole = vo_dir / "_whole.wav"
    # The recording ends with the throwaway line vo-comfy.mjs appends (the model stops short of
    # its last sentence otherwise); it is aligned too, so the real last take is not smeared over it.
    words = [w for _, ws in takes for w in ws] + TRAILER.split()
    timed = align(whole, words)
    info = torchaudio.info(str(whole))
    total = info.num_frames / info.sample_rate
    ffmpeg = ROOT / "apps/reels/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe"
    i = 0
    bounds = []
    for name, ws in takes:
        first, last = timed[i], timed[i + len(ws) - 1]
        bounds.append((name, first["s"], last["e"]))
        i += len(ws)
    # The throwaway line after the last take starts here; the last cut must end before it.
    trailer_start = timed[i]["s"] if i < len(timed) else total
    for k, (name, s, e) in enumerate(bounds):
        prev_end = bounds[k - 1][2] if k else 0.0
        next_start = bounds[k + 1][1] if k + 1 < len(bounds) else trailer_start
        start = max(prev_end + (s - prev_end) / 2, s - 0.25) if k else max(0.0, s - 0.25)
        end = min(e + 0.35, (e + next_start) / 2)
        subprocess.run([str(ffmpeg), "-y", "-loglevel", "error", "-i", str(whole), "-ss", f"{start:.3f}", "-to", f"{end:.3f}", "-c:a", "pcm_s16le", str(vo_dir / f"{name}.wav")], check=True)
        print(f"{name}: {start:.2f}s to {end:.2f}s ({end - start:.1f} s, {len(takes[k][1])} words)")


def main(argv: list[str]) -> None:
    if argv[:1] == ["--file"]:
        words = argv[3].split()
        for w in align(Path(argv[1]), words):
            print(f"{w['s']:7.2f} {w['e']:7.2f}  {w['w']}")
        return
    rid = argv[0]
    script = json.loads((ROOT / "apps/reels/src/scripts" / f"{rid}.json").read_text(encoding="utf-8"))
    vo_dir = ROOT / "apps/reels/public/vo" / rid
    takes: list[tuple[str, list[str]]] = []
    for ln in script["lines"]:
        if ln.get("take") or not takes:
            takes.append((ln.get("take") or str(len(takes) + 1), []))
        takes[-1][1].extend(spoken(ln["t"]).split(" "))
    if "--split" in argv:
        split_whole(vo_dir, takes)
    result = {}
    for name, words in takes:
        path = next((p for p in (vo_dir / f"{name}.wav", vo_dir / f"{name}.mp3") if p.exists()), None)
        if not path:
            raise FileNotFoundError(f"missing take {name} in {vo_dir}")
        result[name] = align(path, words)
        print(f"{name}: {len(words)} words, {result[name][0]['s']:.2f}s to {result[name][-1]['e']:.2f}s")
    out_path = ROOT / "apps/reels/src/vo" / f"{rid}.words.json"
    out_path.write_text(json.dumps(result, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote {out_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main(sys.argv[1:])
