#!/usr/bin/env python
"""The sound library: Epidemic Sound music and effects, kept in media/library/audio/.

  python scripts/sound-lib.py fetch            read "<es-id> <signed-url>" lines on stdin, download each
                                               (the links die ~3 minutes after the connector issues them)
  python scripts/sound-lib.py build            cut the raw effects into drop-in files, measure everything,
                                               write content/library/audio.json and audio.md
  python scripts/sound-lib.py find <words>     search the library (role, title, tags, mood)
  python scripts/sound-lib.py use <id> [...]   copy sounds into apps/reels/public/ ready for <Sfx>/<Music>
                                               (--seconds N trims a bed or a long effect, --as NAME renames one file);
                                               notes the source of each copy in apps/reels/sound-sources.json
  python scripts/sound-lib.py status           what is listed in the sources but not downloaded yet

Sources (one JSON object per line, written when the catalogue was searched):
  content/library/audio-sources.jsonl   {"id","kind":"sfx|music","role","title","mode"?,"bpm"?,"artist"?,"tags"?}

Files:
  media/library/audio/sfx-raw/<role>/<role>_<slug>_v01.wav    the download, untouched
  media/library/audio/sfx/<role>/<role>_<slug>[-tNN]_v01.wav  the cut: 48 kHz mono 24-bit, peak -6 dBFS,
                                                              hit 20 ms in (the apps/reels sound contract)
  media/library/audio/music/<role>/<role>_<slug>_v01.wav      the full track, untouched (48 kHz stereo)

Effects with mode "whole" (sweeps, risers, ambiences) are trimmed and levelled, never split; ambiences stay
stereo. Everything else is split on silence into its separate takes (-t01, -t02, ...), at most MAX_TAKES.
Needs numpy, scipy, soundfile (the system Python 3.11 has them).
"""
import hashlib, json, re, shutil, subprocess, sys
from fractions import Fraction
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent.parent
LIB = ROOT / "media/library/audio"
SOURCES = ROOT / "content/library/audio-sources.jsonl"
MANIFEST = ROOT / "content/library/audio.json"
CATALOGUE = ROOT / "content/library/audio.md"
PUBLIC = ROOT / "apps/reels/public"
USED = ROOT / "apps/reels/sound-sources.json"  # which library sound each file in public/ came from
SR, PEAK_DB, PRE_MS, MAX_TAKES = 48000, -6.0, 20, 6
STEREO_ROLES_PREFIX = ("ambience",)


def slug(text, limit=56):
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:limit].strip("-")


def sources():
    out, seen = [], set()
    for n, line in enumerate(SOURCES.read_text(encoding="utf8").splitlines(), 1):
        if not line.strip():
            continue
        s = json.loads(line)
        if s["id"] in seen:
            sys.exit(f"audio-sources.jsonl line {n}: duplicate id {s['id']}")
        seen.add(s["id"])
        name = slug(s["title"]) + ("-" + slug(s["artist"], 24) if s.get("artist") else "")
        s["stem"] = f"{s['role']}_{name}"
        folder = "music" if s["kind"] == "music" else "sfx-raw"
        s["raw"] = LIB / folder / s["role"] / f"{s['stem']}_v01.wav"
        out.append(s)
    stems = [s["stem"] for s in out]
    dup = {x for x in stems if stems.count(x) > 1}
    if dup:
        sys.exit(f"two sources share a file name: {sorted(dup)}")
    return out


def db(x):
    return round(float(20 * np.log10(max(x, 1e-9))), 1)


