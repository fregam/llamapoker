"""Tests for the blind batches (ticket 04)."""
import unittest
from collections import Counter

from blindset import build


class Blind(unittest.TestCase):
    def setUp(self):
        self.codes = [f"c{i}" for i in range(900)]
        self.plan = build(self.codes)

    def test_the_two_taxonomy_samples_do_not_overlap(self):
        a, b = set(self.plan["taxonomy-a"]), set(self.plan["taxonomy-b"])
        self.assertEqual((len(a), len(b), len(a & b)), (150, 150, 0))

    def test_every_reel_is_tagged_and_a_tenth_twice_in_different_batches(self):
        batches = [v for k, v in self.plan.items() if k.startswith("batch")]
        seen = Counter(c for b in batches for c in b)
        self.assertEqual(set(seen), set(self.codes))
        self.assertEqual(sorted(c for c, n in seen.items() if n == 2), self.plan["_repeats"])
        self.assertEqual(len(self.plan["_repeats"]), 90)
        self.assertTrue(all(len(set(b)) == len(b) for b in batches))
