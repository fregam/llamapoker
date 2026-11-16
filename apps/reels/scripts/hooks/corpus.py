"""The hook corpus: Instagram reels with their numbers, from the Graph API's Business Discovery.
Spec: .scratch/hook-dissection/spec.md. Token and ids: credentials.json -> instagram (memory: instagram-api).

    python corpus.py fetch <username>... [--source swipe|poker|explainers|craft|stories]
    python corpus.py sample        marks every real outlier, one ordinary twin each, and funnels apart
    python corpus.py summary

Store: data/corpus.sqlite (git-ignored). An outlier has >= 100k views and >= 5x its account's median
over the account's latest 60 reels. A funnel is a reel whose engagement measures a CTA, not a hook:
a "comment KEYWORD" caption, or comments far above the account's comments-to-likes norm.
"""
import json
import re
import sqlite3
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
DB = HERE / "data" / "corpus.sqlite"
CRED = Path("E:/Projects/poker-trainer/credentials.json")
GRAPH = "https://graph.facebook.com/v27.0/"
MIN_VIEWS, MIN_RATIO, WINDOW = 100_000, 5.0, 60

FUNNEL_CAPTION = re.compile(
    r"(?i:\bcomment)\s+(?:the\s+word\s+)?[\"'“”]?[A-Z]{2,}\b"
    r"|(?i:\b(?:drop|type|write|reply|comment))\s+(?:(?i:the\s+word)\s+)?[\"'“”]?[A-Z]{2,}[\"'“”]?\s+(?i:in|below|and)\b")


def classify(reels: list[dict]) -> list[dict]:
    """Adds median, ratio, outlier, funnel to every reel that has views; drops reels without views."""
    reels = [dict(r) for r in reels if r.get("views") is not None]
    latest = sorted(reels, key=lambda r: r["timestamp"], reverse=True)[:WINDOW]
    if not latest:
        return []
    median = statistics.median(r["views"] for r in latest)
    norm = statistics.median((r["comments"] or 0) / max(r["likes"] or 0, 1) for r in latest)
    for r in reels:
        r["median"] = median
        r["ratio"] = r["views"] / median if median else 0.0
        r["outlier"] = r["views"] >= MIN_VIEWS and r["ratio"] >= MIN_RATIO
        c_ratio = (r["comments"] or 0) / max(r["likes"] or 0, 1)
        r["funnel"] = bool(FUNNEL_CAPTION.search(r.get("caption") or "")) or c_ratio > max(0.2, 5 * norm)
    return reels


def _when(ts: str) -> float:
    return time.mktime(time.strptime(ts[:19], "%Y-%m-%dT%H:%M:%S"))


def sample(reels: list[dict]) -> dict:
    """{shortcode: 'outlier' | 'ordinary' | 'funnel'} for one account's classified reels.
    Each real outlier gets one ordinary twin (0.5x-2x the median), the closest in date; funnel
    outliers are kept apart (their reach came from a CTA) and get no twin."""
    picked = {}
    typical = [r for r in reels if not r["outlier"] and not r["funnel"] and 0.5 <= r["ratio"] <= 2.0]
    for r in sorted((r for r in reels if r["outlier"]), key=lambda r: r["timestamp"]):
        if r["funnel"]:
            picked[r["shortcode"]] = "funnel"
            continue
        picked[r["shortcode"]] = "outlier"
        free = [t for t in typical if t["shortcode"] not in picked]
        if free:
            twin = min(free, key=lambda t: abs(_when(t["timestamp"]) - _when(r["timestamp"])))
            picked[twin["shortcode"]] = "ordinary"
    return picked


# ---------- store ----------

SCHEMA = """
create table if not exists accounts (username text primary key, followers integer, media_count integer,
  reels integer, median real, source text, checked text, note text);
create table if not exists reels (shortcode text primary key, username text, timestamp text, views integer,
  likes integer, comments integer, caption text, permalink text, median real, ratio real,
  outlier integer, funnel integer, sampled text);
"""


def connect() -> sqlite3.Connection:
    DB.parent.mkdir(exist_ok=True)
    con = sqlite3.connect(DB)
    con.executescript(SCHEMA)
    return con


def save(con, username: str, account: dict, reels: list[dict], source: str, note: str = ""):
    con.execute("insert or replace into accounts values (?,?,?,?,?,?,?,?)",
                (username, account.get("followers_count"), account.get("media_count"), len(reels),
                 reels[0]["median"] if reels else None, source, time.strftime("%Y-%m-%d"), note))
    for r in reels:
        con.execute("insert or replace into reels (shortcode, username, timestamp, views, likes, comments, caption,"
                    " permalink, median, ratio, outlier, funnel) values (?,?,?,?,?,?,?,?,?,?,?,?)",
                    (r["shortcode"], username, r["timestamp"], r["views"], r["likes"], r["comments"],
                     r.get("caption"), r.get("permalink"), r["median"], r["ratio"], int(r["outlier"]), int(r["funnel"])))
    con.commit()


