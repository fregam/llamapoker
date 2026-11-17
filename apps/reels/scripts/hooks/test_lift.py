"""Tests for the lift table (ticket 05)."""
import unittest

from lift import agreement, lift


class Lift(unittest.TestCase):
    def test_equal_shares_give_a_lift_of_one(self):
        r, lo, hi = lift(20, 100, 20, 100)
        self.assertAlmostEqual(r, 1.0)
        self.assertLess(lo, 1)
        self.assertGreater(hi, 1)

    def test_twice_the_share_in_outliers_is_a_lift_of_two_and_clear_with_enough_reels(self):
        r, lo, _ = lift(120, 400, 60, 400)
        self.assertAlmostEqual(r, 2.0)
        self.assertGreater(lo, 1)


class Agreement(unittest.TestCase):
    def test_positive_agreement_counts_only_reels_tagged_twice(self):
        tags = {"a": [{"x"}, {"x"}], "b": [{"x"}, set()], "c": [{"x"}]}
        self.assertEqual(agreement(tags)["x"], (2 * 1 / (1 + 2), 2))


if __name__ == "__main__":
    unittest.main()
