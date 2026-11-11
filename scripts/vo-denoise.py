"""Clean a reel's voice-over takes: spectral gating against the model's own noise floor.

    <comfyui-venv>/python.exe scripts/vo-denoise.py <reel-id>            cleans public/vo/<id>/<take>.wav in place
    <comfyui-venv>/python.exe scripts/vo-denoise.py --file in.wav out.wav [--gaps s1-e1,s2-e2]

VibeVoice output carries a faint stationary hiss and room tone. The noise profile is learned from
the take itself, from the moments between words (the word times in src/vo/<id>.words.json), so
nothing is guessed. Then, per STFT bin, anything within `floor_db` of the noise profile is
attenuated (soft gate), a 70 Hz high-pass removes rumble, and the gaps between phrases are eased
down by `gap_db` with 40 ms ramps so the floor drops without the breaths sounding chopped. Prints
the signal-to-noise ratio before and after. Dependencies: numpy, scipy, soundfile (ComfyUI venv).
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import stft, istft, butter, sosfiltfilt

ROOT = Path(__file__).resolve().parent.parent
N_FFT = 2048
HOP = 512
FLOOR_DB = 6.0  # bins within this many dB above the noise profile are gated
GATE_DB = -24.0  # how far a gated bin is pulled down
GAP_DB = -14.0  # extra attenuation of the silences between phrases
HP_HZ = 70.0


def db(x: float) -> float:
    return 20 * np.log10(max(x, 1e-9))


def gap_mask(n: int, sr: int, words: list[dict], pad: float = 0.12) -> np.ndarray:
    """True where nobody is speaking (outside every word, with `pad` seconds of grace)."""
    m = np.ones(n, dtype=bool)
    for w in words:
        a, b = max(0, int((w["s"] - pad) * sr)), min(n, int((w["e"] + pad) * sr))
        m[a:b] = False
    return m


def denoise(x: np.ndarray, sr: int, words: list[dict]) -> tuple[np.ndarray, float, float]:
    silence = gap_mask(len(x), sr, words)
    if silence.sum() < sr * 0.3:  # not enough silence to learn from: use the quietest 10% frames
        silence = None
    sos = butter(2, HP_HZ, "highpass", fs=sr, output="sos")
    x = sosfiltfilt(sos, x)
    f, t, Z = stft(x, sr, nperseg=N_FFT, noverlap=N_FFT - HOP, padded=True)
    mag = np.abs(Z)
    frame_centres = (t * sr).astype(int).clip(0, len(x) - 1)
    if silence is not None:
        noise_frames = silence[frame_centres]
    else:
        energy = mag.mean(0)
        noise_frames = energy <= np.percentile(energy, 10)
    profile = np.median(mag[:, noise_frames], axis=1, keepdims=True) + 1e-9
    ratio_db = 20 * np.log10(mag / profile + 1e-9)
    # Soft gate: full gain above profile + FLOOR_DB, GATE_DB at the profile, smooth in between.
    gain_db = np.clip((ratio_db - 0) / FLOOR_DB, 0, 1) * (0 - GATE_DB) + GATE_DB
    gain = 10 ** (gain_db / 20)
    # Smooth the gain over time (3 frames) so it doesn't flutter.
    k = np.array([0.25, 0.5, 0.25])
    gain = np.apply_along_axis(lambda g: np.convolve(g, k, mode="same"), 1, gain)
    _, y = istft(Z * gain, sr, nperseg=N_FFT, noverlap=N_FFT - HOP)
    y = y[: len(x)]
    # Ease the gaps between phrases down by GAP_DB with 40 ms ramps.
    if silence is not None:
        env = silence.astype(np.float32)
        ramp = int(0.04 * sr)
        kern = np.ones(ramp) / ramp
        env = np.convolve(env, kern, mode="same")
        y = y * (10 ** (GAP_DB / 20) ** env)
    # Noise floor vs speech level, before and after.
    speech = ~silence if silence is not None else np.ones(len(x), bool)
    snr_before = db(np.sqrt(np.mean(x[speech] ** 2))) - db(np.sqrt(np.mean(x[~speech] ** 2))) if silence is not None else float("nan")
    snr_after = db(np.sqrt(np.mean(y[speech] ** 2))) - db(np.sqrt(np.mean(y[~speech] ** 2))) if silence is not None else float("nan")
    return y.astype(np.float32), snr_before, snr_after


def load(path: Path) -> tuple[np.ndarray, int]:
    x, sr = sf.read(str(path), dtype="float32", always_2d=True)
    return x.mean(1), sr


def main(argv: list[str]) -> None:
    if argv[:1] == ["--file"]:
        src, dst = Path(argv[1]), Path(argv[2])
        words = []
        if "--gaps" in argv:
            # gaps given explicitly: treat everything else as speech
            spans = [tuple(map(float, g.split("-"))) for g in argv[argv.index("--gaps") + 1].split(",")]
            x, sr = load(src)
            t_prev = 0.0
            for a, b in spans:
                words.append({"s": t_prev, "e": a})
                t_prev = b
            words.append({"s": t_prev, "e": len(x) / sr})
        x, sr = load(src)
        y, b, a = denoise(x, sr, words)
        sf.write(str(dst), y, sr, subtype="PCM_16")
        print(f"{src.name}: SNR {b:.1f} dB -> {a:.1f} dB")
        return
    rid = argv[0]
    vo_dir = ROOT / "apps/reels/public/vo" / rid
    words_all = json.loads((ROOT / "apps/reels/src/vo" / f"{rid}.words.json").read_text(encoding="utf-8"))
    for name, words in words_all.items():
        path = vo_dir / f"{name}.wav"
        x, sr = load(path)
        y, b, a = denoise(x, sr, words)
        sf.write(str(path), y, sr, subtype="PCM_16")
        print(f"{name:8s} SNR {b:5.1f} dB -> {a:5.1f} dB")


if __name__ == "__main__":
    main(sys.argv[1:])
