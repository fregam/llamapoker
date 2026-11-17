"""Scores a critic run on the calibration drafts against the expectations it never saw.

    python calibrate.py <critic.json>      (expectations: .claude/skills/hook-writing/calibration/expect.json)

Prints every miss; exit 0 only when every line expected to pass passes, every line expected to fail
fails on at least the expected limits, and every rank pair holds. A pair
holds when the upper line is ranked above the lower one, or the lower line failed a limit while the
upper passed. Skill: .claude/skills/hook-writing/SKILL.md (before the first run of a session).
"""
import json
import sys
from pathlib import Path

EXPECT = Path(__file__).parents[4] / ".claude" / "skills" / "hook-writing" / "calibration" / "expect.json"
LIMITS = ("claim", "honest", "helping")


def failed(critic: dict, cid: str) -> set:
    v = critic.get("verdicts", {}).get(cid, {})
    return {k for k in LIMITS if (v.get(k) or ["pass"])[0] == "fail"}


def score(expect: dict, critic: dict) -> list[str]:
    misses = []
    for cid, e in expect["limits"].items():
        if e["fail"] is None:  # an open case: critics split on it for a stated reason, either verdict is fine
            continue
        want, got = set(e["fail"]), failed(critic, cid)
        if (not want and got) or not want <= got:  # a pass must pass; a fail must name every expected limit
            misses.append(f"{cid} limits: expected fail {sorted(want) or 'none'}, got {sorted(got) or 'none'}"
                          f" ({e.get('why', '')})")
    rank = critic.get("rank", [])
    for p in expect["rank_pairs"]:
        a, b = p["above"], p["below"]
        if failed(critic, a):
            misses.append(f"{a} over {b}: {a} failed a limit ({p.get('why', '')})")
        elif failed(critic, b):
            continue
        elif a not in rank or b not in rank or rank.index(a) > rank.index(b):
            misses.append(f"{a} over {b}: ranked the other way ({p.get('why', '')})")
    return misses


if __name__ == "__main__":
    critic = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    misses = score(json.loads(EXPECT.read_text(encoding="utf-8")), critic)
    print("\n".join(misses) or "calibrated: every expectation held")
    sys.exit(1 if misses else 0)
