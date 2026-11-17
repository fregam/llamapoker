"""The evidence file for a hook topic: real viewer words from the research store.
Spec: .scratch/hook-writing/spec.md (decisions 4 and 6, Privacy).

    python evidence.py <topic> <out-dir> [--db <path>] [--limit 45]    writes <out-dir>/evidence.md

Opens the store read-only (collectors write to it while they run). English only, noise rows
(`skip`) out, problem-gambling quotes dropped (counted, never shown), handles and comment
permalinks stripped, no source above a third of the file.
"""
import argparse
import math
import re
import sqlite3
import sys
from pathlib import Path

DEFAULT_DB = Path("E:/Projects/poker-trainer/.claude/worktrees/audience-research/apps/research/data/research.sqlite")

# Each topic: a broad SQL prefilter (substrings, case-insensitive), then every regex group must match.
TOPICS = {
    "aces-win": [
        ["aces", "aa", "rockets"],
        [r"\baces\b|\bAA\b|pocket rockets"],
        [r"\blos[te]?\b|\blosing\b|\bcracked\b|\bbeat\b|\brigged\b|\bevery ?time\b|\balways\b|\bnever win\b|\bbad beat"],
    ],
    "premium-only": [
        ["premium", "only play", "good hands", "fold", "tight", "nit", "card dead", "waiting for"],
        [r"only play(ing)? (premium|good|strong|top|big)|wait(ing)? (for|around for) (aces|premiums?|good hands|a good hand|big hands)"
         r"|fold(ing|ed)? (everything|all day|all night|for hours|every hand)|card dead|too tight|playing tight|(I'm|I am|being) (a |such a )?nit\b"],
    ],
    "draw-hits": [
        ["draw", "outs", "gutshot", "open ended", "open-ended"],
        [r"flush draw|straight draw|gutshot|open.ended|\bouts\b|chas(e|ed|ing) (a |my |the )?(draw|flush|straight)"
         r"|draws? (never|always|didn't|don't) (hit|come)|missed (my|the) (flush|straight|draw)"],
    ],
}

PROBLEM = re.compile(
    r"chas(e|ed|ing) (my |the )?loss|rent money|can'?t stop|cannot stop|addict|\bdebt\b|borrow|\bloan\b"
    r"|lost everything|my savings|life savings|payday|escape from|gambling problem|problem gambl"
    r"|suicid|kill myself|end it all|self.?exclu|\bgamcare\b|\bgamblers anonymous\b", re.I)

# The viewer's own voice: lived experience, not a reaction to someone else's hand on a show.
FIRST_PERSON = re.compile(r"\b(I|I'm|I've|I'd|Im|my|me|mine)\b", re.I)

# Regulars, not our viewer (audience spec: "a keyword pre-filter in code first").
REGULAR = re.compile(
    r"\bsolvers?\b|\bGTO\b|\bHUD\b|\bvpip\b|\bpfr\b|\b[345]-?bet|multi.?tabl|\bPLO\d?\b|\bMTTs?\b|\bACR\b"
    r"|\b(25|50|100|200)/(50|100|200|400)\b|\$\d+(\.\d+)?k\b|\b\d+k (pot|hands)\b|\bbb/100\b", re.I)

PERMALINK = re.compile(r"(https?://\S*?/comments/\w+)(/[^/\s]*)?/\w+/?")
HANDLE = re.compile(r"\bu/[\w-]+|(?<![\w.])@[\w.]+|\b[\w.+-]+@[\w-]+\.[\w.]+\b")


def clean(text: str) -> str:
    text = PERMALINK.sub(r"\1", text)
    text = HANDLE.sub("[someone]", text)
    return re.sub(r"\s+", " ", text).strip()


def _thread(url: str) -> str:
    return PERMALINK.sub(r"\1", url or "")


def select_quotes(db: Path, topic: str, limit: int = 45):
    anchors, *patterns = TOPICS[topic]
    regexes = [re.compile(p, re.I) for group in patterns for p in group]
    con = sqlite3.connect(f"file:{Path(db).as_posix()}?mode=ro", uri=True, timeout=60)
    where = " or ".join("text like ?" for _ in anchors)
    rows = con.execute(
        f"select source, platform, thread_url, text, coalesce(likes,0)+coalesce(replies,0) "
        f"from items where skip is null and lang = 'en' and length(text) between 20 and 400 and ({where})",
        [f"%{a}%" for a in anchors]).fetchall()
    con.close()
    hits, dropped = [], 0
    for source, platform, url, text, eng in rows:
        if not FIRST_PERSON.search(text) or REGULAR.search(text) or not all(r.search(text) for r in regexes):
            continue
        if PROBLEM.search(text):
            dropped += 1
            continue
        hits.append({"source": source, "platform": platform, "thread": _thread(url), "text": clean(text), "engagement": eng})
    # log scale: one viral comment must not bury forty lived ones; longer first-person lines read richer
    hits.sort(key=lambda q: -(math.log1p(max(0, q["engagement"])) + min(len(q["text"]), 240) / 120))
    cap, per, out, seen = math.ceil(limit / 3), {}, [], set()
    for q in hits:
        if len(out) == limit:
            break
        if per.get(q["source"], 0) >= cap or q["text"].lower() in seen:
            continue
        per[q["source"]] = per.get(q["source"], 0) + 1
        seen.add(q["text"].lower())
        out.append(q)
    return out, dropped


def write(quotes, dropped, topic: str, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    lines = [f"# Evidence: {topic}", "",
             f"{len(quotes)} quotes from the research store (English, noise out, {dropped} problem-gambling "
             f"quotes dropped). Verbatim, handles removed. Cite by id.", ""]
    for i, q in enumerate(quotes, 1):
        lines.append(f"- **q-{i}** ({q['platform']}, {q['engagement']} likes+replies, {q['thread']}): \"{q['text']}\"")
    text = "\n".join(lines) + "\n"
    leaks = HANDLE.findall(text.replace("[someone]", ""))
    if leaks:
        raise SystemExit(f"privacy check failed: {leaks[:3]}")
    path = out_dir / "evidence.md"
    path.write_text(text, encoding="utf-8")
    return path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("topic", choices=TOPICS)
    ap.add_argument("out_dir", type=Path)
    ap.add_argument("--db", type=Path, default=DEFAULT_DB)
    ap.add_argument("--limit", type=int, default=45)
    a = ap.parse_args()
    quotes, dropped = select_quotes(a.db, a.topic, a.limit)
    path = write(quotes, dropped, a.topic, a.out_dir)
    print(f"{path}: {len(quotes)} quotes, {len({q['source'] for q in quotes})} sources, {dropped} dropped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
