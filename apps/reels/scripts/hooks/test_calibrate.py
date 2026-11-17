"""Tests for the critic calibration scorer."""
import unittest

from calibrate import score

EXPECT = {"limits": {"c01": {"fail": []}, "c02": {"fail": ["claim"]}, "c03": {"fail": []}},
          "rank_pairs": [{"above": "c01", "below": "c03"}]}


def critic(verdicts, rank):
    return {"verdicts": {i: {k: [v, ""] for k, v in d.items()} for i, d in verdicts.items()}, "rank": rank}


OK = {"claim": "pass", "honest": "pass", "helping": "pass"}


class Score(unittest.TestCase):
    def test_all_expectations_met_gives_no_misses(self):
        c = critic({"c01": OK, "c02": {**OK, "claim": "fail"}, "c03": OK}, ["c01", "c03"])
        self.assertEqual(score(EXPECT, c), [])

    def test_a_missed_failure_and_a_wrong_order_are_both_reported(self):
        c = critic({"c01": OK, "c02": OK, "c03": OK}, ["c03", "c02", "c01"])
        self.assertEqual(len(score(EXPECT, c)), 2)

    def test_an_extra_limit_on_a_line_that_should_fail_anyway_is_not_a_miss(self):
        c = critic({"c01": OK, "c02": {**OK, "claim": "fail", "honest": "fail"}, "c03": OK}, ["c01", "c03"])
        self.assertEqual(score(EXPECT, c), [])

    def test_an_open_case_accepts_either_verdict(self):
        e = {"limits": {"c01": {"fail": None}}, "rank_pairs": []}
        self.assertEqual(score(e, critic({"c01": {**OK, "claim": "fail"}}, [])), [])
        self.assertEqual(score(e, critic({"c01": OK}, ["c01"])), [])

    def test_a_pair_holds_when_the_lower_line_failed_a_limit(self):
        c = critic({"c01": OK, "c02": {**OK, "claim": "fail"}, "c03": {**OK, "claim": "fail"}}, ["c01"])
        misses = score({**EXPECT, "limits": {"c01": {"fail": []}, "c02": {"fail": ["claim"]}}}, c)
        self.assertEqual(misses, [])


if __name__ == "__main__":
    unittest.main()
