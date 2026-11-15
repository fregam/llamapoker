"""The one store under the research app: a SQLite file in data/ (git-ignored).

Items are what people wrote (posts, comments, reviews). No usernames ever: only author_key, a hash.
Every step that touches the store logs a run (step, target, result).
"""
import json
import sqlite3
import time
from pathlib import Path

CORE = ("id", "source", "platform", "kind", "thread_url", "parent_id", "title", "text",
        "lang", "created", "likes", "replies", "rating", "author_key")
# Columns later steps fill in; pending(col) lists the items still missing one.
STEP_COLS = {"lang": "text", "skip": "text", "topic": "integer", "is_rec": "integer"}

SCHEMA = """
create table if not exists items (
  n integer primary key,
  id text not null, source text not null, platform text, kind text, thread_url text,
  parent_id text, title text, text text not null, lang text, created text,
  likes integer, replies integer, rating integer, author_key text, extra text,
  skip text, topic integer, is_rec integer,
  unique (source, id)
);
create index if not exists items_source on items (source);
create table if not exists runs (
  n integer primary key, step text not null, target text,
  started real not null, ended real, result text
);
"""


class Store:
    def __init__(self, path):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(str(path))
        self.db.executescript(SCHEMA)

    def close(self):
        self.db.close()

    def count(self):
        return self.db.execute("select count(*) from items").fetchone()[0]

    def import_jsonl(self, path):
        """Load one collector file. Safe to repeat: (source, id) already stored is left alone."""
        res = {"added": 0, "empty": 0, "bad": 0}
        rows = []
        with open(path, encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    r = json.loads(line)
                except json.JSONDecodeError:
                    res["bad"] += 1
                    continue
                text = (r.get("text") or "").strip()
                title = (r.get("title") or "").strip()
                if r.get("kind") == "post" and title:
                    # a post's title is part of what the person said (often all of it)
                    text = f"{title}\n\n{text}" if text else title
                if not text or not r.get("id") or not r.get("source"):
                    res["empty"] += 1
                    continue
                extra = {k: v for k, v in r.items() if k not in CORE}
                rows.append(tuple(text if k == "text" else r.get(k) for k in CORE)
                            + (json.dumps(extra, ensure_ascii=False) if extra else None,))
        before = self.count()
        self.db.executemany(
            f"insert or ignore into items ({', '.join(CORE)}, extra) values ({', '.join('?' * (len(CORE) + 1))})",
            rows)
        self.db.commit()
        res["added"] = self.count() - before
        return res

    def sources(self):
        cur = self.db.execute(
            "select source, count(*), count(distinct author_key), min(created), max(created) "
            "from items group by source order by source")
        return [dict(zip(("source", "items", "authors", "first", "last"), r)) for r in cur]

    def pending(self, col, limit=None):
        """(n, text) of items a step hasn't filled yet."""
        assert col in STEP_COLS
        q = f"select n, text from items where {col} is null order by n" + (f" limit {int(limit)}" if limit else "")
        return self.db.execute(q).fetchall()

    def set_many(self, col, pairs):
        """pairs: (n, value)."""
        assert col in STEP_COLS
        self.db.executemany(f"update items set {col} = ? where n = ?", [(v, n) for n, v in pairs])
        self.db.commit()

    def mark_noise(self):
        """Fill `skip` for items that are not a person's own words, or one person repeating themself.
        Different people writing the same thing are never merged: how often it's said is the finding."""
        db = self.db
        db.execute("update items set skip = null")
        db.execute("update items set skip = 'description' where platform = 'youtube' and kind = 'post'")
        db.execute("update items set skip = 'removed' where skip is null and ("
                   "text like '[ Removed by Reddit%' or text in ('[removed]', '[deleted]', '[ Removed by moderator ]'))")
        db.execute("update items set skip = 'repost' where skip is null and n not in ("
                   "select min(n) from items where skip is null group by source, author_key, text) "
                   "and author_key is not null")
        # the same long text from many accounts is boilerplate (contest rules, channel blurbs)
        db.execute("update items set skip = 'boilerplate' where skip is null and length(text) >= 150 and text in ("
                   "select text from items where skip is null and length(text) >= 150 group by text having count(*) >= 3)")
        db.commit()
        return dict(db.execute("select skip, count(*) from items where skip is not null group by 1").fetchall())

    def start_run(self, step, target=None):
        cur = self.db.execute("insert into runs (step, target, started) values (?, ?, ?)", (step, target, time.time()))
        self.db.commit()
        return cur.lastrowid

    def end_run(self, run_id, result=None):
        self.db.execute("update runs set ended = ?, result = ? where n = ?",
                        (time.time(), json.dumps(result) if result is not None else None, run_id))
        self.db.commit()
