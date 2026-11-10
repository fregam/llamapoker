#!/usr/bin/env node
// Fills in and verifies the file facts (sha256, bytes, width, height) for every
// asset in a manifest such as content/library/assets.json.
//
//   node scripts/media-manifest.mjs                      write facts into content/library/assets.json
//   node scripts/media-manifest.mjs --check              verify only; exit 1 on any mismatch
//   node scripts/media-manifest.mjs path/to/assets.json  use another manifest
//
// Paths in the manifest are relative to the repo root. No dependencies.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const check = args.includes("--check");
const manifestPath = resolve(root, args.find((a) => !a.startsWith("--")) ?? "content/library/assets.json");

// Width and height from the PNG IHDR chunk or the JPEG SOF marker.
function imageSize(buf) {
  if (buf.readUInt32BE(0) === 0x89504e47) return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xc3) return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  return {};
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const problems = [];
const listed = new Set();

for (const asset of manifest.assets) {
  const file = resolve(root, asset.path);
  listed.add(file);
  if (!existsSync(file)) { problems.push(`missing file: ${asset.path}`); continue; }
  const buf = readFileSync(file);
  const facts = {
    sha256: createHash("sha256").update(buf).digest("hex"),
    bytes: statSync(file).size,
    ...imageSize(buf),
  };
  for (const [key, value] of Object.entries(facts)) {
    if (asset[key] === undefined) { if (check) problems.push(`${asset.id}: ${key} not recorded`); else asset[key] = value; }
    else if (asset[key] !== value) problems.push(`${asset.id}: ${key} is ${value}, manifest says ${asset[key]}`);
  }
}

// Every file under the library folder(s) must be listed in the manifest.
const dirs = new Set(manifest.assets.map((a) => resolve(root, a.path.split("/").slice(0, 2).join("/"))));
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
for (const d of dirs) if (existsSync(d)) for (const f of walk(d)) if (!listed.has(f)) problems.push(`unlisted file: ${relative(root, f).replaceAll("\\", "/")}`);

if (!check) writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log(`${manifest.assets.length} assets ${check ? "verified" : "recorded"} in ${relative(root, manifestPath)}`);