# ---------- Graph API ----------

def _creds():
    ig = json.loads(CRED.read_text(encoding="utf-8-sig"))["instagram"]
    return ig["token"], ig["ig_user_id"]


def _call(fields: str):
    tok, me = _creds()
    url = GRAPH + me + "?" + urllib.parse.urlencode({"fields": fields, "access_token": tok})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=60) as resp:
                usage = json.loads(resp.headers.get("X-App-Usage") or "{}")
                if max(usage.values() or [0]) > 80:  # near the hourly cap: slow down
                    time.sleep(120)
                return json.load(resp)
        except urllib.error.HTTPError as e:
            err = json.load(e).get("error", {})
            if err.get("code") in (4, 17, 32, 613):  # rate limited
                time.sleep(300 * (attempt + 1))
                continue
            return {"error": err.get("message", str(e))}
        except (urllib.error.URLError, TimeoutError, ConnectionError):  # network blip: wait and retry
            time.sleep(30 * (attempt + 1))
    return {"error": "rate limited or unreachable four times"}


MEDIA = "media_product_type,timestamp,like_count,comments_count,view_count,permalink,caption"


def fetch_account(username: str, pages: int = 2):
    """Up to `pages` x 50 recent media; returns (account fields, reels) or (None, error)."""
    reels, after, account = [], "", None
    for _ in range(pages):
        page = f".after({after})" if after else ""
        r = _call(f"business_discovery.username({username}){{followers_count,media_count,media.limit(50){page}{{{MEDIA}}}}}")
        if "error" in r:
            return None, r["error"]
        bd = r["business_discovery"]
        account = account or bd
        media = bd.get("media", {})
        for m in media.get("data", []):
            if m.get("media_product_type") != "REELS":
                continue
            code = (m.get("permalink") or "").rstrip("/").split("/")[-1]
            reels.append({"shortcode": code, "views": m.get("view_count"), "likes": m.get("like_count"),
                          "comments": m.get("comments_count"), "caption": m.get("caption"),
                          "timestamp": m["timestamp"], "permalink": m.get("permalink")})
        after = media.get("paging", {}).get("cursors", {}).get("after")
        if not after or not media.get("paging", {}).get("next"):
            break
        time.sleep(2)
    return account, reels


def cmd_fetch(usernames: list[str], source: str):
    con = connect()
    for u in usernames:
        u = u.strip().lstrip("@").lower()
        if not u or con.execute("select 1 from accounts where username = ?", (u,)).fetchone():
            continue  # already checked (delete its row to refetch)
        account, got = fetch_account(u)
        if account is None:
            con.execute("insert or replace into accounts (username, source, checked, note) values (?,?,?,?)",
                        (u, source, time.strftime("%Y-%m-%d"), f"error: {got}"))
            con.commit()
            print(f"{u}: {got}")
            continue
        reels = classify(got)
        save(con, u, account, reels, source)
        out = [r for r in reels if r["outlier"]]
        print(f"{u}: {account.get('followers_count')} followers, {len(reels)} reels, median "
              f"{int(reels[0]['median']) if reels else 0}, outliers {len(out)} ({sum(r['funnel'] for r in out)} funnels)")
        time.sleep(3)


def cmd_sample():
    con = connect()
    con.execute("update reels set sampled = null")
    users = [u for (u,) in con.execute("select distinct username from reels")]
    for u in users:
        rows = con.execute("select shortcode, timestamp, ratio, outlier, funnel from reels where username = ?", (u,)).fetchall()
        reels = [{"shortcode": s, "timestamp": t, "ratio": r, "outlier": bool(o), "funnel": bool(f)} for s, t, r, o, f in rows]
        for code, kind in sample(reels).items():
            con.execute("update reels set sampled = ? where shortcode = ?", (kind, code))
    con.commit()
    print(dict(con.execute("select sampled, count(*) from reels where sampled is not null group by 1").fetchall()))


def cmd_summary():
    con = connect()
    a = con.execute("select count(*), sum(note like 'error%') from accounts").fetchone()
    r = con.execute("select count(*), sum(outlier), sum(outlier and funnel) from reels").fetchone()
    print(f"accounts {a[0]} ({a[1] or 0} errors) | reels {r[0]} | outliers {r[1] or 0} ({r[2] or 0} funnels)")


if __name__ == "__main__":
    if sys.argv[1] == "fetch":
        args = sys.argv[2:]
        src = args[args.index("--source") + 1] if "--source" in args else "swipe"
        names = [a for i, a in enumerate(args) if a != "--source" and (i == 0 or args[i - 1] != "--source")]
        cmd_fetch(names, src)
    elif sys.argv[1] == "sample":
        cmd_sample()
    else:
        cmd_summary()
