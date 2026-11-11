"""Objective voice measurements for a voice board (numpy only).

    python scripts/voice_measure.py <dir-of-wavs> <words-in-the-test-paragraph>

Per file: speech seconds (minus silences), words/sec, pause share, median F0 (pitch),
F0 spread (expressiveness: interquartile range), RMS dynamics. Run it with a Python that has
numpy (the local ComfyUI venv works). A calm narrator: F0 median ~100-140 Hz, IQR under ~45,
2.2-2.6 words/s. Voices are chosen by these numbers, never by their catalogue name."""
import sys, wave, glob, os
import numpy as np

WORDS = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 32  # words in the test paragraph

def load(path):
    with wave.open(path, "rb") as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return sr, x

def f0_autocorr(frame, sr, fmin=70, fmax=350):
    frame = frame - frame.mean()
    if np.abs(frame).max() < 1e-3:
        return 0.0
    frame = frame * np.hanning(len(frame))
    ac = np.correlate(frame, frame, "full")[len(frame) - 1 :]
    ac /= ac[0] + 1e-9
    lo, hi = int(sr / fmax), int(sr / fmin)
    seg = ac[lo:hi]
    i = int(np.argmax(seg))
    if seg[i] < 0.5:
        return 0.0
    return sr / (lo + i)

def analyse(path, words=None):
    words = words or WORDS
    sr, x = load(path)
    win, hop = int(0.04 * sr), int(0.01 * sr)
    n = (len(x) - win) // hop
    rms = np.array([np.sqrt(np.mean(x[i * hop : i * hop + win] ** 2)) for i in range(n)])
    thr = max(rms.max() * 0.08, 0.004)
    voiced = rms > thr
    # trim leading/trailing silence
    idx = np.where(voiced)[0]
    total = (idx[-1] - idx[0]) * hop / sr if len(idx) else 0
    speech = voiced[idx[0] : idx[-1] + 1].mean() if len(idx) else 0
    f0s = [f0_autocorr(x[i * hop : i * hop + win], sr) for i in range(n) if voiced[i]]
    f0s = np.array([f for f in f0s if f > 0])
    return {
        "file": os.path.basename(path),
        "sec": round(total, 2),
        "wps": round(words / total, 2) if total else 0,
        "pause%": round((1 - speech) * 100),
        "f0_med": round(float(np.median(f0s))) if len(f0s) else 0,
        "f0_iqr": round(float(np.percentile(f0s, 75) - np.percentile(f0s, 25))) if len(f0s) else 0,
        "dyn_dB": round(float(20 * np.log10(np.percentile(rms[voiced], 90) / (np.percentile(rms[voiced], 10) + 1e-9))), 1),
    }

if __name__ == "__main__":
    rows = [analyse(p) for p in sorted(glob.glob(os.path.join(sys.argv[1], "*.wav")))]
    keys = list(rows[0].keys())
    print("\t".join(keys))
    for r in rows:
        print("\t".join(str(r[k]) for k in keys))
