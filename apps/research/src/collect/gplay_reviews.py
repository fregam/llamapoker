"""Google Play reviews via google-play-scraper: sort NEWEST, last 12 months, per lang/country.

Usage: py -3.11 -I src/collect/gplay_reviews.py <source-slug> <package-id> [lang/cc,lang/cc,...]
Output: data/raw/<source-slug>.jsonl. Re-runnable: skips review ids already in the file and
lang/country pairs already finished (data/raw/<source-slug>.state.json).
"""
import hashlib
import json
import sys
import time
from datetime import datetime
from pathlib import Path

from google_play_scraper import Sort, reviews

DEFAULT = "en/us,en/gb,en/in,en/ph,pt/br,es/mx,es/es,de/de,fr/fr,ru/ru,ko/kr,th/th,vi/vn,id/id,tr/tr,it/it"
SINCE = datetime(2025, 11, 15)
CAP = 5000  # reviews inside the window per app per language/country
PAGE = 200

slug, pkg = sys.argv[1], sys.argv[2]
pairs = [p.split("/") for p in (sys.argv[3] if len(sys.argv) > 3 else DEFAULT).split(",")]
root = Path(__file__).resolve().parents[2]
out = root / "data" / "raw" / f"{slug}.jsonl"
state_path = root / "data" / "raw" / f"{slug}.state.json"
out.parent.mkdir(parents=True, exist_ok=True)

seen = set()
if out.exists():
    for line in out.read_text(encoding="utf-8").splitlines():
        if line:
            seen.add(json.loads(line)["id"])
state = json.loads(state_path.read_text()) if state_path.exists() else {"done": []}


def key(name):
    return hashlib.sha1(str(name or "").encode("utf-8")).hexdigest()[:12]


total_new = 0
with out.open("a", encoding="utf-8") as f:
    for lang, cc in pairs:
        tag = f"{lang}/{cc}"
        if tag in state["done"]:
            print(f"{slug} {tag}: already done", flush=True)
            continue
        token, in_window, new, stop, failed = None, 0, 0, False, False
        while not stop:
            for attempt in range(5):
                try:
                    batch, token = reviews(pkg, lang=lang, country=cc, sort=Sort.NEWEST,
                                           count=PAGE, continuation_token=token)
                    break
                except Exception as e:  # network / throttling: back off
                    print(f"  retry {attempt + 1}: {e}", flush=True)
                    time.sleep(20 * (attempt + 1))
            else:
                print(f"{slug} {tag}: gave up after retries", flush=True)
                failed = True
                break
            time.sleep(1.5)
            if not batch:
                break
            for r in batch:
                at = r.get("at")
                if at is None or at < SINCE:
                    stop = True
                    continue
                in_window += 1
                rid = r["reviewId"]
                if rid in seen:
                    continue
                seen.add(rid)
                item = {
                    "id": rid, "source": slug, "platform": "gplay", "kind": "review",
                    "thread_url": f"https://play.google.com/store/apps/details?id={pkg}&hl={lang}&gl={cc}",
                    "parent_id": None, "title": None, "text": r.get("content") or "",
                    "lang": None, "created": at.strftime("%Y-%m-%d"),
                    "likes": int(r.get("thumbsUpCount") or 0),
                    "replies": 1 if r.get("replyContent") else 0,
                    "rating": r.get("score"), "author_key": key(r.get("userName")),
                    "query_lang": lang, "country": cc, "app_version": r.get("reviewCreatedVersion"),
                }
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
                new += 1
            f.flush()
            if in_window >= CAP:
                print(f"  capped at {CAP}", flush=True)
                stop = True
            if token is None or getattr(token, "token", None) is None:
                break
        total_new += new
        print(f"{slug} {tag}: {in_window} in window, +{new} new", flush=True)
        if failed:
            continue
        state["done"].append(tag)
        state_path.write_text(json.dumps(state))

print(f"{slug}: +{total_new} new, {len(seen)} total", flush=True)
