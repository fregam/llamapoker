"""Tests for the evidence pull. Run: python -m unittest discover apps/reels/scripts/hooks"""
import sqlite3
import tempfile
import unittest
from pathlib import Path

from evidence import clean, select_quotes

SCHEMA = """CREATE TABLE items (n integer primary key, id text, source text, platform text, kind text,
thread_url text, parent_id text, title text, text text, lang text, created text, likes integer,
replies integer, rating integer, author_key text, extra text, skip text, topic integer, is_rec integer)"""


def fixture(rows):
    path = Path(tempfile.mkdtemp()) / "store.sqlite"
    c = sqlite3.connect(path)
    c.execute(SCHEMA)
    for i, (source, text, likes, lang, skip) in enumerate(rows):
        c.execute("insert into items (id, source, platform, thread_url, text, lang, likes, skip) values (?,?,?,?,?,?,?,?)",
                  (f"i{i}", source, "reddit", f"https://example.com/t/{source}", text, lang, likes, skip))
    c.commit()
    c.close()
    return path


class Clean(unittest.TestCase):
    def test_handles_emails_and_comment_permalinks_are_removed(self):
        out = clean("u/acesfan said ask @pok3r or mail me@x.com, see https://reddit.com/r/poker/comments/abc/x/def456")
        for gone in ["acesfan", "pok3r", "me@x.com", "def456"]:
            self.assertNotIn(gone, out)


class Select(unittest.TestCase):
    def test_problem_gambling_quotes_are_dropped_and_counted(self):
        db = fixture([("a", "my aces got cracked again, unreal", 5, "en", None),
                      ("b", "aces cracked so I kept chasing losses with my rent money", 50, "en", None)])
        quotes, dropped = select_quotes(db, "aces-win")
        self.assertEqual([q["text"] for q in quotes], ["my aces got cracked again, unreal"])
        self.assertEqual(dropped, 1)

    def test_noise_rows_and_other_languages_are_skipped(self):
        db = fixture([("a", "my pocket aces lost again", 1, "en", None),
                      ("b", "aces lost spam spam", 99, "en", "1"),
                      ("c", "mis ases perdieron, aces lost", 99, "es", None)])
        quotes, _ = select_quotes(db, "aces-win")
        self.assertEqual([q["source"] for q in quotes], ["a"])

    def test_only_the_viewers_own_voice_counts(self):
        db = fixture([("a", "Vivek and his ego, everyone has had aces cracked", 900, "en", None),
                      ("b", "my aces lose every single time I get them", 3, "en", None)])
        quotes, _ = select_quotes(db, "aces-win")
        self.assertEqual([q["source"] for q in quotes], ["b"])

    def test_regulars_are_not_our_viewer(self):
        db = fixture([("a", "I lost a $16k pot with aces playing 50/100", 900, "en", None),
                      ("b", "my solver says AA is a 4bet but I lost again", 500, "en", None),
                      ("c", "I keep losing with aces at my home game", 2, "en", None)])
        quotes, _ = select_quotes(db, "aces-win")
        self.assertEqual([q["source"] for q in quotes], ["c"])

    def test_no_source_holds_more_than_a_third(self):
        rows = [("big", f"my aces lost again #{i}", 100 - i, "en", None) for i in range(10)]
        rows += [("s1", "my AA cracked by 72o again tonight", 1, "en", None), ("s2", "aces always lose for me", 1, "en", None)]
        quotes, _ = select_quotes(db := fixture(rows), "aces-win", limit=9)
        self.assertLessEqual(sum(q["source"] == "big" for q in quotes), 3)
        self.assertEqual({"s1", "s2"} <= {q["source"] for q in quotes}, True)


if __name__ == "__main__":
    unittest.main()
