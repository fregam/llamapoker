"""Lift table (ticket 05; spec: .scratch/hook-dissection/spec.md, method 6).

    python lift.py        reads data/blind/tags-*.jsonl, writes content/research/hooks/lift.md

Per mechanism: share among outliers / share among ordinary twins, with a 90% interval on the ratio
(log method). Agreement: reels tagged twice (data/blind/repeats.json) give each mechanism's positive
agreement 2a / (2a + b + c); below 0.7 it is reported as unreliable, not as a finding.
A mechanism is called only with >= 8 outliers carrying it.
"""
import glob
import json
import math
import sqlite3
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).parent
REPO = HERE.parents[3]
DB = HERE / "data" / "corpus.sqlite"
BLIND = HERE / "data" / "blind"
OUT = REPO / "content" / "research" / "hooks" / "lift.md"
MIN_OUT, MIN_AGREE, Z = 8, 0.7, 1.645


MEDIA = REPO / "media" / "research" / "hooks"
CTX = ("format", "audio", "text_style", "face_at_0s", "annotation", "caption_cta", "language")


def features(row: dict, code: str) -> set:
    """The reel's mechanisms plus derived context features (prefixed so they read apart in the table)."""
    ms = set(row.get("mechanisms") or [])
    out = set(ms)
    out.add(f"n_mechanisms={min(len(ms), 3)}{'+' if len(ms) >= 3 else ''}")
    ctx = row.get("context") or {}
    for k in CTX:
        v = ctx.get(k)
        if isinstance(v, str) and v.strip():
            v = v.strip().lower()
            if k == "language":
                v = "english" if v.startswith("english") else "other"
            out.add(f"{k}={v[:40]}")
        elif isinstance(v, bool):
            out.add(f"{k}={'yes' if v else 'no'}")
    meta = MEDIA / code / "layers.json"
    if meta.exists():
        cuts = json.loads(meta.read_text(encoding="utf-8")).get("cuts_first_5s")
        if isinstance(cuts, int):
            out.add(f"cuts_5s={min(cuts, 3)}{'+' if cuts >= 3 else ''}")
    return out


def load_tags() -> dict[str, list[set]]:
    tags = defaultdict(list)
    for f in sorted(glob.glob(str(BLIND / "tags-*.jsonl"))):
        for line in Path(f).read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            tags[row["shortcode"]].append(features(row, row["shortcode"]))
    return tags


def agreement(tags: dict[str, list[set]]) -> dict[str, tuple[float, int]]:
    """{mechanism: (positive agreement, reels where either tagger used it)} over double-tagged reels."""
    a, either = defaultdict(int), defaultdict(int)
    for runs in tags.values():
        if len(runs) < 2:
            continue
        x, y = runs[0], runs[1]
        for m in x | y:
            either[m] += 1
            if m in x and m in y:
                a[m] += 1
    return {m: (2 * a[m] / (a[m] + either[m]), either[m]) for m in either}


def lift(k_out: int, n_out: int, k_ord: int, n_ord: int) -> tuple[float, float, float]:
    """Ratio of shares with a 90% interval; 0.5 added to empty cells."""
    if k_out == 0 or k_ord == 0:
        k_out, k_ord = k_out + 0.5, k_ord + 0.5
    r = (k_out / n_out) / (k_ord / n_ord)
    se = math.sqrt(1 / k_out - 1 / n_out + 1 / k_ord - 1 / n_ord)
    return r, r * math.exp(-Z * se), r * math.exp(Z * se)


def table(tags, status) -> list[dict]:
    first = {c: runs[0] for c, runs in tags.items() if c in status}
    n = {"outlier": 0, "ordinary": 0}
    k = defaultdict(lambda: {"outlier": 0, "ordinary": 0})
    for c, ms in first.items():
        s = status[c]
        n[s] += 1
        for m in ms:
            k[m][s] += 1
    rows = []
    for m, kk in k.items():
        r, lo, hi = lift(kk["outlier"], n["outlier"], kk["ordinary"], n["ordinary"])
        rows.append({"mechanism": m, "out": kk["outlier"], "ord": kk["ordinary"], "lift": r, "lo": lo, "hi": hi})
    return sorted(rows, key=lambda r: -r["lift"]), n


def main():
    con = sqlite3.connect(DB)
    status = dict(con.execute("select shortcode, sampled from reels where sampled in ('outlier','ordinary')"))
    tags = load_tags()
    agree = agreement(tags)
    rows, n = table(tags, status)
    lines = [
        "# Hook mechanisms: lift table",
        "",
        f"Tagged blind: {n['outlier']} outliers, {n['ordinary']} ordinary twins (same account, closest date, "
        "0.5–2× the account median). Lift = share among outliers ÷ share among twins; 90% interval. "
        f"Called only with ≥ {MIN_OUT} outliers and agreement ≥ {MIN_AGREE} on the double-tagged reels.",
        "",
        "| Mechanism | Outliers | Twins | Lift | 90% interval | Agreement | Verdict |",
        "|---|---:|---:|---:|---|---:|---|",
    ]
    for r in rows:
        ag, seen = agree.get(r["mechanism"], (float("nan"), 0))
        if r["out"] < MIN_OUT:
            verdict = "too few"
        elif seen >= 4 and ag < MIN_AGREE:
            verdict = "unreliable tag"
        elif r["lo"] > 1:
            verdict = "**more in outliers**"
        elif r["hi"] < 1:
            verdict = "less in outliers"
        else:
            verdict = "no clear difference"
        agtxt = f"{ag:.2f} ({seen})" if seen else "–"
        lines.append(f"| `{r['mechanism']}` | {r['out']} ({r['out'] / n['outlier']:.0%}) | {r['ord']} ({r['ord'] / n['ordinary']:.0%}) "
                     f"| {r['lift']:.2f} | {r['lo']:.2f}–{r['hi']:.2f} | {agtxt} | {verdict} |")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
