"""Provisional sound effects, synthesised (numpy + scipy), so the sound layer can be built and
rendered before the generated set exists. Same file names as the generated set, so swapping is a
file copy: tick, pluck, fold, deal, chip, whoosh, stamp, reveal -> apps/reels/public/sfx/<name>.wav
(48 kHz mono, peak -6 dBFS; the mix gain lives in the reel's <Sfx gain>).

    <comfyui-venv>/python.exe scripts/sfx-synth.py

Also writes a 60 s ambient bed to apps/reels/public/music/bed.wav (looped by <Music>): two slow
detuned low drones, a filtered-noise air layer and a soft pulse at 72 bpm, in the key of D minor,
quiet and without melody so the voice owns the foreground.
"""
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
OUT = ROOT / "apps/reels/public/sfx"
MUSIC = ROOT / "apps/reels/public/music"
rng = np.random.default_rng(7)


def t(seconds: float) -> np.ndarray:
    return np.arange(int(SR * seconds)) / SR


def env(n: int, attack: float, decay: float, curve: float = 3.0) -> np.ndarray:
    a = int(SR * attack)
    e = np.ones(n)
    if a > 0:
        e[:a] = np.linspace(0, 1, a)
    d = np.exp(-np.arange(n - a) / (SR * decay) * curve)
    e[a:] = d[: n - a]
    return e


def bp(x: np.ndarray, lo: float, hi: float, order: int = 4) -> np.ndarray:
    sos = butter(order, [lo, hi], "bandpass", fs=SR, output="sos")
    return sosfilt(sos, x)


def lp(x: np.ndarray, hz: float, order: int = 4) -> np.ndarray:
    return sosfilt(butter(order, hz, "lowpass", fs=SR, output="sos"), x)


def hp(x: np.ndarray, hz: float, order: int = 2) -> np.ndarray:
    return sosfilt(butter(order, hz, "highpass", fs=SR, output="sos"), x)


def norm(x: np.ndarray, peak_db: float = -6.0) -> np.ndarray:
    x = x - x.mean()
    return (x / (np.abs(x).max() + 1e-9)) * 10 ** (peak_db / 20)


def noise(n: int) -> np.ndarray:
    return rng.standard_normal(n)


def tick() -> np.ndarray:
    """A short, dry UI tick: a 2.4 kHz blip plus a click."""
    tt = t(0.06)
    blip = np.sin(2 * np.pi * 2400 * tt) * env(len(tt), 0.0005, 0.012)
    click = bp(noise(len(tt)), 2000, 9000) * env(len(tt), 0.0002, 0.004)
    return norm(blip * 0.8 + click * 0.5)


def pluck() -> np.ndarray:
    """A soft plucked note (Karplus-Strong-ish): a cell lighting up."""
    tt = t(0.35)
    f = 440.0
    x = np.sin(2 * np.pi * f * tt) * 0.6 + np.sin(2 * np.pi * f * 2 * tt) * 0.25 + np.sin(2 * np.pi * f * 3 * tt) * 0.1
    x *= env(len(tt), 0.002, 0.09)
    x += bp(noise(len(tt)), 1500, 6000) * env(len(tt), 0.0005, 0.006) * 0.3
    return norm(lp(x, 6000))


def fold() -> np.ndarray:
    """Cards pushed away on felt: a soft, dull thud with a short paper slide."""
    tt = t(0.3)
    thud = lp(noise(len(tt)), 220) * env(len(tt), 0.003, 0.05)
    slide = bp(noise(len(tt)), 600, 2500) * env(len(tt), 0.02, 0.07) * 0.5
    return norm(thud + slide)


def deal() -> np.ndarray:
    """A card dealt: a quick air swish and a snap when it lands."""
    tt = t(0.25)
    swish = bp(noise(len(tt)), 900, 5000) * env(len(tt), 0.03, 0.05) * 0.6
    snap = bp(noise(len(tt)), 1500, 8000) * np.roll(env(len(tt), 0.0005, 0.008), int(0.06 * SR)) * 0.9
    return norm(swish + snap)


def chip() -> np.ndarray:
    """Two chips clicking together: bright inharmonic partials with a fast decay."""
    tt = t(0.22)
    partials = [(2600, 1.0), (3900, 0.6), (5200, 0.35), (7100, 0.2)]
    x = sum(a * np.sin(2 * np.pi * f * tt + rng.uniform(0, 6.28)) for f, a in partials)
    x *= env(len(tt), 0.0005, 0.03)
    x += bp(noise(len(tt)), 3000, 9000) * env(len(tt), 0.0003, 0.004) * 0.8
    second = np.roll(x, int(0.045 * SR)) * 0.6
    return norm(x + second)


