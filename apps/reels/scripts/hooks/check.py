"""Code checks for hook drafts (spec checks 1-3, `.scratch/hook-writing/spec.md`).

    python check.py <run-dir>      reads drafts.json + ../facts.json (+ ../evidence.md if quote ids)
                                   writes checks.json, appends failures to failures.md

A failure is {"hook", "check", "reason"}. Checks: numbers, words, length, quotes.

Numbers: digits are stats and must equal a cited fact's value, rounded as written ("85%" for 85.2).
A ratio ("1 in 39", "one in three", "every 39 hands") is checked against a percent fact. Small
counts written as words ("two cards to come") are not stats; writers put stats in digits.
"""
import json
import re
import sys
from pathlib import Path

WORDS = {w: i for i, w in enumerate(
    "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen "
    "sixteen seventeen eighteen nineteen twenty".split())}
N = r"(\d+|" + "|".join(WORDS) + r")"
RATIO = re.compile(rf"\b{N}\s+in\s+{N}\b|\bevery\s+(\d+)\b", re.I)
NUM = re.compile(r"(?<![\w.])(\d+(?:\.\d+)?)\s*(%|percent\b)?")


def _int(w: str) -> int:
    return int(w) if w.isdigit() else WORDS[w.lower()]


def _rounds_to(written: str, value: float) -> bool:
    places = len(written.split(".")[1]) if "." in written else 0
    return round(value, places) == float(written)


def _ratio_fits(n: int, m: int, pct: float) -> bool:
    return pct > 0 and round(pct * m / 100) == n and round(n * 100 / pct) == m


def _fail(hook, check, reason):
    return {"hook": hook["id"], "check": check, "reason": reason}


def check_numbers(hook: dict, facts: dict) -> list[dict]:
    fails = [_fail(hook, "numbers", f"cites {i}, which is not on the fact sheet")
             for i in hook.get("fact_ids", []) if i not in facts]
    cited = [facts[i] for i in hook.get("fact_ids", []) if i in facts]
    pcts = [f["value"] for f in cited if f["unit"] == "%"]
    line = hook["line"]
    for m in RATIO.finditer(line):
        n, d = (1, int(m.group(3))) if m.group(3) else (_int(m.group(1)), _int(m.group(2)))
        if not any(_ratio_fits(n, d, p) for p in pcts):
            fails.append(_fail(hook, "numbers", f"'{m.group(0)}' matches no cited percent"))
    rest = RATIO.sub(" ", line)
    for m in NUM.finditer(rest):
        written, pct = m.group(1), bool(m.group(2))
        if not any(_rounds_to(written, f["value"]) and (f["unit"] == "%") == pct for f in cited):
            fails.append(_fail(hook, "numbers", f"'{m.group(0).strip()}' matches no cited fact"))
    return fails


# brand/README.md: a skill you study, no gambling glamour, never for use during real-money play.
# Luck talk is left to the critic: denying luck ("it's not bad luck") is on-brand.
BANNED = [
    r"crush(ing)? (the|your) (tables?|games?)", r"easy money", r"get rich", r"make money",
    r"win (real )?money", r"cash (out|in)", r"jackpot", r"guaranteed", r"bet big", r"casino",
    r"real[- ]money", r"while you play", r"during (a|the|your) (hand|game|session)", r"in real time",
]
MISSPELT_BRAND = re.compile(r"\b(Llama Poker|Llamapoker|llama poker)\b")  # brand/README.md: LlamaPoker
HANDLE = re.compile(r"\bu/\w+|(?<![\w.])@\w+|\b\S+@\S+\.\w+")
MAX_WORDS, MAX_PROMISE_WORD = 25, 7


def check_words(hook: dict) -> list[dict]:
    line = hook["line"]
    hits = [m.group(0) for p in BANNED for m in [re.search(p, line, re.I)] if m]
    hits += MISSPELT_BRAND.findall(line) + HANDLE.findall(line)
    return [_fail(hook, "words", f"'{h}' is off-brand or a handle") for h in hits[:1]]


def check_length(hook: dict) -> list[dict]:
    n, p = len(hook["line"].split()), hook.get("promise_word") or 99
    reasons = ([f"{n} words, the cap is {MAX_WORDS}"] if n > MAX_WORDS else []) + \
              ([f"the promise lands at word {p}, after word {MAX_PROMISE_WORD}"] if p > MAX_PROMISE_WORD else [])
    return [_fail(hook, "length", "; ".join(reasons))] if reasons else []


def check_quotes(hook: dict, evidence_ids) -> list[dict]:
    missing = [q for q in hook.get("quote_ids") or [] if evidence_ids is None or q not in evidence_ids]
    return [_fail(hook, "quotes", f"cites {', '.join(missing)}, not in the evidence")] if missing else []


def check_hook(hook: dict, facts: dict, evidence_ids=None) -> list[dict]:
    return (check_numbers(hook, facts) + check_words(hook) + check_length(hook)
            + check_quotes(hook, evidence_ids))


def evidence_ids_in(path: Path):
    return set(re.findall(r"\bq-\d+\b", path.read_text(encoding="utf-8"))) if path.exists() else None


def main(run: Path) -> int:
    drafts = json.loads((run / "drafts.json").read_text(encoding="utf-8"))
    facts = {f["id"]: f for f in json.loads((run.parent / "facts.json").read_text(encoding="utf-8"))}
    ev = evidence_ids_in(run.parent / "evidence.md") if run.name == "research" else None
    results, fails = {}, []
    for h in drafts:
        f = check_hook(h, facts, ev)
        results[h["id"]] = "pass" if not f else "fail"
        fails += f
    (run / "checks.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    with open(run / "failures.md", "a", encoding="utf-8") as out:
        for f in fails:
            line = next(h["line"] for h in drafts if h["id"] == f["hook"])
            out.write(f"- **{f['hook']}** · code/{f['check']} · {f['reason']} · \"{line}\"\n")
    passed = sum(v == "pass" for v in results.values())
    print(f"{run}: {passed}/{len(drafts)} pass the code checks; {len(fails)} failures logged")
    return 0


if __name__ == "__main__":
    sys.exit(main(Path(sys.argv[1])))
