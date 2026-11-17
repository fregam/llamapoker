// Finds and reads the repo's git-ignored credentials.json.
// A worktree has no credentials.json of its own, so the search goes: CREDENTIALS_PATH, the
// checkout this file is in, then the main checkout (the parent of git's common dir).
// Used by: scripts/gsc-check.mjs, scripts/gsc-store-key.mjs, scripts/scoreboard.mjs.
// Never prints a value.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, "..", "..", "..");

export function credentialsPath() {
  if (process.env.CREDENTIALS_PATH) return resolve(process.env.CREDENTIALS_PATH);
  const local = resolve(repoRoot, "credentials.json");
  if (existsSync(local)) return local;
  try {
    const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
    return resolve(common, "..", "credentials.json");
  } catch {
    return local;
  }
}

export function readCredentials() {
  const path = credentialsPath();
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
}

/** Sets one top-level key and keeps every other key as it was. */
export function writeCredential(key, value) {
  const path = credentialsPath();
  const all = readCredentials();
  all[key] = value;
  writeFileSync(path, JSON.stringify(all, null, 2) + "\n");
  return path;
}