def whoosh() -> np.ndarray:
    """A scene change: filtered noise sweeping up then settling."""
    n = int(SR * 0.5)
    x = noise(n)
    sweep = np.linspace(400, 2400, n)
    # time-varying bandpass by blending two bands
    lo_band = bp(x, 300, 900)
    hi_band = bp(x, 1200, 3200)
    w = (sweep - 400) / 2000
    y = lo_band * (1 - w) + hi_band * w
    y *= env(n, 0.12, 0.14, curve=2.5)
    return norm(y)


def stamp() -> np.ndarray:
    """A number landing: a low thump with a tight click, like a stamp on paper."""
    tt = t(0.35)
    thump = np.sin(2 * np.pi * (90 * np.exp(-tt * 14) + 45) * tt) * env(len(tt), 0.001, 0.06)
    click = bp(noise(len(tt)), 1200, 6000) * env(len(tt), 0.0003, 0.006) * 0.8
    body = lp(noise(len(tt)), 300) * env(len(tt), 0.002, 0.03) * 0.5
    return norm(thump + click + body)


def reveal() -> np.ndarray:
    """A soft reveal: a two-note bell, D5 then A5, quiet and short."""
    tt = t(0.9)

    def bell(f: float, start: float, amp: float) -> np.ndarray:
        x = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.76 * tt) + 0.15 * np.sin(2 * np.pi * f * 5.4 * tt))
        e = np.roll(env(len(tt), 0.003, 0.22), int(start * SR))
        e[: int(start * SR)] = 0
        return x * e * amp

    x = bell(587.33, 0.0, 1.0) + bell(880.0, 0.09, 0.8)
    return norm(lp(x, 9000))


def bed(seconds: float = 60.0) -> np.ndarray:
    """Ambient bed in D minor at 72 bpm: drones, air, a soft pulse. Loop-safe (fades at both ends)."""
    n = int(SR * seconds)
    tt = np.arange(n) / SR
    d2, a2, f3 = 73.42, 110.0, 174.61
    drone = (
        np.sin(2 * np.pi * d2 * tt) * 0.5
        + np.sin(2 * np.pi * d2 * 1.003 * tt) * 0.5
        + np.sin(2 * np.pi * a2 * tt) * 0.3
        + np.sin(2 * np.pi * a2 * 0.997 * tt) * 0.3
        + np.sin(2 * np.pi * f3 * tt) * 0.12
    )
    slow = 0.75 + 0.25 * np.sin(2 * np.pi * tt / 23.0)
    drone = lp(drone * slow, 400)
    air = bp(noise(n), 800, 4000) * (0.18 + 0.08 * np.sin(2 * np.pi * tt / 11.0)) * 0.06
    # soft pulse every beat at 72 bpm, every other beat quieter
    beat = 60 / 72
    pulse = np.zeros(n)
    k = int(SR * 0.4)
    pt = np.arange(k) / SR
    kick = np.sin(2 * np.pi * (70 * np.exp(-pt * 10) + 38) * pt) * env(k, 0.002, 0.12)
    i = 0
    b = 0
    while i + k < n:
        pulse[i : i + k] += kick * (0.5 if b % 2 == 0 else 0.3)
        i += int(beat * SR)
        b += 1
    x = drone * 0.8 + air + pulse * 0.6
    fade = int(SR * 0.25)  # short: the bed is looped, a long fade reads as a drop-out
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    x = hp(x, 30)
    # Level by RMS (-20 dBFS), not peak: a bed's job is a steady floor under the voice.
    x = x / (np.sqrt(np.mean(x**2)) + 1e-9) * 10 ** (-20 / 20)
    return np.clip(x, -0.98, 0.98)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    MUSIC.mkdir(parents=True, exist_ok=True)
    for name, fn in [("tick", tick), ("pluck", pluck), ("fold", fold), ("deal", deal), ("chip", chip), ("whoosh", whoosh), ("stamp", stamp), ("reveal", reveal)]:
        x = fn()
        sf.write(str(OUT / f"{name}.wav"), x.astype(np.float32), SR, subtype="PCM_16")
        print(f"{name:7s} {len(x) / SR:.2f} s")
    y = bed()
    sf.write(str(MUSIC / "bed.wav"), y.astype(np.float32), SR, subtype="PCM_16")
    print(f"bed     {len(y) / SR:.0f} s")
