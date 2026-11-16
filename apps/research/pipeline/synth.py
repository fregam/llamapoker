"""Turn findings.json + the readers' claims into the committed evidence. Run from apps/research:

  py -3.11 pipeline/synth.py

For each finding: resolve its reader claims, work out which source types and languages back it
(CardsChat never counts as one of the two types), and pick up to three quotes that pass every check:
verbatim in the store, item not skipped, no handle or link, not from a responsible-gambling claim,
not written by the channel's owner, English available. Writes, under content/research/audience/:

  findings.json  id, statement, segments, status (finding | lead), source types, languages, quote ids
  quotes.md      the quotes, by id
and data/quote-map.json (quote id -> store item; stays out of git).
"""
import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from group_claims import READ, source_type  # noqa: E402
from run import DB, ROOT  # noqa: E402
from store import Store  # noqa: E402

OUT = ROOT.parent.parent / "content" / "research" / "audience"
CHANNELS = ["UCb68KqK_ablngWaIzQq14bQ", "UCSeOo8RomI5odRk99sKoAkg", "UCdjh5RJG1HdL6WTUG9bptsQ", "UCg7Z47vL_8PJV9IGNAlH9JA",
            "UCTgpzgnUwgmEe3qIlFZgxng", "UCoCOwFS1_-D0lo3DexFpdfw", "UCOWqXBOz_hoBtaqwWN_kaQQ", "UCG461ELAT_eu50sXexb6KUQ",
            "UCEUGxpG2rkyJlCvr46PBr6g"]
OWNERS = {hashlib.sha1(c.encode()).hexdigest()[:12] for c in CHANNELS}
UNSAFE = re.compile(r"@\w|https?://|www\.|\bu/\w|\br/\w+/comments", re.I)
TYPE_NAMES = {"app-reviews": "app review", "forum": "forum", "community": "Reddit", "youtube": "YouTube comment", "qa": "Q&A"}
squash = lambda s: " ".join(str(s).split())


def claims_by_reader():
    out = {}
    for p in READ.glob("*/findings.json"):
        out[p.parent.name] = {str(c.get("id")): c for c in json.loads(p.read_text(encoding="utf-8")).get("claims", [])}
    return out


def check_quote(store, q, claim):
    """Return (item row, verbatim text) or (None, reason)."""
    text = squash(q.get("text") or "")
    if not text or claim.get("rg") or UNSAFE.search(text) or len(text) > 220:
        return None, "empty, rg, unsafe or long"
    n = q.get("n") or q.get("item") or q.get("id")
    row = None
    if isinstance(n, int) or (isinstance(n, str) and n.isdigit()):
        row = store.db.execute("select n, source, lang, created, author_key, text, skip from items where n = ?", (int(n),)).fetchone()
    if row is None and q.get("source"):
        for r in store.db.execute("select n, source, lang, created, author_key, text, skip from items where source = ? and skip is null",
                                  (q["source"],)):
            if text in squash(r[5]):
                row = r
                break
    if row is None:
        return None, "item not found"
    if row[6] is not None or text not in squash(row[5]):
        return None, "not verbatim or skipped"
    if row[4] in OWNERS:
        return None, "channel owner"
    lang = q.get("lang") or row[2] or "en"
    if lang != "en" and not (q.get("en") or "").strip():
        if re.search(r"[^\x00-\x7f]{3}", text):  # clearly not English and no translation
            return None, "no English"
        lang = "en"
    return row, {"text": text, "lang": lang, "en": squash(q.get("en") or "") if lang != "en" else ""}


def write_claims_digest():
    """The readers' claims live under git-ignored data/. This keeps what two or more readers said, in
    words only (no quotes, no counts as shares), so the evidence survives a lost data folder."""
    path = READ / "groups.json"
    if not path.exists():
        return
    lines = ["# What the readers said", "",
             "Every claim that two or more of the 23 readers recorded independently, grouped in code",
             "(`apps/research/pipeline/group_claims.py`, threshold 0.87; a few groups mix neighbouring ideas).",
             "One line per group: readers · source types (CardsChat not counted) · languages, then the claim",
             "as its strongest reader worded it. `rg` = responsible-gambling ground: never a hook. Groups with",
             "one source type are leads. Written by `pipeline/synth.py`; do not edit by hand.", ""]
    for g in json.loads(path.read_text(encoding="utf-8")):
        if len(g["readers"]) < 2:
            continue
        text = squash(g["claim"])
        if UNSAFE.search(text):
            continue
        flags = (" · rg" if g["rg"] else "") + ("" if g["two_types"] else " · lead")
        lines.append(f"- {len(g['readers'])} readers · {', '.join(g['source_types']) or 'forum (CardsChat only)'} · "
                     f"{', '.join(g['langs']) or 'en'}{flags}: {text}")
    (OUT / "claims.md").write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")


