"""Deal one reading batch for a theme. Run from apps/research:

  py -3.11 pipeline/batch.py <KEY> <batch number, from 1> [--size 150]

KEY is a theme code from codebook.md (RIG, PAIRS, ...), LANG-<iso> (items of the language-only
topics in that language, e.g. LANG-ru), NOTOPIC or NOISE. Batches never overlap and are the same
every time: items are shuffled once per key with a fixed seed, then dealt round-robin across
sources so one huge source can't fill a batch.

Writes data/read/<KEY>/batch-NN.txt, one item per line:  [n|source|lang] text (cut at 500 chars).
Prints the path and how many items are left after this batch.
"""
import json
import random
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from run import DB, ROOT  # noqa: E402
from store import Store  # noqa: E402

MIN_LEN = 20


def rows_for(store, key):
    themes = json.loads((ROOT / "data" / "theme-map.json").read_text(encoding="utf-8"))["themes"]
    base = "select n, source, lang, text from items where skip is null and length(text) >= ? "
    if key == "NOTOPIC":
        return store.db.execute(base + "and topic = -1 and length(text) >= 40", (MIN_LEN,)).fetchall()
    if key.startswith("LANG-"):
        marks = ",".join("?" * len(themes["LANG"]))
        return store.db.execute(base + f"and topic in ({marks}) and lang = ?", (MIN_LEN, *themes["LANG"], key[5:])).fetchall()
    if key not in themes:
        sys.exit(f"unknown key {key}; themes: {', '.join(themes)}, LANG-<iso>, NOTOPIC")
    marks = ",".join("?" * len(themes[key]))
    return store.db.execute(base + f"and topic in ({marks})", (MIN_LEN, *themes[key])).fetchall()


def deal(rows, key):
    """Fixed shuffle, then round-robin across sources."""
    rng = random.Random("read:" + key)
    by_source = defaultdict(list)
    for r in sorted(rows):
        by_source[r[1]].append(r)
    for rs in by_source.values():
        rng.shuffle(rs)
    order, queues = [], [by_source[s] for s in sorted(by_source)]
    while queues:
        for q in queues:
            order.append(q.pop())
        queues = [q for q in queues if q]
    return order


def main():
    args = sys.argv[1:]
    size = 150
    if "--size" in args:
        i = args.index("--size")
        size = int(args[i + 1])
        del args[i:i + 2]
    if len(args) != 2:
        sys.exit(__doc__)
    key, number = args[0], int(args[1])
    store = Store(DB)
    order = deal(rows_for(store, key), key)
    store.close()
    chunk = order[(number - 1) * size: number * size]
    if not chunk:
        sys.exit(f"{key}: no items left (total {len(order)})")
    out = ROOT / "data" / "read" / key / f"batch-{number:02d}.txt"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(f"[{n}|{source}|{lang}] " + " ".join(text.split())[:500] for n, source, lang, text in chunk) + "\n",
                   encoding="utf-8")
    print(f"{out}  ({len(chunk)} items; {max(0, len(order) - number * size)} left of {len(order)})")


if __name__ == "__main__":
    main()