def fetch_one(by_id, line):
    """Download one "<es-id or prefix> <url | short form>" line; return (status, message)."""
    es_id, url = line.split(None, 1)
    if not url.startswith("http"):  # short form: <file-id> <exp> <encoded name between ES_ and .wav> <signature>
        fid, exp, name, sig = url.split()
        url = (f"https://audiocdn.epidemicsound.com/audiofiles/wav/{fid}.wav?exp={exp}.0&key_id=K3IHC07NT7VB9M"
               f"&response-content-disposition=attachment%3B%20filename%3D%22ES_{name}.wav%22&signature={sig}")
    match = [v for k, v in by_id.items() if k.startswith(es_id)]  # a unique id prefix is enough
    s = match[0] if len(match) == 1 else None
    if not s:
        return "bad", f"NOT IN SOURCES {es_id}"
    dest = s["raw"]
    if dest.exists() and dest.stat().st_size > 1000:
        return "skip", ""
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(".part")
    tmp.unlink(missing_ok=True)
    r = subprocess.run(["curl", "-sS", "-f", "--retry", "4", "--retry-all-errors", "-C", "-", "-o", str(tmp), url.strip()],
                       capture_output=True, text=True)
    try:
        if r.returncode != 0:
            raise RuntimeError(r.stderr.strip())
        info = sf.info(str(tmp))
        if info.frames < 100:
            raise RuntimeError("empty audio")
        tmp.replace(dest)
        return "ok", f"ok   {dest.name}  {info.duration:.1f}s {info.samplerate}Hz {info.channels}ch"
    except Exception as e:  # noqa: BLE001
        tmp.unlink(missing_ok=True)
        return "bad", f"FAIL {es_id} {s['title']}: {e}"


def cmd_fetch():
    from concurrent.futures import ThreadPoolExecutor
    by_id = {s["id"]: s for s in sources()}
    lines = [l for l in sys.stdin.read().splitlines() if l.strip()]
    with ThreadPoolExecutor(max_workers=8) as pool:  # all at once: the links die ~3 minutes after issue
        results = list(pool.map(lambda l: fetch_one(by_id, l), lines))
    for _, msg in results:
        if msg:
            print(msg)
    n = lambda k: sum(st == k for st, _ in results)
    print(f"fetched {n('ok')}, already had {n('skip')}, failed {n('bad')}")
    sys.exit(1 if n("bad") else 0)


def to_sr(x, sr):
    if sr == SR:
        return x
    f = Fraction(SR, sr)
    return resample_poly(x, f.numerator, f.denominator, axis=0)


def regions(mono, gap_ms):
    """Active spans (start, end) in samples: 5 ms envelope over a floor 45 dB under the file's peak."""
    win = SR // 200
    n = len(mono) // win
    if n == 0:
        return []
    env = np.abs(mono[: n * win]).reshape(n, win).max(axis=1)
    peak = env.max()
    if peak < 10 ** (-60 / 20):
        return []
    active = env > max(peak * 10 ** (-45 / 20), 10 ** (-66 / 20))
    spans, start = [], None
    for i, a in enumerate(active):
        if a and start is None:
            start = i
        if not a and start is not None:
            spans.append([start, i]); start = None
    if start is not None:
        spans.append([start, n])
    merged = []
    gap = gap_ms // 5
    for s in spans:
        if merged and s[0] - merged[-1][1] < gap:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    keep = []
    for a, b in merged:
        ms, level = (b - a) * 5, env[a:b].max() / peak
        # A take is 25 ms or longer and within 24 dB of the loudest one; a shorter click (a clock tick is
        # 10-15 ms) only counts when it is nearly as loud. The rest is handling noise between takes.
        if (ms >= 25 and level >= 10 ** (-24 / 20)) or (ms >= 10 and level >= 10 ** (-12 / 20)):
            keep.append((a * win, b * win))
    return keep


