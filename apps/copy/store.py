"""The copy research store and the click data (ORCAS).
Spec: .scratch/copy-research/spec.md, ticket 01.

    python store.py fetch [small|candidates|docs|all]   download into data/raw/orcas/ and check md5 sums
    python store.py load                                load the click file into data/copy.sqlite
    python store.py summary

Store: data/copy.sqlite (git-ignored, on E:). ORCAS and MS MARCO are licensed for non-commercial
research only (NC): the raw files and page text never enter git.
"""
import gzip
import hashlib
import sqlite3
import sys
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
DATA = HERE / "data"
RAW = DATA / "raw" / "orcas"
DB = DATA / "copy.sqlite"
BASE = "https://msmarco-gkbqakfehxgtezgg.b01.azurefd.net/msmarcoranking/"

# name -> (group, md5 or None when the dataset page gives none)
FILES = {
    "orcas.tsv.gz": ("small", "4b9350bf997c5c0eaa562be81c796981"),
    "orcas-doctrain-queries.tsv.gz": ("small", "519c5f522294406e3b0574d7d53cf233"),
    "msmarco-docs-lookup.tsv.gz": ("small", None),
    "orcas-doctrain-top100.gz": ("candidates", "118d0884638fd405e111157a124ef0b2"),
    "msmarco-docs.tsv.gz": ("docs", None),
}

SCHEMA = """
create table if not exists queries (id text primary key, text text not null);
create table if not exists pages (
  doc text primary key, url text not null, site text not null, scoreboard text not null,
  score real, text_path text, kept integer not null default 0);
create table if not exists clicks (query text not null, doc text not null, primary key (query, doc)) without rowid;
create table if not exists candidates (query text not null, doc text not null, rank integer not null,
  primary key (query, doc)) without rowid;
create table if not exists writers (
  name text not null, scoreboard text not null, wins integer not null default 0,
  shown integer not null default 0, proven integer not null default 0, primary key (name, scoreboard));
create index if not exists pages_site on pages (site);
create index if not exists clicks_doc on clicks (doc);
"""


def site_of(url: str) -> str:
    """The host, lower case, without a leading www. and without a port. Empty when there is none."""
    host = urllib.parse.urlsplit(url).hostname or ""
    return host[4:] if host.startswith("www.") else host


def parse_click(line: str):
    """A row of orcas.tsv: qid, query, did, url. None when the row is not four columns."""
    parts = line.rstrip("\r\n").split("\t")
    return tuple(parts) if len(parts) == 4 else None


def parse_candidate(line: str):
    """A row of the top-100 file (TREC run: qid Q0 docid rank score run) -> (qid, docid, rank)."""
    parts = line.split()
    if len(parts) < 6:
        return None
    return parts[0], parts[2], int(parts[3])


def md5_of(path: Path) -> str:
    h = hashlib.md5()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def init(db: sqlite3.Connection) -> None:
    db.executescript(SCHEMA)


def load_clicks(db: sqlite3.Connection, src: Path, batch: int = 50_000) -> dict:
    """Loads the click file. Safe to run twice: rows already there are left alone."""
    rows = bad = 0
    q, p, c = [], [], []

    def flush():
        db.executemany("insert or ignore into queries values (?, ?)", q)
        db.executemany("insert or ignore into pages (doc, url, site, scoreboard) values (?, ?, ?, 'search')", p)
        db.executemany("insert or ignore into clicks values (?, ?)", c)
        db.commit()
        q.clear(), p.clear(), c.clear()

    with gzip.open(src, "rt", encoding="utf-8", errors="replace") as f:
        for line in f:
            row = parse_click(line)
            if row is None:
                bad += 1
                continue
            qid, query, doc, url = row
            q.append((qid, query))
            p.append((doc, url, site_of(url)))
            c.append((qid, doc))
            rows += 1
            if len(c) >= batch:
                flush()
    flush()
    return {"rows": rows, "bad": bad}


def fetch(group: str) -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    for name, (g, md5) in FILES.items():
        if group not in ("all", g):
            continue
        dest = RAW / name
        if not dest.exists():
            part = dest.with_suffix(dest.suffix + ".part")
            start = part.stat().st_size if part.exists() else 0
            req = urllib.request.Request(BASE + name, headers={"Range": f"bytes={start}-"} if start else {})
            with urllib.request.urlopen(req) as r, open(part, "ab" if r.status == 206 else "wb") as out:
                done = start if r.status == 206 else 0
                for block in iter(lambda: r.read(1 << 22), b""):
                    out.write(block)
                    done += len(block)
                    print(f"\r{name}: {done / 1e6:,.0f} MB", end="", flush=True)
            part.rename(dest)
            print()
        got = md5_of(dest)
        state = "no md5 published" if md5 is None else ("md5 ok" if got == md5 else f"MD5 MISMATCH (expected {md5})")
        print(f"{name}: {dest.stat().st_size:,} bytes, {got}, {state}")


def summary(db: sqlite3.Connection) -> None:
    for table in ("queries", "pages", "clicks", "candidates", "writers"):
        print(f"{table}: {db.execute(f'select count(*) from {table}').fetchone()[0]:,}")
    print("sites:", f"{db.execute('select count(distinct site) from pages').fetchone()[0]:,}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "summary"
    if cmd == "fetch":
        fetch(sys.argv[2] if len(sys.argv) > 2 else "small")
    else:
        DATA.mkdir(parents=True, exist_ok=True)
        con = sqlite3.connect(DB)
        init(con)
        if cmd == "load":
            print(load_clicks(con, RAW / "orcas.tsv.gz"))
        summary(con)
