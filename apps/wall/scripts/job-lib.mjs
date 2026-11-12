// The pure half of `job` (scripts/job.mjs): what a command is, and how far along its output says
// it is. No I/O, so job.test.mjs can check it.

const QUIET_OK_MS = 10 * 60 * 1000;

/** Scripts whose station name is shorter than their file name. */
const ALIASES = { "foley-mmaudio": "foley", "reel-teardown": "teardown" };

const SCRIPT = /\.(py|mjs|cjs|js|ts|sh|ps1)$/i;
const FILE = /[^/\\]\.[A-Za-z0-9]{2,5}$/; // looks like a file: a name with an extension

const base = (p) => p.split(/[/\\]/).pop();
const stem = (p) => base(p).replace(/\.[^.]+$/, "");

/** Which station and label a command belongs to, its output file, and the command to run. */
export function recognise(argv) {
  const own = {};
  let k = 0;
  while (OWN.has(argv[k]) && k + 1 < argv.length) {
    own[argv[k].slice(2)] = argv[k + 1];
    k += 2;
  }
  if (argv[k] === "--") k++;
  const r = guess(argv.slice(k));
  return {
    ...r,
    station: own.station ?? r.station,
    label: own.label ?? r.label,
    quietOkMs: own["quiet-ok"] ? duration(own["quiet-ok"]) : QUIET_OK_MS,
  };
}

const OWN = new Set(["--station", "--label", "--quiet-ok"]);

/** "30m", "90s", "1h" or plain minutes, in milliseconds. */
export function duration(text) {
  const m = /^(\d+(?:\.\d+)?)\s*(s|m|h)?$/i.exec(String(text).trim());
  if (!m) throw new Error(`--quiet-ok: not a duration: ${text} (try 30m, 90s, 1h)`);
  const unit = { s: 1000, m: 60000, h: 3600000 }[(m[2] ?? "m").toLowerCase()];
  return Number(m[1]) * unit;
}

function guess(argv) {
  const command = [...argv];
  const files = command.slice(1).filter((a) => !a.startsWith("-") && FILE.test(a));
  const i = command.indexOf("render");
  if (command.includes("remotion") && i !== -1) {
    const [, composition, output] = command.slice(i + 1).filter((a) => !a.startsWith("-"));
    return { station: "reels-render", label: composition, output, command };
  }
  const script = command.find((a) => SCRIPT.test(a));
  const name = script ? stem(script) : stem(command[0]);
  const output = files.filter((f) => f !== script).at(-1);
  return {
    station: ALIASES[name] ?? name,
    label: output ? base(output) : name,
    output,
    command,
  };
}

/**
 * How far along one line of output says the job is, 0-100, or null. A percent wins (tqdm,
 * Remotion's bundler); else a fraction like "Rendered 120/900". A date or a fraction above 1 is
 * not progress. A stray size such as 1080/1920 can still read as progress for one line; the next
 * real progress line corrects it.
 */
export function progress(line) {
  return reading(line)?.percent ?? null;
}

/** The word just before the progress number ("Bundling 43%", "Encoded 55/150"), or null. */
export function phase(line) {
  const r = reading(line);
  return r ? (/([A-Za-z][A-Za-z-]{1,30}):?\s*$/.exec(line.slice(0, r.at))?.[1] ?? null) : null;
}

function reading(line) {
  const pct = /(\d{1,3}(?:\.\d+)?)\s?%/.exec(line);
  if (pct && Number(pct[1]) <= 100) return { percent: Math.round(Number(pct[1])), at: pct.index };
  for (const m of line.matchAll(/(?<![\d/])(\d+)\/(\d+)(?![\d/])/g)) {
    const [done, total] = [Number(m[1]), Number(m[2])];
    if (total > 0 && done <= total) return { percent: Math.round((done / total) * 100), at: m.index };
  }
  return null;
}
