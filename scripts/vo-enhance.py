"""Clean a reel's voice-over takes with DeepFilterNet 3 (a real speech denoiser, CPU, MIT).

    C:/Users/matia/AppData/Local/Programs/Python/Python311/python.exe scripts/vo-enhance.py <reel-id>
    ...python.exe scripts/vo-enhance.py --file in.wav out.wav

Runs on public/vo/<id>/<take>.wav in place (the originals are kept as <take>.raw.wav the first
time, so it can be re-run). DeepFilterNet works at 48 kHz, which is what the takes are. After it,
the take is re-levelled to -16 LUFS with Remotion's ffmpeg so the mix stays where it was. Needs
the DeepFilterNet install on the system Python 3.11 (`pip install deepfilternet torch==2.8.0
torchaudio==2.8.0`); if that import fails, falls back to scripts/vo-denoise.py (spectral gate).
Word times do not move: the filter is zero-latency at the file level.
"""
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = ROOT / "apps/reels/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe"


def level(path: Path) -> None:
    tmp = path.with_suffix(".lvl.wav")
    subprocess.run([str(FFMPEG), "-y", "-loglevel", "error", "-i", str(path), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(tmp)], check=True)
    tmp.replace(path)


def enhance_files(pairs: list[tuple[Path, Path]]) -> None:
    try:
        import torch
        from df.enhance import enhance, init_df, load_audio, save_audio
    except Exception as e:  # noqa: BLE001
        print(f"DeepFilterNet unavailable ({e.__class__.__name__}: {e}); falling back to the spectral gate")
        for src, dst in pairs:
            subprocess.run([sys.executable, str(ROOT / "scripts/vo-denoise.py"), "--file", str(src), str(dst)], check=True)
        return
    torch.set_num_threads(max(1, (torch.get_num_threads() or 4) // 2))
    model, df_state, _ = init_df()
    for src, dst in pairs:
        audio, _ = load_audio(str(src), sr=df_state.sr())
        out = enhance(model, df_state, audio)
        save_audio(str(dst), out, df_state.sr())
        print(f"{src.name}: enhanced")


def main(argv: list[str]) -> None:
    if argv[:1] == ["--file"]:
        src, dst = Path(argv[1]), Path(argv[2])
        enhance_files([(src, dst)])
        level(dst)
        return
    rid = argv[0]
    vo_dir = ROOT / "apps/reels/public/vo" / rid
    pairs = []
    for take in sorted(vo_dir.glob("*.wav")):
        if take.name.startswith("_") or take.name.endswith(".raw.wav"):
            continue
        raw = take.with_name(take.stem + ".raw.wav")
        if not raw.exists():
            shutil.copy2(take, raw)
        pairs.append((raw, take))
    enhance_files(pairs)
    for _, take in pairs:
        level(take)
    print(f"{rid}: {len(pairs)} takes cleaned and levelled")


if __name__ == "__main__":
    main(sys.argv[1:])
