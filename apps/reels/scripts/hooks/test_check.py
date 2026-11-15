"""Tests for the hook code checks (spec checks 1-3). Run: python -m unittest discover apps/reels/scripts/hooks"""
import unittest

from check import check_hook

FACTS = {
    "aa-vs-1": {"id": "aa-vs-1", "claim": "AA vs one random hand, preflop all-in to the river", "value": 85.2, "unit": "%"},
    "premium-share": {"id": "premium-share", "claim": "share of dealt hands that are AA, KK, QQ or AK", "value": 2.56, "unit": "%"},
    "flush-river": {"id": "flush-river", "claim": "flop flush draw completes by the river", "value": 34.97, "unit": "%"},
    "wait-bb": {"id": "wait-bb", "claim": "blinds paid at 6-max while waiting for one premium", "value": 9.75, "unit": "bb"},
}


def hook(line, fact_ids=("aa-vs-1",), promise_word=3, **kw):
    return {"id": "h1", "line": line, "promise_word": promise_word, "fact_ids": list(fact_ids), **kw}


def failed(result):
    return [f["check"] for f in result]


class Numbers(unittest.TestCase):
    def test_a_percent_rounded_from_its_cited_fact_passes(self):
        self.assertEqual(check_hook(hook("Pocket aces win 85% heads-up."), FACTS), [])

    def test_a_percent_that_is_not_the_cited_value_fails(self):
        self.assertEqual(failed(check_hook(hook("Pocket aces win 90% heads-up."), FACTS)), ["numbers"])

    def test_a_number_without_a_cited_fact_fails(self):
        self.assertEqual(failed(check_hook(hook("Pocket aces win 85% heads-up.", fact_ids=()), FACTS)), ["numbers"])

    def test_citing_an_id_missing_from_the_sheet_fails(self):
        self.assertEqual(failed(check_hook(hook("Folding is free.", fact_ids=("nope",)), FACTS)), ["numbers"])

    def test_a_count_matches_a_non_percent_fact(self):
        self.assertEqual(check_hook(hook("You've paid 10 bb before they come.", fact_ids=("wait-bb",)), FACTS), [])

    def test_a_ratio_in_digits_or_words_is_checked_against_a_percent(self):
        ok = [("1 in 39 hands is premium.", "premium-share"), ("One premium every 39 hands.", "premium-share"),
              ("It hits one in three times.", "flush-river")]
        for line, fid in ok:
            self.assertEqual(check_hook(hook(line, fact_ids=(fid,)), FACTS), [], line)
        self.assertEqual(failed(check_hook(hook("It hits one in two times.", fact_ids=("flush-river",)), FACTS)), ["numbers"])

    def test_small_counts_in_words_are_not_stats(self):
        self.assertEqual(check_hook(hook("Four hearts. Two cards to come.", fact_ids=()), FACTS), [])


class Words(unittest.TestCase):
    def test_gambling_glamour_and_real_money_use_fail(self):
        for line in ["Crush the tables with this one trick.", "Easy money from pocket aces.",
                     "Use this while you play for real money."]:
            self.assertEqual(failed(check_hook(hook(line, fact_ids=()), FACTS)), ["words"], line)

    def test_handles_and_a_misspelt_brand_fail(self):
        for line in ["As u/acesfan said, aces lose.", "Ask @pokerguy why.", "Llama Poker shows why."]:
            self.assertEqual(failed(check_hook(hook(line, fact_ids=()), FACTS)), ["words"], line)

    def test_naming_a_myth_is_allowed(self):
        self.assertEqual(check_hook(hook("The app isn't rigged.", fact_ids=()), FACTS), [])


class Length(unittest.TestCase):
    def test_the_promise_after_word_seven_fails(self):
        self.assertEqual(failed(check_hook(hook("Pocket aces.", fact_ids=(), promise_word=8), FACTS)), ["length"])

    def test_more_than_25_words_fails(self):
        line = " ".join(["fold"] * 26)
        self.assertEqual(failed(check_hook(hook(line, fact_ids=()), FACTS)), ["length"])

    def test_25_words_with_an_early_promise_passes(self):
        line = " ".join(["fold"] * 25)
        self.assertEqual(check_hook(hook(line, fact_ids=(), promise_word=7), FACTS), [])


class Quotes(unittest.TestCase):
    def test_cited_quotes_must_exist_in_the_evidence(self):
        h = hook("Aces lose.", fact_ids=(), quote_ids=["q-3", "q-99"])
        self.assertEqual(failed(check_hook(h, FACTS, evidence_ids={"q-1", "q-3"})), ["quotes"])

    def test_a_control_hook_with_no_quotes_passes(self):
        self.assertEqual(check_hook(hook("Aces lose.", fact_ids=()), FACTS, evidence_ids=None), [])


if __name__ == "__main__":
    unittest.main()
