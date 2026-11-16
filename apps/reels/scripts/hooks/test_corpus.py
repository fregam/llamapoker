"""Tests for the hook corpus (spec: .scratch/hook-dissection/spec.md). Run: python -m unittest discover apps/reels/scripts/hooks"""
import unittest

from corpus import classify


def reel(code, views, likes=100, comments=5, caption="", ts="2026-11-01T00:00:00+0000"):
    return {"shortcode": code, "views": views, "likes": likes, "comments": comments, "caption": caption, "timestamp": ts}


def flags(reels):
    return {r["shortcode"]: (r["outlier"], r["funnel"]) for r in classify(reels)}


class Outliers(unittest.TestCase):
    def test_an_outlier_beats_100k_and_five_times_the_median(self):
        reels = [reel(f"o{i}", 40_000) for i in range(9)] + [reel("big", 250_000)]
        self.assertEqual(flags(reels)["big"], (True, False))
        self.assertEqual(flags(reels)["o0"], (False, False))

    def test_five_times_a_small_median_is_not_enough_under_100k(self):
        reels = [reel(f"o{i}", 5_000) for i in range(9)] + [reel("small", 60_000)]
        self.assertFalse(flags(reels)["small"][0])

    def test_100k_on_a_big_account_is_not_an_outlier(self):
        reels = [reel(f"o{i}", 300_000) for i in range(9)] + [reel("ok", 900_000)]
        self.assertFalse(flags(reels)["ok"][0])

    def test_the_median_uses_the_latest_60_reels(self):
        old = [reel(f"old{i}", 10_000_000, ts=f"2020-01-{i % 28 + 1:02d}T00:00:00+0000") for i in range(40)]
        new = [reel(f"new{i}", 30_000, ts=f"2026-10-{i % 28 + 1:02d}T00:00:00+0000") for i in range(60)]
        new.append(reel("hit", 400_000, ts="2026-11-02T00:00:00+0000"))
        self.assertTrue(flags(old + new)["hit"][0])

    def test_reels_without_views_are_left_out(self):
        reels = [reel(f"o{i}", 40_000) for i in range(9)] + [reel("photo", None)]
        self.assertNotIn("photo", flags(reels))


class Funnels(unittest.TestCase):
    def test_a_comment_keyword_caption_is_a_funnel(self):
        for cap in ['Comment IRIS and I\'ll send you the link', 'comment "GUIDE" below', 'Drop the word HOOKS in the comments']:
            reels = [reel(f"o{i}", 40_000) for i in range(9)] + [reel("f", 300_000, caption=cap)]
            self.assertTrue(flags(reels)["f"][1], cap)

    def test_comments_far_above_the_accounts_norm_are_a_funnel(self):
        reels = [reel(f"o{i}", 40_000, likes=1000, comments=20) for i in range(9)] + [reel("f", 300_000, likes=1900, comments=996)]
        self.assertTrue(flags(reels)["f"][1])

    def test_a_normal_question_in_the_caption_is_not_a_funnel(self):
        reels = [reel(f"o{i}", 40_000) for i in range(9)] + [reel("q", 300_000, caption="What would you do? Tell me in the comments")]
        self.assertFalse(flags(reels)["q"][1])


if __name__ == "__main__":
    unittest.main()
