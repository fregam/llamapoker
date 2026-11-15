"""Pipeline steps over the store. Run from apps/research:

  py -3.11 pipeline/run.py import          load every data/raw/*.jsonl (repeatable)
  py -3.11 pipeline/run.py lang            detect the language of items that have none
  py -3.11 pipeline/run.py embed           embed items (multilingual-e5-base) into data/emb/
  py -3.11 pipeline/run.py dedupe          mark near-duplicates (cosine >= 0.95) as dup_of
  py -3.11 pipeline/run.py status          items per source and per language
"""
import sys
from pathlib import Path

from store import Store

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "data" / "research.sqlite"
EMB = ROOT / "data" / "emb"
MODEL = "intfloat/multilingual-e5-base"


def step_import(store):
    for p in sorted((ROOT / "data" / "raw").glob("*.jsonl")):
        rid = store.start_run("import", p.stem)
        res = store.import_jsonl(p)
        store.end_run(rid, res)
        if res["added"] or res["bad"]:
            print(f"{p.stem}: +{res['added']} (empty {res['empty']}, bad {res['bad']})")
    print("total", store.count())


def step_lang(store):
    from lingua import LanguageDetectorBuilder

    det = LanguageDetectorBuilder.from_all_languages().with_low_accuracy_mode().build()
    rid = store.start_run("lang")
    done = 0
    while True:
        batch = store.pending("lang", 20000)
        if not batch:
            break
        langs = det.detect_languages_in_parallel_of([t[:400] for _, t in batch])
        # "und" = too short or no letters (emoji, "gg"): still a value, so it isn't retried.
        store.set_many("lang", [(n, l.iso_code_639_1.name.lower() if l else "und") for (n, _), l in zip(batch, langs)])
        done += len(batch)
        print("lang", done, flush=True)
    store.end_run(rid, {"items": done})


def step_embed(store):
    """Appends to data/emb/vectors.f16 (n x 768 float16) and data/emb/ids.i64 (item n per row)."""
    import numpy as np
    import torch
    from sentence_transformers import SentenceTransformer

    EMB.mkdir(parents=True, exist_ok=True)
    ids_path, vec_path = EMB / "ids.i64", EMB / "vectors.f16"
    have = set(np.fromfile(ids_path, dtype=np.int64).tolist()) if ids_path.exists() else set()
    rows = [(n, t) for n, t in store.db.execute("select n, text from items order by n") if n not in have]
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
    import numpy as np

    ids = np.fromfile(EMB / "ids.i64", dtype=np.int64)
    vecs = np.fromfile(EMB / "vectors.f16", dtype=np.float16).reshape(len(ids), -1)
    return ids, vecs


def step_dedupe(store, threshold=0.95):
    """Each item whose text nearly repeats an earlier one (cosine >= threshold) points at it."""
    import numpy as np
    import torch

    ids, vecs = load_vectors()
    order = np.argsort(ids)
    ids, vecs = ids[order], vecs[order]
    device = "cuda" if torch.cuda.is_available() else "cpu"
    all_v = torch.from_numpy(vecs).to(device)
    if device == "cpu":
        all_v = all_v.float()
    rid = store.start_run("dedupe")
    pairs = []
    block = 2048
    for i in range(0, len(ids), block):
        sims = all_v[i:i + block] @ all_v.T  # block x n
        # only earlier items count, so the first of a group stays the original
        mask = torch.arange(len(ids), device=device)[None, :] < torch.arange(i, min(i + block, len(ids)), device=device)[:, None]
        sims = torch.where(mask, sims, torch.zeros_like(sims))
        best, arg = sims.max(dim=1)
        hit = (best >= threshold).nonzero().flatten().tolist()
        pairs += [(int(ids[i + k]), int(ids[arg[k]])) for k in hit]
    store.db.execute("update items set dup_of = null")
    store.set_many("dup_of", pairs)
    store.end_run(rid, {"duplicates": len(pairs), "of": len(ids)})
    print(f"{len(pairs)} near-duplicates of {len(ids)}")


def step_status(store):
    for s in store.sources():
        print(f"{s['items']:>8}  {s['authors']:>7} authors  {s['first']} to {s['last']}  {s['source']}")
    print("total", store.count())
    langs = store.db.execute("select coalesce(lang,'?'), count(*) from items group by 1 order by 2 desc limit 15").fetchall()
    print("langs:", ", ".join(f"{l} {c}" for l, c in langs))


if __name__ == "__main__":
    steps = {"import": step_import, "lang": step_lang, "embed": step_embed, "dedupe": step_dedupe, "status": step_status}
    if len(sys.argv) < 2 or sys.argv[1] not in steps:
        sys.exit(__doc__)
    store = Store(DB)
    try:
        for name in sys.argv[1:]:
            steps[name](store)
    finally:
        store.close()
