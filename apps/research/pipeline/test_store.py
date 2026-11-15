"""Run: py -3.11 -m unittest discover -s pipeline -p "test_*.py"  (from apps/research)."""
import json
import tempfile
import unittest
from pathlib import Path

from store import Store


def item(**kw):
    base = {
        "id": "c1", "source": "fo-x", "platform": "forum", "kind": "comment",
        "thread_url": "https://example.com/t/1", "parent_id": None, "title": "T",
        "text": "I always lose with aces", "lang": None, "created": "2026-05-01",
        "likes": 2, "replies": 0, "rating": None, "author_key": "abc123abc123",
    }
    return {**base, **kw}


class StoreTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.store = Store(self.dir / "t.sqlite")

    def tearDown(self):
        self.store.close()
        self.tmp.cleanup()

    def write(self, name, rows):
        p = self.dir / name
        p.write_text("\n".join(json.dumps(r) if isinstance(r, dict) else r for r in rows) + "\n", encoding="utf-8")
        return p

    def test_import_is_idempotent(self):
        p = self.write("fo-x.jsonl", [item(), item(id="c2", text="rigged app")])
        self.assertEqual(self.store.import_jsonl(p)["added"], 2)
        self.assertEqual(self.store.import_jsonl(p)["added"], 0)
        self.assertEqual(self.store.count(), 2)

    def test_same_id_in_two_sources_stays_two_items(self):
        self.store.import_jsonl(self.write("a.jsonl", [item(source="a")]))
        self.store.import_jsonl(self.write("b.jsonl", [item(source="b")]))
        self.assertEqual(self.store.count(), 2)

    def test_empty_text_and_bad_lines_are_skipped_and_counted(self):
        p = self.write("fo-x.jsonl", [item(), item(id="c2", text="   "), "{not json", item(id="c3", text=None)])
        r = self.store.import_jsonl(p)
        self.assertEqual((r["added"], r["empty"], r["bad"]), (1, 2, 1))

    def test_extra_fields_are_kept(self):
        self.store.import_jsonl(self.write("gp.jsonl", [item(country="us", app_version="1.2")]))
        row = self.store.db.execute("select extra from items").fetchone()
        self.assertEqual(json.loads(row[0]), {"country": "us", "app_version": "1.2"})

    def test_sources_summary(self):
        self.store.import_jsonl(self.write("fo-x.jsonl", [
            item(), item(id="c2", author_key="zzz", created="2026-01-01"), item(id="c3", author_key="zzz"),
        ]))
        s = self.store.sources()[0]
        self.assertEqual((s["source"], s["items"], s["authors"], s["first"], s["last"]),
                         ("fo-x", 3, 2, "2026-01-01", "2026-05-01"))

    def test_post_title_is_part_of_the_text(self):
        self.store.import_jsonl(self.write("rd.jsonl", [
            item(id="p1", kind="post", title="Is this app rigged?", text=""),
            item(id="p2", kind="post", title="AA again", text="Lost with aces"),
            item(id="c9", kind="comment", title="AA again", text="unlucky"),
        ]))
        texts = [r[0] for r in self.store.db.execute("select text from items order by n")]
        self.assertEqual(texts, ["Is this app rigged?", "AA again\n\nLost with aces", "unlucky"])

    def test_noise_is_marked_but_other_people_saying_the_same_are_kept(self):
        long = "Comment on this week's topic to enter the ticket drop. " * 4
        self.store.import_jsonl(self.write("x.jsonl", [
            item(id="a", text="rigged", author_key="p1"),
            item(id="b", text="rigged", author_key="p2"),          # another person: kept
            item(id="c", text="rigged", author_key="p1"),          # same person again: repost
            item(id="d", text="[removed]", author_key="p3"),
            item(id="e", platform="youtube", kind="post", title="Vid", text="channel blurb", author_key=None),
            item(id="f", text=long, author_key="p4"), item(id="g", text=long, author_key="p5"),
            item(id="h", text=long, author_key="p6"),
        ]))
        self.assertEqual(self.store.mark_noise(), {"repost": 1, "removed": 1, "description": 1, "boilerplate": 3})
        kept = [r[0] for r in self.store.db.execute("select id from items where skip is null order by n")]
        self.assertEqual(kept, ["a", "b"])

    def test_runs_are_logged(self):
        rid = self.store.start_run("import", "fo-x")
        self.store.end_run(rid, {"added": 3})
        row = self.store.db.execute("select step, target, ended is not null, result from runs").fetchone()
        self.assertEqual(row, ("import", "fo-x", 1, '{"added": 3}'))

    def test_set_lang_and_pending(self):
        self.store.import_jsonl(self.write("fo-x.jsonl", [item(), item(id="c2")]))
        pending = self.store.pending("lang")
        self.assertEqual(len(pending), 2)
        self.store.set_many("lang", [(pending[0][0], "en")])
        self.assertEqual(len(self.store.pending("lang")), 1)


if __name__ == "__main__":
    unittest.main()
