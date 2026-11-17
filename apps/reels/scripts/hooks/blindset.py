"""Blind batches for ticket 04 (spec: .scratch/hook-dissection/spec.md, method 4-5).

    python blindset.py      writes data/blind/: taxonomy-a.json, taxonomy-b.json (~150 each, no overlap),
                            batch-NN.json (~35 each, ~10% of reels repeated in a second batch)

Batch files hold shortcodes and file paths only, never outlier status, views or account medians.
Only reels with frames and a transcript are used.
"""
import json
import random
import sqlite3
from pathlib import Path

HERE = Path(__file__).parent
REPO = HERE.parents[3]
DB = HERE / "data" / "corpus.sqlite"
MEDIA = REPO / "media" / "research" / "hooks"
OUT = HERE / "data" / "blind"
FRAMES = ["f_0.jpg", "f_0.5.jpg", "f_1.jpg", "f_2.jpg", "f_3.jpg", "f_5.jpg"]
TAXONOMY, BATCH, REPEAT = 150, 35, 0.10


def entry(code: str) -> dict:
    d = MEDIA / code
    return {"shortcode": code, "layers": str(d / "layers.json"),
            "frames": [str(d / f) for f in FRAMES if (d / f).exists()]}


def ready(code: str) -> bool:
    meta = MEDIA / code / "layers.json"
    if not meta.exists():
        return False
    info = json.loads(meta.read_text(encoding="utf-8"))
    return "error" not in info and "speech" in info and bool(info.get("frames"))


def build(codes: list[str], seed: int = 17) -> dict[str, list[str]]:
    """{file stem: [shortcodes]}; pure, so the split can be checked."""
    rng = random.Random(seed)
    codes = sorted(codes)
    rng.shuffle(codes)
    out = {"taxonomy-a": codes[:TAXONOMY], "taxonomy-b": codes[TAXONOMY:2 * TAXONOMY]}
    tag = codes[:]
    rng.shuffle(tag)
    n = max(1, round(len(tag) / BATCH))
    batches = [tag[i::n] for i in range(n)]
    repeats = rng.sample(tag, round(len(tag) * REPEAT))
    for code in repeats:  # into a different batch than its first one
        home = next(i for i, b in enumerate(batches) if code in b)
        target = min((i for i in range(n) if i != home), key=lambda i: len(batches[i]))
        batches[target].append(code)
    for b in batches:
        rng.shuffle(b)
    out.update({f"batch-{i + 1:02d}": b for i, b in enumerate(batches)})
    out["_repeats"] = sorted(repeats)
    return out


def main():
    con = sqlite3.connect(DB)
    codes = [c for (c,) in con.execute("select shortcode from reels where sampled in ('outlier','ordinary')") if ready(c)]
    OUT.mkdir(parents=True, exist_ok=True)
    plan = build(codes)
    for stem, group in plan.items():
        if stem == "_repeats":
            (OUT / "repeats.json").write_text(json.dumps(group), encoding="utf-8")
            continue
        (OUT / f"{stem}.json").write_text(json.dumps([entry(c) for c in group], indent=1), encoding="utf-8")
    print(f"{len(codes)} ready reels | {sum(k.startswith('batch') for k in plan)} batches | {len(plan['_repeats'])} repeats")


if __name__ == "__main__":
    main()
