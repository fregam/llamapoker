"""Tests for the pure parts of the copy store. Run: python -m unittest discover -s apps/copy -p "test_*.py" """
import gzip
import hashlib
import sqlite3
import tempfile
import unittest
from pathlib import Path

import store


class SiteOf(unittest.TestCase):
    def test_strips_scheme_www_port_and_case(self):
        self.assertEqual(store.site_of("https://WWW.Example.com:443/a/b?c=1"), "example.com")

    def test_keeps_subdomains_other_than_www(self):
        self.assertEqual(store.site_of("http://en.wikipedia.org/wiki/Pot_odds"), "en.wikipedia.org")

    def test_no_host_is_empty(self):
        self.assertEqual(store.site_of("not a url"), "")


class ParseClick(unittest.TestCase):
    def test_four_columns(self):
        row = store.parse_click("9\twhat are pot odds\tD42\thttps://a.com/x\n")
        self.assertEqual(row, ("9", "what are pot odds", "D42", "https://a.com/x"))

    def test_bad_row_is_none(self):
        self.assertIsNone(store.parse_click("9\tonly two\n"))

    def test_tab_free_query_with_spaces_and_trailing_newline(self):
        self.assertEqual(store.parse_click("1\t a b \tD1\thttp://b.org\r\n")[1], " a b ")


class ParseCandidate(unittest.TestCase):
    def test_trec_line(self):
        self.assertEqual(store.parse_candidate("9 Q0 D42 3 -5.12 IndriQueryLikelihood\n"), ("9", "D42", 3))

    def test_bad_line_is_none(self):
        self.assertIsNone(store.parse_candidate("9 Q0 D42\n"))


class LoadClicks(unittest.TestCase):
    def test_loads_queries_pages_and_clicks_once(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "orcas.tsv.gz"
            with gzip.open(src, "wt", encoding="utf-8") as f:
                f.write("1\tpot odds\tD1\thttps://www.a.com/p\n")
                f.write("2\touts\tD1\thttps://www.a.com/p\n")
                f.write("2\touts\tD2\thttps://b.org/o\n")
                f.write("broken line\n")
            db = sqlite3.connect(Path(tmp) / "t.sqlite")
            store.init(db)
            stats = store.load_clicks(db, src)
            stats_again = store.load_clicks(db, src)
            self.assertEqual(stats, {"rows": 3, "bad": 1})
            self.assertEqual(stats_again, {"rows": 3, "bad": 1})
            self.assertEqual(db.execute("select count(*) from queries").fetchone()[0], 2)
            self.assertEqual(db.execute("select count(*) from clicks").fetchone()[0], 3)
            self.assertEqual(db.execute("select site, scoreboard from pages where doc='D1'").fetchone(),
                             ("a.com", "search"))
            db.close()


class Md5(unittest.TestCase):
    def test_md5_of_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "f"
            p.write_bytes(b"llama")
            self.assertEqual(store.md5_of(p), hashlib.md5(b"llama").hexdigest())


if __name__ == "__main__":
    unittest.main()
