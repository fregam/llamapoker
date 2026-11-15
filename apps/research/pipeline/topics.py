"""First topic pass over the whole store. Run from apps/research:  py -3.11 pipeline/topics.py

1. Fit BERTopic on a balanced sample (at most CAP items per source, so one huge source can't set
   the topics), using the vectors already in data/emb/.
2. Give every kept item the topic whose centre it is closest to, if it is as close as that topic's
   own members are; otherwise -1 (no topic).
3. Write items.topic and data/topics.json: per topic its size, distinct authors, sources, languages,
   top words and the items closest to its centre (what an agent reads first).

Counts are items, authors and sources: different people saying the same thing all count.
"""
import json
import random
import sys
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from run import DB, ROOT, load_vectors  # noqa: E402
from store import Store  # noqa: E402

CAP = 10000       # sample items per source for the fit
MIN_LEN = 30      # shorter texts are assigned afterwards, not used to shape topics
MIN_TOPIC = 60    # smallest group that counts as a topic in the sample
REPS = 12


def main():
    from bertopic import BERTopic
    from hdbscan import HDBSCAN
    from sklearn.feature_extraction.text import CountVectorizer
    from umap import UMAP

    store = Store(DB)
    ids, vecs = load_vectors()
    row_of = {int(n): i for i, n in enumerate(ids)}
    meta = {n: (source, lang, author, text) for n, source, lang, author, text in store.db.execute(
        "select n, source, lang, author_key, text from items where skip is null")}

    rng = random.Random(42)
    by_source = defaultdict(list)
    for n, (source, _, _, text) in meta.items():
        if n in row_of and len(text) >= MIN_LEN:
            by_source[source].append(n)
    sample = []
    for source, ns in sorted(by_source.items()):
        rng.shuffle(ns)
        sample += ns[:CAP]
    sample.sort()
    print(f"fitting on {len(sample)} of {len(meta)} items", flush=True)

    x = vecs[[row_of[n] for n in sample]].astype(np.float32)
    docs = [meta[n][3][:1000] for n in sample]
    model = BERTopic(
        umap_model=UMAP(n_neighbors=15, n_components=5, min_dist=0.0, metric="cosine", random_state=42, low_memory=True),
        hdbscan_model=HDBSCAN(min_cluster_size=MIN_TOPIC, min_samples=10, metric="euclidean", cluster_selection_method="eom"),
        vectorizer_model=CountVectorizer(ngram_range=(1, 2), min_df=5, max_features=200000),
        calculate_probabilities=False, verbose=True,
    )
    labels, _ = model.fit_transform(docs, x)
    labels = np.asarray(labels)
    topic_ids = sorted(t for t in set(labels.tolist()) if t != -1)
    print(f"{len(topic_ids)} topics; {int((labels == -1).sum())} sample items without one", flush=True)

    # Topic centres in the original vector space, and how close each topic's own members sit.
    centres, floor = [], []
    for t in topic_ids:
        m = x[labels == t]
        c = m.mean(axis=0)
        c /= np.linalg.norm(c)
        centres.append(c)
        floor.append(np.percentile(m @ c, 10))
    centres = np.stack(centres).astype(np.float32)
    floor = np.asarray(floor, dtype=np.float32)

    # Assign every kept, embedded item.
    all_ns = [n for n in meta if n in row_of]
    assigned = {}
    for i in range(0, len(all_ns), 50000):
        chunk = all_ns[i:i + 50000]
        sims = vecs[[row_of[n] for n in chunk]].astype(np.float32) @ centres.T
        best = sims.argmax(axis=1)
        top = sims[np.arange(len(chunk)), best]
        for n, b, s in zip(chunk, best, top):
            assigned[n] = (topic_ids[b] if s >= floor[b] else -1, float(s))
    store.db.execute("update items set topic = null")
    store.set_many("topic", [(n, t) for n, (t, _) in assigned.items()])

    members = defaultdict(list)
    for n, (t, s) in assigned.items():
        if t != -1:
            members[t].append((s, n))
    out = []
    for t in topic_ids:
        ms = sorted(members[t], reverse=True)
        sources = Counter(meta[n][0] for _, n in ms)
        reps, per_source = [], Counter()
        for _, n in ms:  # closest to the centre, at most 3 per source so the reader sees the spread
            source, lang, _, text = meta[n]
            if per_source[source] >= 3 or not (MIN_LEN <= len(text) <= 600):
                continue
            per_source[source] += 1
            reps.append({"n": n, "source": source, "lang": lang, "text": text})
            if len(reps) >= REPS:
                break
        out.append({
            "topic": t, "items": len(ms), "authors": len({meta[n][2] for _, n in ms if meta[n][2]}),
            "sources": len(sources), "by_source": dict(sources.most_common()),
            "langs": dict(Counter(meta[n][1] for _, n in ms).most_common(6)),
            "words": [w for w, _ in (model.get_topic(t) or [])[:10]], "reps": reps,
        })
    out.sort(key=lambda r: (-r["sources"], -r["authors"]))
    (ROOT / "data" / "topics.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    none = sum(1 for t, _ in assigned.values() if t == -1)
    rid = store.start_run("topics")
    store.end_run(rid, {"topics": len(out), "assigned": len(assigned) - none, "none": none, "fit_on": len(sample)})
    print(f"wrote data/topics.json: {len(out)} topics, {len(assigned) - none} items in one, {none} in none")
    store.close()


if __name__ == "__main__":
    main()
