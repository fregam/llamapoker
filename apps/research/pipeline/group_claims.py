"""Group the readers' claims across readers. Run from apps/research:

  py -3.11 pipeline/group_claims.py [--threshold 0.9]

Reads every data/read/<KEY>/findings.json, embeds each claim's text and joins claims whose
vectors are close (average-link, cosine). A group's strength is convergence, not counts: how many
independent readers, source types and languages said it. Reader counts are items in samples
balanced by source, so they are not comparable across readers and are kept only as a tiebreak.

Two-source-types rule: a group passes when its sources span two types, CardsChat not counted
(its posts are rewarded: codebook.md). Writes data/read/groups.json and data/read/groups.txt.
"""
import json
import sys
from collections import Counter
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from run import MODEL, ROOT  # noqa: E402

READ = ROOT / "data" / "read"
TYPES = {"yt": "youtube", "rd": "community", "fo": "forum", "gp": "app-reviews", "as": "app-reviews", "qa": "qa"}


def source_type(slug):
    return TYPES.get(str(slug)[:2])


def load_claims():
    claims = []
    for p in sorted(READ.glob("*/findings.json")):
        data = json.loads(p.read_text(encoding="utf-8"))
        for c in data.get("claims", []):
            sources = c.get("sources") or []
            if isinstance(sources, dict):
                sources = list(sources)
            claims.append({
                "reader": p.parent.name, "id": str(c.get("id")), "kind": c.get("kind"),
                "theme": c.get("theme") or p.parent.name, "claim": c.get("claim") or "",
                "count": c.get("count") or 0, "sources": [str(s) for s in sources],
                "rg": bool(c.get("rg")), "quotes": c.get("quotes") or [],
            })
    return [c for c in claims if c["claim"].strip()]


def summarise(members):
    sources = sorted({s for m in members for s in m["sources"]})
    strong = sorted({source_type(s) for s in sources if not s.startswith("fo-cc")} - {None})
    langs = sorted({m["reader"][5:] for m in members if m["reader"].startswith("LANG-")}
                   | {q.get("lang") for m in members for q in m["quotes"] if isinstance(q, dict) and q.get("lang")})
    lead = max(members, key=lambda m: m["count"])
    return {
        "claim": lead["claim"], "readers": sorted({m["reader"] for m in members}),
        "themes": [t for t, _ in Counter(m["theme"] for m in members).most_common()],
        "kinds": [k for k, _ in Counter(m["kind"] for m in members).most_common()],
        "source_types": strong, "two_types": len(strong) >= 2, "sources": sources, "langs": langs,
        "items": sum(m["count"] for m in members), "rg": any(m["rg"] for m in members),
        "members": [{"reader": m["reader"], "id": m["id"], "count": m["count"], "claim": m["claim"]} for m in members],
    }


def main():
    threshold = float(sys.argv[sys.argv.index("--threshold") + 1]) if "--threshold" in sys.argv else 0.9
    from sentence_transformers import SentenceTransformer
    from sklearn.cluster import AgglomerativeClustering

    claims = load_claims()
    model = SentenceTransformer(MODEL)
    vecs = model.encode(["query: " + c["claim"][:500] for c in claims], normalize_embeddings=True, show_progress_bar=False)
    labels = AgglomerativeClustering(n_clusters=None, metric="cosine", linkage="average",
                                     distance_threshold=1 - threshold).fit_predict(np.asarray(vecs))
    groups = {}
    for c, label in zip(claims, labels):
        groups.setdefault(int(label), []).append(c)
    out = [summarise(ms) for ms in groups.values()]
    out.sort(key=lambda g: (-len(g["readers"]), -len(g["source_types"]), -len(g["langs"]), -g["items"]))
    for i, g in enumerate(out, 1):
        g["group"] = i
    (READ / "groups.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    lines = []
    for g in out:
        flag = ("RG " if g["rg"] else "") + ("" if g["two_types"] else "1TYPE ")
        lines.append(f"G{g['group']} {flag}readers={len(g['readers'])} types={','.join(g['source_types'])} "
                     f"langs={','.join(g['langs'])} items={g['items']} themes={','.join(g['themes'][:3])}")
        for m in g["members"][:6]:
            lines.append(f"   {m['reader']}/{m['id']} ({m['count']}): {m['claim'][:170]}")
    (READ / "groups.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    multi = [g for g in out if len(g["readers"]) >= 2]
    print(f"{len(claims)} claims -> {len(out)} groups; {len(multi)} said by 2+ readers, "
          f"{sum(1 for g in multi if g['two_types'])} of those pass the two-types rule")


if __name__ == "__main__":
    main()