def shape(x, a, b, tail_ms):
    """Cut [a, b) with a 20 ms lead-in, a short fade at both ends, peak at -6 dBFS."""
    pre = SR * PRE_MS // 1000
    tail = SR * tail_ms // 1000
    seg = x[max(0, a - SR // 500): min(len(x), b + tail)].copy()
    fin = min(SR // 500, len(seg))
    fout = min(SR * 30 // 1000, len(seg))
    ramp_in = np.linspace(0, 1, fin)
    ramp_out = np.linspace(1, 0, fout)
    if seg.ndim == 2:
        ramp_in, ramp_out = ramp_in[:, None], ramp_out[:, None]
    seg[:fin] *= ramp_in
    seg[-fout:] *= ramp_out
    lead = np.zeros((pre - fin,) + seg.shape[1:]) if pre > fin else np.zeros((0,) + seg.shape[1:])
    seg = np.concatenate([lead, seg])
    seg *= 10 ** (PEAK_DB / 20) / max(np.abs(seg).max(), 1e-9)
    return seg


def facts(path):
    x, sr = sf.read(str(path), always_2d=True)
    return {
        "seconds": round(len(x) / sr, 3),
        "sample_rate": sr,
        "channels": x.shape[1],
        "peak_dbfs": db(np.abs(x).max()),
        "rms_dbfs": db(np.sqrt(np.mean(x ** 2))),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "bytes": path.stat().st_size,
    }


def hit_ms(path):
    """When the cut is loudest (5 ms windows), in ms from its start: a slap after a slide, the top of a riser."""
    x, sr = sf.read(str(path), always_2d=True)
    win = sr // 200
    n = len(x) // win
    env = np.abs(x[: n * win]).max(axis=1).reshape(n, win).max(axis=1)
    return int(np.argmax(env)) * 5


def rel(p):
    return p.relative_to(ROOT).as_posix()


def cut_effect(s):
    """Write the cuts for one raw effect; return their paths (existing cuts are kept, never overwritten)."""
    out_dir = LIB / "sfx" / s["role"]
    done = sorted(out_dir.glob(f"{s['stem']}_v01.wav")) + sorted(out_dir.glob(f"{s['stem']}-t[0-9][0-9]_v01.wav"))
    if done:
        return done
    x, sr = sf.read(str(s["raw"]), always_2d=True)
    x = to_sr(x, sr)
    stereo = s["role"].startswith(STEREO_ROLES_PREFIX) and x.shape[1] == 2
    mono = x.mean(axis=1)
    if np.abs(mono).max() < 0.3 * np.abs(x).max():
        mono = x[:, 0].copy()  # the two channels are out of phase and cancel in a mono mix: keep the left one
    body = x if stereo else mono
    whole = s.get("mode") == "whole"
    spans = regions(mono, 400 if whole else 120)
    if not spans:
        return []
    out_dir.mkdir(parents=True, exist_ok=True)
    if whole or len(spans) == 1:
        pieces = [(spans[0][0], spans[-1][1], "")]
    else:
        pieces = [(a, b, f"-t{i:02d}") for i, (a, b) in enumerate(spans[:MAX_TAKES], 1)]
    paths = []
    for a, b, tag in pieces:
        p = out_dir / f"{s['stem']}{tag}_v01.wav"
        sf.write(str(p), shape(body, a, b, 400 if whole else 60), SR, subtype="PCM_24")
        paths.append(p)
    return paths


def cmd_build():
    assets, missing, silent = [], [], []
    for s in sources():
        if not s["raw"].exists():
            missing.append(s); continue
        base = {k: s[k] for k in ("role", "title", "artist", "credit", "bpm", "tags") if s.get(k)}
        base.update(source="epidemic-sound", es_id=s["id"])
        if s["kind"] == "music":
            assets.append({"id": s["stem"], "path": rel(s["raw"]), "kind": "music", **base, **facts(s["raw"])})
            continue
        assets.append({"id": s["stem"] + "_raw", "path": rel(s["raw"]), "kind": "sfx-raw", **base, **facts(s["raw"])})
        cuts = cut_effect(s)
        if not cuts:
            silent.append(s)
        for p in cuts:
            assets.append({"id": p.name.removesuffix("_v01.wav"), "path": rel(p), "kind": "sfx", **base,
                           "derived_from": s["stem"] + "_raw", "hit_ms": hit_ms(p), **facts(p)})
    manifest = {
        "$comment": "Sound library (Epidemic Sound). One entry per file in media/library/audio/. Written by "
                    "`python scripts/sound-lib.py build` from content/library/audio-sources.jsonl; verify with "
                    "`node scripts/media-manifest.mjs --check content/library/audio.json`. kind: music = full track "
                    "as downloaded; sfx = drop-in cut (48 kHz mono, peak -6 dBFS, hit 20 ms in); sfx-raw = the "
                    "download it was cut from; hit_ms = when a cut is loudest, so `delay = -round(hit_ms * fps / 1000)` lands "
                    "that moment on the cue. Re-download any file by its es_id through the Epidemic Sound connector.",
        "scope": "media/library/audio",
        "assets": assets,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=1) + "\n", encoding="utf8")
    write_catalogue(assets)
    n = lambda k: sum(a["kind"] == k for a in assets)
    print(f"{n('music')} tracks, {n('sfx')} effect cuts from {n('sfx-raw')} downloads -> {rel(MANIFEST)}")
    if silent:
        print("NO SOUND FOUND IN:", *[x["stem"] for x in silent], sep="\n  ")
    if missing:
        print(f"{len(missing)} sources not downloaded yet (run status)")


def write_catalogue(assets):
    lines = [
        "# Sound library catalogue",
        "",
        "Generated by `python scripts/sound-lib.py build`; do not edit by hand. Pick by **role**, then pull the",
        "file into the reel with `python scripts/sound-lib.py use <id>`. Source: Epidemic Sound.",
        "",
        "Effects are 48 kHz mono, peak -6 dBFS, 20 ms of lead-in (ambiences stay stereo). `-tNN` = one take cut",
        "out of a recording with several. *Loudest at* is where the slap, hit or top of a riser sits: start the",
        "sound that much early (`delay = -round(ms * fps / 1000)`) when that moment has to land on the cue.",
        "Music is the full track as downloaded; `use` writes a bed at -20 dBFS RMS. Tracks tagged",
        "*vocal presence* carry vocal chops: keep them for stretches without narration.",
        "",
    ]
    for kind, head in (("music", "Music"), ("sfx", "Effects")):
        lines += [f"## {head}", ""]
        roles = {}
        for a in assets:
            if a["kind"] == kind:
                roles.setdefault(a["role"], []).append(a)
        for role in sorted(roles):
            lines += [f"### {role}", ""]
            if kind == "music":
                lines += ["| id | title | artist | bpm | length | tags |", "|---|---|---|---|---|---|"]
                for a in roles[role]:
                    m, sec = divmod(int(a["seconds"]), 60)
                    lines.append(f"| `{a['id']}` | {a['title']} | {a.get('artist', '')} | {a.get('bpm', '')} | {m}:{sec:02d} | {', '.join(a.get('tags', []))} |")
            else:
                lines += ["| id | from | length | loudest at |", "|---|---|---|---|"]
                for a in roles[role]:
                    lines.append(f"| `{a['id']}` | {a['title']} | {a['seconds']:.2f} s | {a['hit_ms']} ms |")
            lines.append("")
    CATALOGUE.write_text("\n".join(lines), encoding="utf8")


def load_assets():
    return [a for a in json.loads(MANIFEST.read_text(encoding="utf8"))["assets"] if a["kind"] != "sfx-raw"]


def cmd_find(words):
    words = [w.lower() for w in words]
    hits = []
    for a in load_assets():
        hay = " ".join([a["id"], a["role"], a["title"], a.get("artist", ""), " ".join(a.get("tags", []))]).lower()
        if all(w in hay for w in words):
            hits.append(a)
    for a in hits:
        extra = (f"{a.get('bpm', '')} bpm  {', '.join(a.get('tags', []))}" if a["kind"] == "music"
                 else f"{a['title']}; loudest at {a['hit_ms']} ms")
        print(f"{a['kind']:5} {a['seconds']:7.2f}s  {a['id']}   [{extra}]")
    print(f"{len(hits)} found")


def cmd_use(args):
    seconds = name = None
    ids = []
    it = iter(args)
    for a in it:
        if a == "--seconds":
            seconds = float(next(it))
        elif a == "--as":
            name = next(it)
        else:
            ids.append(a)
    by_id = {a["id"]: a for a in load_assets()}
    if name and len(ids) != 1:
        sys.exit("--as names one file: pass exactly one id")
    for i in ids:
        a = by_id.get(i)
        if not a:
            sys.exit(f"no such sound: {i} (try: find <words>)")
        src = ROOT / a["path"]
        if not src.exists():
            sys.exit(f"file missing: {a['path']} (re-download es_id {a['es_id']})")
        if a["kind"] == "sfx":
            dest = PUBLIC / "sfx" / f"{name or i}.wav"
            if dest.exists():
                sys.exit(f"{rel(dest)} exists; choose another name with --as")
            dest.parent.mkdir(parents=True, exist_ok=True)
            if seconds and seconds < a["seconds"]:
                x, sr = sf.read(str(src), always_2d=True)
                x = x[: int(seconds * sr)].copy()
                fade = min(sr // 2, len(x))
                x[-fade:] *= np.linspace(1, 0, fade)[:, None]
                sf.write(str(dest), x, sr, subtype="PCM_24")
            else:
                shutil.copyfile(src, dest)
            if a["hit_ms"] > 40:
                print(f"  loudest at {a['hit_ms']} ms: delay={{{-round(a['hit_ms'] * 30 / 1000)}}} lands it on the cue at 30 fps")
        else:
            # A bed for <Music>: -20 dBFS RMS (what sound.tsx's levels assume), mp3 so git stays small.
            dest = PUBLIC / "music" / f"{name or i}.mp3"
            if dest.exists():
                sys.exit(f"{rel(dest)} exists; choose another name with --as")
            x, sr = sf.read(str(src), always_2d=True)
            if seconds:
                x = x[: int(seconds * sr)].copy()
                fade = min(sr * 2, len(x))
                x[-fade:] *= np.linspace(1, 0, fade)[:, None]
            rms, peak = max(np.sqrt(np.mean(x ** 2)), 1e-9), max(np.abs(x).max(), 1e-9)
            gain = min(10 ** (-20 / 20) / rms, 10 ** (-1 / 20) / peak)  # never push a peak past -1 dBFS
            x *= gain
            sf.write(str(dest), x, sr, format="MP3")
            got = db(rms * gain)
            if got < -20.5:
                print(f"  a dynamic track: bed is at {got} dBFS RMS, not -20 (peaks kept clean); raise <Music> by {round(-20 - got, 1)} dB if needed")
        used = json.loads(USED.read_text(encoding="utf8")) if USED.exists() else {}
        used[dest.relative_to(PUBLIC).as_posix()] = {"id": a["id"], "es_id": a["es_id"], "title": a["title"],
                                                     **({"artist": a["artist"]} if a.get("artist") else {})}
        USED.write_text(json.dumps(dict(sorted(used.items())), indent=1) + chr(10), encoding="utf8")
        print(f'{rel(dest)}   ->  src="{dest.relative_to(PUBLIC).as_posix()}"')


def cmd_status():
    todo = [s for s in sources() if not s["raw"].exists()]
    for s in todo:
        print(f"{s['kind']} {s['id']} {s['stem']}")
    print(f"{len(todo)} of {len(sources())} sources not downloaded")


if __name__ == "__main__":
    cmd, rest = (sys.argv[1] if len(sys.argv) > 1 else ""), sys.argv[2:]
    if cmd == "fetch": cmd_fetch()
    elif cmd == "build": cmd_build()
    elif cmd == "find": cmd_find(rest)
    elif cmd == "use": cmd_use(rest)
    elif cmd == "status": cmd_status()
    else: sys.exit(__doc__)
