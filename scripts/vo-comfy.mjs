#!/usr/bin/env node
// Generate voice-over with VibeVoice in the local ComfyUI (free, on the user's GPU).
//
//   node scripts/vo-comfy.mjs <reel-id> --ref <voice wav> --whole
//       THE NORMAL ROUTE: the whole reel in one generation, cloned from the reference clip,
//       apps/reels/public/vo/<reel-id>/_whole.wav; then `scripts/vo-align.py <reel-id> --split`
//       cuts it into one wav per take. One generation = one speaker for the whole reel. The
//       reference is a ~10 s clip that starts mid-sentence with content unrelated to the script
//       (a long one opening with the script's first words gets recited back before the text).
//
//   node scripts/vo-comfy.mjs <reel-id> --ref <wav> [--take name]   |   --zero-shot --seed N
//       one generation per scene instead (a scene to redo; zero-shot gives a new voice each time)
//
//   node scripts/vo-comfy.mjs --board <out-dir> --text "<paragraph>" --seeds 1,2,3 [--ref <wav>]
//       the same paragraph in several voices (zero-shot from the seed, or cloned from --ref) for
//       a listening board: <out-dir>/seed-<n>.wav
//
// Needs the ComfyUI server at --server (default http://127.0.0.1:8188) with ComfyUI-VibeVoice
// installed. The reference wav is copied into ComfyUI's input folder (llamapoker/) for LoadAudio.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ffmpeg = resolve(root, "apps/reels/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe");

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const has = (name) => args.includes(`--${name}`);
const id = args[0] && !args[0].startsWith("--") ? args[0] : null;
const server = opt("server", "http://127.0.0.1:8188");
const comfyInput = opt("comfy-input", "C:/Users/matia/Documents/ComfyUI/input");
const model = opt("model", "VibeVoice-Large");
const ref = opt("ref", null);
const q4 = !has("full-precision");
const cfg = +opt("cfg", 1.3);
const steps = +opt("steps", 10);
// Greedy decoding by default: sampling made VibeVoice wander (a 22-word hook came out 31 s long,
// with five-second silences inside words). --sample turns sampling back on for a voice board.
const sample = has("sample");
const temperature = +opt("temperature", 0.95);
const topP = +opt("top-p", 0.95);

const spoken = (t) => t.replace(/\[[^\]]+\]/g, "").replace(/[|*]/g, "").replace(/\s+/g, " ").trim();

/** Put the reference wav where ComfyUI's LoadAudio can see it; returns the LoadAudio value. */
function stageRef(path) {
  const dir = resolve(comfyInput, "llamapoker");
  mkdirSync(dir, { recursive: true });
  const name = basename(path);
  copyFileSync(path, resolve(dir, name));
  return `llamapoker/${name}`;
}

function workflow({ text, seed, refName, prefix }) {
  const g = {
    tts: {
      class_type: "VibeVoiceTTS",
      inputs: {
        model_name: model,
        text: `[1] ${text}`,
        quantize_llm_4bit: q4,
        attention_mode: "sdpa",
        cfg_scale: cfg,
        inference_steps: steps,
        seed,
        do_sample: sample,
        temperature,
        top_p: topP,
        top_k: 0,
        force_offload: false,
      },
    },
    save: { class_type: "SaveAudio", inputs: { audio: ["tts", 0], filename_prefix: prefix } },
  };
  if (refName) {
    g.ref = { class_type: "LoadAudio", inputs: { audio: refName } };
    g.tts.inputs.speaker_1_voice = ["ref", 0];
  }
  return g;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(prompt) {
  const res = await fetch(`${server}/prompt`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt, client_id: "llamapoker-vo" }) });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`ComfyUI rejected the prompt: ${JSON.stringify(body.error ?? body)}`);
  const pid = body.prompt_id;
  for (;;) {
    await sleep(1500);
    const h = await (await fetch(`${server}/history/${pid}`)).json();
    const entry = h[pid];
    if (!entry) continue;
    if (entry.status?.status_str === "error") throw new Error(`ComfyUI failed: ${JSON.stringify(entry.status.messages).slice(0, 800)}`);
    const out = entry.outputs?.save?.audio?.[0];
    if (out) return out;
  }
}

