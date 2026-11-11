#!/usr/bin/env node
// Generate a music bed with ACE-Step 1.5 Turbo in the local ComfyUI (free), for apps/reels.
//
//   node scripts/music-comfy.mjs --out apps/reels/public/music/bed.wav --seconds 120 [--seed N]
//        [--tags "..."] [--batch 4]
//
// Instrumental only: the lyrics field carries "[inst]" so no voice is generated. The result is
// mono 48 kHz, levelled to -18 LUFS (the reel's <Music> ducks it further). With --batch N the
// candidates land next to --out as <name>-<seed>.wav for a listening board, nothing is chosen.
// Needs ComfyUI with the ACE-Step 1.5 nodes (core >= Feb 2026) and the split files in
// models/diffusion_models/acestep_v1.5_turbo.safetensors, models/text_encoders/qwen_0.6b_ace15.safetensors
// + qwen_1.7b_ace15.safetensors, models/vae/ace_1.5_vae.safetensors.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ffmpeg = resolve(root, "apps/reels/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe");
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const server = opt("server", "http://127.0.0.1:8188");
const out = resolve(opt("out", "apps/reels/public/music/bed.wav"));
const seconds = +opt("seconds", 120);
const batch = +opt("batch", 1);
const seed0 = +opt("seed", 11);
const tags = opt(
  "tags",
  // The brand bed: dark, warm, slow, no melody to fight the voice, something moving every bar.
  "ambient, cinematic, minimal, dark, warm analog pads, sub bass drone, soft felt piano, sparse, slow, 72 bpm, D minor, late night, tension, no vocals, instrumental, lo-fi texture, subtle pulse",
);

function workflow(seed) {
  return {
    unet: { class_type: "UNETLoader", inputs: { unet_name: "acestep_v1.5_turbo.safetensors", weight_dtype: "default" } },
    clip: { class_type: "DualCLIPLoader", inputs: { clip_name1: "qwen_0.6b_ace15.safetensors", clip_name2: "qwen_1.7b_ace15.safetensors", type: "ace", device: "default" } },
    vae: { class_type: "VAELoader", inputs: { vae_name: "ace_1.5_vae.safetensors" } },
    cond: { class_type: "TextEncodeAceStepAudio1.5", inputs: { clip: ["clip", 0], tags, lyrics: "[inst]", seed, duration: seconds } },
    zero: { class_type: "ConditioningZeroOut", inputs: { conditioning: ["cond", 0] } },
    latent: { class_type: "EmptyAceStep1.5LatentAudio", inputs: { seconds, batch_size: 1 } },
    sampling: { class_type: "ModelSamplingAuraFlow", inputs: { model: ["unet", 0], shift: 3 } },
    sampler: { class_type: "KSampler", inputs: { model: ["sampling", 0], positive: ["cond", 0], negative: ["zero", 0], latent_image: ["latent", 0], seed, steps: 8, cfg: 1, sampler_name: "euler", scheduler: "simple", denoise: 1 } },
    decode: { class_type: "VAEDecodeAudio", inputs: { samples: ["sampler", 0], vae: ["vae", 0] } },
    save: { class_type: "SaveAudio", inputs: { audio: ["decode", 0], filename_prefix: `llamapoker/music/bed-${seed}` } },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(prompt) {
  const res = await fetch(`${server}/prompt`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt, client_id: "llamapoker-music" }) });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`ComfyUI rejected the prompt: ${JSON.stringify(body.error ?? body).slice(0, 600)}`);
  for (;;) {
    await sleep(2000);
    const h = await (await fetch(`${server}/history/${body.prompt_id}`)).json();
    const e = h[body.prompt_id];
    if (!e) continue;
    if (e.status?.status_str === "error") throw new Error(`ComfyUI failed: ${JSON.stringify(e.status.messages).slice(0, 800)}`);
    const o = e.outputs?.save?.audio?.[0];
    if (o) return o;
  }
}

mkdirSync(dirname(out), { recursive: true });
for (let i = 0; i < batch; i++) {
  const seed = seed0 + i;
  const t0 = Date.now();
  const o = await run(workflow(seed));
  const url = `${server}/view?filename=${encodeURIComponent(o.filename)}&subfolder=${encodeURIComponent(o.subfolder ?? "")}&type=${o.type ?? "output"}`;
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  const tmp = `${out}.src.flac`;
  writeFileSync(tmp, buf);
  const target = batch > 1 ? out.replace(/\.wav$/, `-${seed}.wav`) : out;
  execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-i", tmp, "-ac", "1", "-ar", "48000", "-af", "loudnorm=I=-18:TP=-2:LRA=9", "-c:a", "pcm_s16le", target]);
  execFileSync("cmd", ["/c", "del", tmp.replace(/\//g, "\\")]);
  console.log(`${basename(target)}  seed ${seed}  ${seconds} s  ${((Date.now() - t0) / 1000).toFixed(0)} s to generate`);
}
