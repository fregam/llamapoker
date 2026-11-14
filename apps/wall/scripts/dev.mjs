#!/usr/bin/env node
// Runs the wall locally: `vite build --watch` keeps dist/ fresh while `wrangler pages dev`
// serves it with the Pages Functions, a local D1 named `wall` and live reload. The Beehiiv keys come from the repo's git-ignored
// credentials.json and are passed as bindings for this process only, so no key is copied into
// another file (CLAUDE.md, Secrets). A `.dev.vars` file next to this app works too and wins.
//   npm run dev            → http://localhost:8788  (no password on localhost)
import { execSync, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// In a git worktree the git-ignored credentials.json lives only in the main checkout: fall back to it.
const mainCheckout = () => {
  try {
    const common = execSync("git rev-parse --path-format=absolute --git-common-dir", { cwd: app, encoding: "utf8" }).trim();
    return resolve(common, "..", "credentials.json");
  } catch {
    return "";
  }
};
const local = resolve(app, "..", "..", "credentials.json");
const creds = existsSync(local) ? local : mainCheckout();
const bindings = [];
if (!existsSync(resolve(app, ".dev.vars")) && creds && existsSync(creds)) {
  const c = JSON.parse(readFileSync(creds, "utf8"));
  if (c.beehiiv?.api_key) bindings.push("--binding", `BEEHIIV_API_KEY=${c.beehiiv.api_key}`, "--binding", `BEEHIIV_PUBLICATION_ID=${c.beehiiv.publication_id}`);
}
const port = process.env.WALL_PORT ?? "8788";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const opts = { cwd: app, stdio: "inherit", shell: process.platform === "win32" };
const vite = spawn(npx, ["vite", "build", "--watch", "--logLevel", "warn"], opts);
const wrangler = spawn(npx, ["wrangler", "pages", "dev", "--port", port, "--ip", "127.0.0.1", "--live-reload", ...bindings], opts);
const stop = (code) => {
  vite.kill();
  wrangler.kill();
  process.exit(code ?? 0);
};
wrangler.on("exit", stop);
process.on("SIGINT", () => stop(0));