def main():
    spec = json.loads((ROOT / "findings.json").read_text(encoding="utf-8"))
    by_reader = claims_by_reader()
    store = Store(DB)
    findings, quote_lines, quote_map, problems = [], [], {}, []
    published = {}
    if (OUT / "quotes.md").exists():
        for m in re.finditer(r'^- \*\*(Q-[A-Z0-9]+-\d+)\*\* \([^)]*\) "(.*?)"(?: — EN: ".*")?$', (OUT / "quotes.md").read_text(encoding="utf-8"), re.M):
            published[m.group(1)] = m.group(2)
    for f in spec["findings"]:
        claims = []
        for ref in f["refs"]:
            reader, cid = ref.split("|")
            c = by_reader.get(reader, {}).get(cid)
            if c is None:
                problems.append(f"{f['id']}: no claim {ref}")
                continue
            claims.append((reader, c))
        sources = sorted({str(s) for _, c in claims for s in (c.get("sources") or [])})
        # A type counts only when at least two (claim, source) pairs carry it: one stray item is not support.
        support = Counter(source_type(s) for _, c in claims for s in (c.get("sources") or []) if not str(s).startswith("fo-cc"))
        types = sorted(t for t, k in support.items() if t and k >= 2)
        langs = sorted({r[5:] for r, _ in claims if r.startswith("LANG-")} | ({"en"} if any(not r.startswith("LANG-") for r, _ in claims) else set()))
        cands = []
        for reader, c in claims:
            for q in c.get("quotes") or []:
                if not isinstance(q, dict):
                    continue
                row, res = check_quote(store, q, c)
                if row is not None and not any(w.lower() in res["text"].lower() for w in f.get("exclude", [])):
                    cands.append((row, res))
        # Prefer voices outside CardsChat, then spread across source types, then short.
        # the author of findings.json may name the quotes that say it best (substrings in "prefer").
        norm = lambda t: t.lower().replace("’", "'")
        prefer = [norm(w) for w in f.get("prefer", [])]
        rank = lambda text: next((i for i, w in enumerate(prefer) if w in norm(text)), len(prefer))
        cands.sort(key=lambda x: (rank(x[1]["text"]), x[0][1].startswith("fo-cc"), x[1]["lang"] != "en",
                                  abs(len(x[1]["text"]) - 100)))
        picked, seen_types, seen_n = [], set(), set()
        for want_new_type in (True, False):
            for row, res in cands:
                t = source_type(row[1])
                named = rank(res["text"]) < len(prefer)
                if len(picked) >= 3 or row[0] in seen_n or (want_new_type and t in seen_types and not named):
                    continue
                picked.append((row, res))
                seen_types.add(t)
                seen_n.add(row[0])
        qids = []
        # Ids are sticky: a quote keeps the id it was first published under; new picks take the next number.
        mine = {t: q for q, t in published.items() if q.startswith(f"Q-{f['id']}-")}
        top = max([int(q.rsplit("-", 1)[1]) for q in mine.values()] or [0])
        for row, res in picked:
            qid = mine.get(res["text"])
            if qid is None:
                top += 1
                qid = f"Q-{f['id']}-{top}"
            qids.append(qid)
            quote_map[qid] = {"n": row[0], "source": row[1]}
            where = f"{TYPE_NAMES[source_type(row[1])]} · {res['lang']} · {(row[3] or '')[:7] or 'n.d.'}"
            line = f"- **{qid}** ({where}) \"{res['text']}\""
            if res["en"]:
                line += f" — EN: \"{res['en']}\""
            quote_lines.append(line)
        if not qids:
            problems.append(f"{f['id']}: no quote passed the checks")
        findings.append({
            "id": f["id"], "kind": f["kind"], "segments": f["segments"], "say": f["say"],
            "status": "finding" if len(types) >= 2 and not f.get("lead") else "lead", "source_types": types, "languages": langs,
            "readers": sorted({r for r, _ in claims}), "sources": len(sources), "quotes": qids,
        })
    store.close()
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "findings.json").write_text(json.dumps(findings, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    head = ("# Quotes\n\nThe quotes cited in `pack.md`, `topics.md` and `study.md`, verbatim. Each was checked in code against the\n"
            "collected item: word for word, no usernames, handles or links, not from a responsible-gambling claim, not\n"
            "the channel owner's own reply. Written by `apps/research/pipeline/synth.py`; do not edit by hand.\n"
            "Format: id (source type · language · month) \"quote\" — EN: translation when not English.\n\n")
    (OUT / "quotes.md").write_text(head + "\n".join(quote_lines) + "\n", encoding="utf-8", newline="\n")
    write_claims_digest()
    (ROOT / "data" / "quote-map.json").write_text(json.dumps(quote_map, indent=1), encoding="utf-8")
    for f in findings:
        print(f"{f['id']:10} {f['status']:7} r{len(f['readers'])} {','.join(t[:3] for t in f['source_types'])} "
              f"{','.join(f['languages'])} q{len(f['quotes'])}")
    print("\n".join(problems) or "no problems")


if __name__ == "__main__":
    main()
