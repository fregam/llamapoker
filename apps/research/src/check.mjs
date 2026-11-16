// npm run check: the rules the committed research files must keep (spec: Done when, Privacy).
// Works on a fresh clone: it reads only content/research/audience/, never the git-ignored data.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PACK_TOKENS = 2500;
// Offline bound: English prose runs about 4 characters a token; 3.5 keeps us on the safe side.
export const tokens = (text) => Math.ceil(text.length / 3.5);

const QUOTE_ID = /\bQ-[A-Z0-9]+-\d+\b/g;
const PRIVATE = [
  [/(^|[\s("'])u\/[A-Za-z0-9_-]{2,}/, "a Reddit username (u/…)"],
  [/(^|[\s("'])@[A-Za-z0-9_.-]{2,}/, "an @handle"],
  [/reddit\.com\/r\/\w+\/comments\/\w+\/[^\s/]*\/\w+/, "a Reddit comment permalink"],
  [/[?&]lc=[\w-]+/, "a YouTube comment permalink"],
  [/#(post|comment|p)-?\d+/i, "a forum post permalink"],
];

export function check({ pack, topics, quotes, study, findings, claims }) {
  const errors = [];
  const defined = new Set(quotes.match(QUOTE_ID) ?? []);
  const status = new Map(findings.map((f) => [f.id, f.status]));

  if (tokens(pack) > PACK_TOKENS) errors.push(`pack.md is about ${tokens(pack)} tokens; the limit is ${PACK_TOKENS}`);
  if (/[^\u0000-ɏ -⁯←-⇿]/.test(pack)) errors.push("pack.md holds non-Latin text; keep originals in quotes.md");

  for (const [name, text] of Object.entries({ "pack.md": pack, "topics.md": topics, "study.md": study })) {
    for (const id of new Set(text.match(QUOTE_ID) ?? [])) {
      if (!defined.has(id)) errors.push(`${name} cites ${id}, which is not in quotes.md`);
    }
  }
  // A lead (one source type) may appear in the pack or topics only on a line that says so.
  for (const [name, text] of Object.entries({ "pack.md": pack, "topics.md": topics })) {
    for (const line of text.split("\n")) {
      for (const id of line.match(QUOTE_ID) ?? []) {
        const finding = id.slice(2, id.lastIndexOf("-"));
        if (!status.has(finding)) errors.push(`${name} cites ${id}, but findings.json has no finding ${finding}`);
        else if (status.get(finding) === "lead" && !/\blead\b/i.test(line)) {
          errors.push(`${name} uses ${id} from a one-source-type lead without marking the line "lead"`);
        }
      }
    }
  }
  // topics.md: "tried" (6th column) is cited or empty, never inferred (ticket 08).
  for (const row of topics.split("\n").filter((l) => /^\| T\d+ /.test(l))) {
    const cells = row.split("|").map((c) => c.trim());
    if (cells[6] && !/\bQ-[A-Z0-9]+-\d+\b/.test(cells[6])) {
      errors.push(`topics.md ${cells[1]}: "tried" has no quote id; cite one or leave it empty`);
    }
  }
  for (const f of findings) {
    if (f.status === "finding" && f.source_types.length < 2) errors.push(`finding ${f.id} has fewer than two source types`);
    if (!f.quotes.length) errors.push(`finding ${f.id} has no quote`);
  }
  for (const [name, text] of Object.entries({ "pack.md": pack, "topics.md": topics, "quotes.md": quotes, "study.md": study, "claims.md": claims ?? "" })) {
    for (const [pattern, what] of PRIVATE) if (pattern.test(text)) errors.push(`${name} contains ${what}`);
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "../../../content/research/audience");
  const read = (f) => readFileSync(join(dir, f), "utf8");
  const pack = read("pack.md");
  const errors = check({
    pack, topics: read("topics.md"), quotes: read("quotes.md"), study: read("study.md"), claims: read("claims.md"),
    findings: JSON.parse(read("findings.json")),
  });
  if (errors.length) {
    console.error(errors.map((e) => "✗ " + e).join("\n"));
    process.exit(1);
  }
  console.log(`✓ research files pass (pack.md about ${tokens(pack)} of ${PACK_TOKENS} tokens)`);
}
