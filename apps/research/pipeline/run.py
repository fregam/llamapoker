"""Pipeline steps over the store. Run from apps/research, in this order (each is repeatable):

  py -3.11 pipeline/run.py import     load every data/raw/*.jsonl
  py -3.11 pipeline/run.py noise      mark what isn't a person's own words (store.mark_noise)
  py -3.11 pipeline/run.py lang       detect the language of items that have none
  py -3.11 pipeline/run.py embed      embed kept items (multilingual-e5-base) into data/emb/
  py -3.11 pipeline/run.py status     items per source and per language
"""
import sys
from collections import Counter
from pathlib import Path

from store import Store

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "data" / "research.sqlite"
EMB = ROOT / "data" / "emb"
MODEL = "intfloat/multilingual-e5-base"
SHORT = 25  # under this many characters a text can't be language-detected on its own


def step_import(store):
    for p in sorted((ROOT / "data" / "raw").glob("*.jsonl")):
        rid = store.start_run("import", p.stem)
        res = store.import_jsonl(p)
        store.end_run(rid, res)
        if res["added"] or res["bad"]:
            print(f"{p.stem}: +{res['added']} (empty {res['empty']}, bad {res['bad']})")
    print("total", store.count())


def step_noise(store):
    rid = store.start_run("noise")
    res = store.mark_noise()
    store.end_run(rid, res)
    print("skipped:", res, "| kept:", store.db.execute("select count(*) from items where skip is null").fetchone()[0])


def step_lang(store):
    from lingua import LanguageDetectorBuilder

    det = LanguageDetectorBuilder.from_all_languages().build()
    rid = store.start_run("lang")
    done = 0
    while True:
        batch = store.db.execute(
            "select n, text from items where lang is null and length(text) >= ? order by n limit 20000", (SHORT,)).fetchall()
        if not batch:
            break
        langs = det.detect_languages_in_parallel_of([t[:400] for _, t in batch])
        store.set_many("lang", [(n, l.iso_code_639_1.name.lower() if l else "und") for (n, _), l in zip(batch, langs)])
        done += len(batch)
        print("lang", done, flush=True)
    # Short items ("gg", "rigged", emoji) take the main language of their thread, else of their source.
    by_thread, by_source = {}, {}
    for thread, source, lang, c in store.db.execute(
            "select thread_url, source, lang, count(*) from items where lang is not null and lang != 'und' "
            "and length(text) >= ? group by 1, 2, 3", (SHORT,)):
        by_thread.setdefault(thread, Counter())[lang] += c
        by_source.setdefault(source, Counter())[lang] += c
    short = store.db.execute("select n, thread_url, source from items where lang is null").fetchall()
    store.set_many("lang", [
        (n, (by_thread.get(t) or by_source.get(s) or Counter({"und": 1})).most_common(1)[0][0]) for n, t, s in short])
    store.end_run(rid, {"detected": done, "short_inherited": len(short)})


def step_embed(store):
    """Appends to data/emb/vectors.f16 (n x 768 float16) and data/emb/ids.i64 (item n per row)."""
    import numpy as np
    import torch
    from sentence_transformers import SentenceTransformer

    EMB.mkdir(parents=True, exist_ok=True)
    ids_path, vec_path = EMB / "ids.i64", EMB / "vectors.f16"
    have = set(np.fromfile(ids_path, dtype=np.int64).tolist()) if ids_path.exists() else set()
    rows = [(n, t) for n, t in store.db.execute("select n, text from items where skip is null order by n") if n not in have]
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"embedding {len(rows)} items on {device}", flush=True)
    if not rows:
        return
    model = SentenceTransformer(MODEL, device=device)
    model.max_seq_length = 256
    if device == "cuda":
        model.half()
    rid = store.start_run("embed")
    step = 20000
    for i in range(0, len(rows), step):
        chunk = rows[i:i + step]
        chunk.sort(key=lambda r: len(r[1]))  # similar lengths per batch: far less padding
        vecs = model.encode(["query: " + t[:2000] for _, t in chunk], batch_size=128 if device == "cuda" else 32,
                            normalize_embeddings=True, show_progress_bar=False)
        with open(vec_path, "ab") as f:
            f.write(np.asarray(vecs, dtype=np.float16).tobytes())
        with open(ids_path, "ab") as f:
            f.write(np.asarray([n for n, _ in chunk], dtype=np.int64).tobytes())
        print("embed", min(i + step, len(rows)), "/", len(rows), flush=True)
    store.end_run(rid, {"items": len(rows)})


def load_vectors():
    """(ids, vectors) for every embedded item, in item order."""
    import numpy as np

    ids = np.fromfile(EMB / "ids.i64", dtype=np.int64)
    vecs = np.fromfile(EMB / "vectors.f16", dtype=np.float16).reshape(len(ids), -1)
    order = np.argsort(ids)
    return ids[order], vecs[order]


def step_status(store):
    for s in store.sources():
        print(f"{s['items']:>8}  {s['authors']:>7} authors  {s['first']} to {s['last']}  {s['source']}")
    print("total", store.count(), "| kept", store.db.execute("select count(*) from items where skip is null").fetchone()[0])
    langs = store.db.execute(
        "select coalesce(lang,'?'), count(*) from items where skip is null group by 1 order by 2 desc limit 15").fetchall()
    print("langs:", ", ".join(f"{l} {c}" for l, c in langs))


if __name__ == "__main__":
    steps = {"import": step_import, "noise": step_noise, "lang": step_lang, "embed": step_embed, "status": step_status}
    if len(sys.argv) < 2 or any(a not in steps for a in sys.argv[1:]):
        sys.exit(__doc__)
    store = Store(DB)
    try:
        for name in sys.argv[1:]:
            steps[name](store)
    finally:
        store.close()
