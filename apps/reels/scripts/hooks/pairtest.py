"""Blind pair test: can a reader tell, from the opening alone, which of two reels from the same
creator (posted close in time) became the outlier? Near 50% means openings don't separate hits.

    python pairtest.py build      writes data/blind/pairs-NN.md (20 pairs each) + data/blind/pairs-key.json
    python pairtest.py score      reads data/blind/pairs-NN.answers.jsonl, prints accuracy

Pairs come from data/pairs.json (outlier -> its twin), both reels ready (sheet + transcript),
at most 2 pairs per account. Order inside a pair is random; the key is never shown to readers.
"""
import json
import math
import random
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path

from blindset import MEDIA, ready

HERE = Path(__file__).parent
DB = HERE / "data" / "corpus.sqlite"
BLIND = HERE / "data" / "blind"
PER_FILE, PER_ACCOUNT, TOTAL = 20, 2, 120


def block(label: str, code: str) -> str:
    info = json.loads((MEDIA / code / "layers.json").read_text(encoding="utf-8"))
    first5 = " ".join(ch["text"] for ch in info.get("speech_chunks", []) if (ch["t"][0] or 0) < 5)
    return (f"**{label}**  sheet: {MEDIA / code / 'sheet.jpg'}\n"
            f"- cuts in first 5 s: {info.get('cuts_first_5s')}\n"
            f"- caption first line: {info.get('caption_first_line', '')}\n"
            f"- speech, first 5 s: {first5 or info.get('speech', '')[:200]}\n")


def build(seed=23):
    rng = random.Random(seed)
    pairs = json.loads((HERE / "data" / "pairs.json").read_text(encoding="utf-8"))
    user = dict(sqlite3.connect(DB).execute("select shortcode, username from reels"))
    by_acc = defaultdict(list)
    for o, t in sorted(pairs.items()):
        if ready(o) and ready(t):
            by_acc[user[o]].append((o, t))
    chosen = []
    for acc in sorted(by_acc):
        rng.shuffle(by_acc[acc])
        chosen += by_acc[acc][:PER_ACCOUNT]
    rng.shuffle(chosen)
    chosen = chosen[:TOTAL]
    key = {}
    for i in range(0, len(chosen), PER_FILE):
        n = i // PER_FILE + 1
        out = [f"# Pair set {n:02d}\n"]
        for j, (o, t) in enumerate(chosen[i:i + PER_FILE], start=i + 1):
            a, b = (o, t) if rng.random() < 0.5 else (t, o)
            pid = f"p{j:03d}"
            key[pid] = {"outlier": "A" if a == o else "B", "A": a, "B": b, "account": user[o]}
            out.append(f"## {pid}\n\n{block('A', a)}\n{block('B', b)}")
        (BLIND / f"pairs-{n:02d}.md").write_text("\n".join(out), encoding="utf-8")
    (BLIND / "pairs-key.json").write_text(json.dumps(key, indent=1), encoding="utf-8")
    print(f"{len(chosen)} pairs from {len(by_acc)} accounts -> {math.ceil(len(chosen) / PER_FILE)} files")


def score():
    key = json.loads((BLIND / "pairs-key.json").read_text(encoding="utf-8"))
    rows = []
    for f in sorted(BLIND.glob("pairs-*.answers.jsonl")):
        for line in f.read_text(encoding="utf-8").splitlines():
            if line.strip():
                rows.append(json.loads(line))
    hit = [r for r in rows if r["pair"] in key and r["pick"] == key[r["pair"]]["outlier"]]
    n, k = len(rows), len(hit)
    se = math.sqrt(0.25 / n) if n else 0
    print(f"{k}/{n} correct = {k / n:.1%} (chance 50%, 90% band ±{1.645 * se:.1%})")
    for conf in ("high", "medium", "low"):
        sub = [r for r in rows if r.get("confidence") == conf]
        if sub:
            c = sum(r["pick"] == key[r["pair"]]["outlier"] for r in sub)
            print(f"  {conf}: {c}/{len(sub)} = {c / len(sub):.0%}")


if __name__ == "__main__":
    build() if sys.argv[1] == "build" else score()