async function fetchAudio(out, target) {
  const url = `${server}/view?filename=${encodeURIComponent(out.filename)}&subfolder=${encodeURIComponent(out.subfolder ?? "")}&type=${out.type ?? "output"}`;
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  const tmp = `${target}.src.flac`;
  writeFileSync(tmp, buf);
  // Mono 48 kHz, levelled to -16 LUFS so every take (and every reel) sits at the same loudness.
  execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-i", tmp, "-ac", "1", "-ar", "48000", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "pcm_s16le", target]);
  execFileSync(process.platform === "win32" ? "cmd" : "rm", process.platform === "win32" ? ["/c", "del", tmp.replace(/\//g, "\\")] : ["-f", tmp]);
}

async function generate({ text, seed, refName, prefix, target }) {
  const t0 = Date.now();
  const out = await run(workflow({ text, seed, refName, prefix }));
  await fetchAudio(out, target);
  console.log(`${basename(target)}  seed ${seed}  ${((Date.now() - t0) / 1000).toFixed(0)} s  ${text.split(" ").length} words`);
}

const refName = ref ? stageRef(resolve(ref)) : null;

if (has("board")) {
  const dir = resolve(opt("board"));
  const text = opt("text");
  if (!text) throw new Error("--board needs --text");
  mkdirSync(dir, { recursive: true });
  const name = opt("name", "seed"); // output file: <name>-<seed>.wav
  for (const s of opt("seeds", "1").split(",").map(Number)) {
    await generate({ text, seed: s, refName, prefix: `llamapoker/board/${name}-${s}`, target: resolve(dir, `${name}-${s}.wav`) });
  }
} else {
  if (!id) throw new Error("usage: vo-comfy.mjs <reel-id> --ref <wav> [--seed N] [--take name]  |  --board <dir> --text ... --seeds 1,2");
  // Either clone a reference wav, or generate the voice from the seed alone (--zero-shot): with a
  // reference, VibeVoice-Large also recited the reference clip's own words before the take.
  if (!refName && !has("zero-shot")) throw new Error("a reel needs --ref <wav> (the chosen voice) or --zero-shot (the voice from --seed alone)");
  const script = JSON.parse(readFileSync(resolve(root, "apps/reels/src/scripts", `${id}.json`), "utf8"));
  const takes = [];
  script.lines.forEach((l) => {
    if (l.take || !takes.length) takes.push({ name: l.take ?? String(takes.length + 1), parts: [] });
    takes[takes.length - 1].parts.push(spoken(l.t));
  });
  const only = opt("take", null);
  const seed = +opt("seed", 7);
  const outDir = resolve(root, "apps/reels/public/vo", id);
  mkdirSync(outDir, { recursive: true });
  if (has("whole")) {
    // The whole reel in one generation (one speaker, sampled once, for the full length), each take
    // as its own speaker turn so the model breathes between scenes. Split into takes afterwards with
    // scripts/vo-align.py <id> --split.
    // The model tends to stop before the last turn is finished, so a throwaway sentence goes last
    // and is cut away by the split (it is not in the script, so the aligner never looks for it).
    const text = [...takes.map((tk) => tk.parts.join(" ")), "That's the whole idea. See you at the next one."].join("\n[1] ");
    // --whole-out <file> writes elsewhere (a candidate to compare) instead of replacing _whole.wav
    await generate({ text, seed, refName, prefix: `llamapoker/${id}/_whole`, target: resolve(opt("whole-out", resolve(outDir, "_whole.wav"))) });
    process.exit(0);
  }
  for (const tk of takes) {
    if (only && tk.name !== only) continue;
    const target = resolve(outDir, `${tk.name}.wav`);
    if (existsSync(target) && !has("force") && !only) {
      console.log(`${tk.name}.wav exists, skipping (use --force)`);
      continue;
    }
    await generate({ text: tk.parts.join(" "), seed, refName, prefix: `llamapoker/${id}/${tk.name}`, target });
  }
}
