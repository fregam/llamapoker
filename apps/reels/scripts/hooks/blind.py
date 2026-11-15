"""Steps between the code checks and the read (spec: The test; skill: run order 5-6).

    python blind.py critic-input <topic-dir> <arm>   drafts that passed the code checks, quote ids
                                                     and arm stripped -> <topic-dir>/<arm>/critic-input/drafts.json
    python blind.py best <topic-dir> <arm>           the critic's top 5 -> <topic-dir>/<arm>/best.json
    python blind.py read <test-dir> [--seed 15]      per topic, both arms' best lines shuffled ->
                                                     read.json (lines only) + key.json (which arm)
"""
import json
import random
import sys
from pathlib import Path


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def dump(obj, p: Path):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def critic_input(topic: Path, arm: str):
    run = topic / arm
    checks = load(run / "checks.json")
    keep = [{k: v for k, v in d.items() if k != "quote_ids"} for d in load(run / "drafts.json") if checks.get(d["id"]) == "pass"]
    out = run / "critic-input" / "drafts.json"
    dump(keep, out)
    print(f"{out}: {len(keep)} drafts")


def best(topic: Path, arm: str):
    run = topic / arm
    drafts = {d["id"]: d for d in load(run / "drafts.json")}
    top = [drafts[i] for i in load(run / "critic-input" / "critic.json")["rank"][:5]]
    dump(top, run / "best.json")
    print(f"{run / 'best.json'}: {len(top)} hooks")


def read(test: Path, seed: int):
    rng = random.Random(seed)
    read_out, key = {}, {}
    for topic in sorted(p for p in test.iterdir() if p.is_dir() and not p.name.startswith("_")):
        lines = [(arm, d) for arm in ("research", "control") for d in load(topic / arm / "best.json")]
        rng.shuffle(lines)
        read_out[topic.name] = [{"n": i + 1, "line": d["line"]} for i, (_, d) in enumerate(lines)]
        key[topic.name] = {str(i + 1): {"arm": arm, "id": d["id"]} for i, (arm, d) in enumerate(lines)}
    dump(read_out, test / "read.json")
    dump(key, test / "key.json")
    print(f"{test / 'read.json'}: " + ", ".join(f"{t} {len(v)}" for t, v in read_out.items()))


if __name__ == "__main__":
    cmd, path = sys.argv[1], Path(sys.argv[2])
    if cmd == "critic-input":
        critic_input(path, sys.argv[3])
    elif cmd == "best":
        best(path, sys.argv[3])
    else:
        read(path, int(sys.argv[sys.argv.index("--seed") + 1]) if "--seed" in sys.argv else 15)
