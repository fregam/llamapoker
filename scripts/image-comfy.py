"""Generate on-brand engraving art locally with FLUX dev in the founder's ComfyUI (free).

    py -3.11 scripts/image-comfy.py <out-dir> <name> "<subject>" [--seeds 1,2] [--w 768] [--h 1344] [--steps 24]

Every prompt starts with the brand's engraving line (brand/README.md, "Making new scenes"), so
the subject is the only thing that changes. Needs the ComfyUI server on 127.0.0.1:8188 and
models/checkpoints/Flux/flux1-dev-fp8.safetensors. Files are written as <name>_s<seed>.png;
list them in a media manifest afterwards. FLUX dev is non-commercial-licensed (fine per our rule).
"""

import argparse
import json
import time
import urllib.request
from pathlib import Path

HOST = "http://127.0.0.1:8188"
BRAND = ("Fine copperplate engraving with delicate cross-hatching, cream ink (#ece7dc) on flat near-black "
         "(#0a0a0b), dark editorial, generous negative space, modern, no paper texture, no frame, no text. ")


def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())


def get(path):
    return urllib.request.urlopen(HOST + path).read()


def graph(prompt, seed, w, h, steps):
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "Flux\\flux1-dev-fp8.safetensors"}},  # ComfyUI on Windows lists subfolders with \
        "2": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["1", 1], "text": prompt}},
        "3": {"class_type": "FluxGuidance", "inputs": {"conditioning": ["2", 0], "guidance": 3.5}},
        "4": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["2", 0]}},
        "5": {"class_type": "EmptySD3LatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "6": {"class_type": "KSampler", "inputs": {"model": ["1", 0], "positive": ["3", 0], "negative": ["4", 0], "latent_image": ["5", 0],
                                                  "seed": seed, "steps": steps, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0}},
        "7": {"class_type": "VAEDecode", "inputs": {"samples": ["6", 0], "vae": ["1", 2]}},
        "8": {"class_type": "SaveImage", "inputs": {"images": ["7", 0], "filename_prefix": "llamapoker"}},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out", type=Path)
    ap.add_argument("name")
    ap.add_argument("subject")
    ap.add_argument("--seeds", default="1,2")
    ap.add_argument("--w", type=int, default=768)
    ap.add_argument("--h", type=int, default=1344)
    ap.add_argument("--steps", type=int, default=24)
    a = ap.parse_args()
    a.out.mkdir(parents=True, exist_ok=True)
    for seed in [int(s) for s in a.seeds.split(",")]:
        pid = post("/prompt", {"prompt": graph(BRAND + a.subject, seed, a.w, a.h, a.steps)})["prompt_id"]
        t0 = time.time()
        while True:
            hist = json.loads(get(f"/history/{pid}"))
            if pid in hist and hist[pid].get("outputs"):
                img = hist[pid]["outputs"]["8"]["images"][0]
                data = get(f"/view?filename={img['filename']}&subfolder={img['subfolder']}&type={img['type']}")
                dest = a.out / f"{a.name}_s{seed}.png"
                dest.write_bytes(data)
                print(f"{dest} ({time.time() - t0:.0f} s)")
                break
            if pid in hist and hist[pid].get("status", {}).get("status_str") == "error":
                raise SystemExit(f"ComfyUI error: {hist[pid]['status']}")
            time.sleep(3)


if __name__ == "__main__":
    main()
