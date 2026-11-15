// Yahoo!知恵袋 (qa-chiebukuro) from web-search results only.
// Direct pages and search pages return 403 (Yahoo! JAPAN blocks EEA/UK visitors), so the
// questions were gathered by many WebSearch queries restricted to chiebukuro.yahoo.co.jp.
// Input: a TSV of "<question id>\t<visible title + snippet>" lines (what the search showed).
// Only what was visible is kept: no date, no author, no answers. Titles end in "..." where the
// search engine truncated them. Duplicates (same question id) are dropped.
// Usage: node src/collect/chiebukuro-websearch.mjs <file.tsv>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../data/raw/qa-chiebukuro.jsonl');
const tsv = process.argv[2];
if (!tsv) throw new Error('usage: chiebukuro-websearch.mjs <file.tsv>');

const seen = new Set();
if (fs.existsSync(OUT)) for (const l of fs.readFileSync(OUT, 'utf8').split('\n')) if (l.trim()) seen.add(JSON.parse(l).id);
let added = 0;
const lines = [];
for (const row of fs.readFileSync(tsv, 'utf8').split('\n')) {
  const [qid, text] = row.split('\t');
  if (!qid || !text || seen.has(qid)) continue;
  seen.add(qid);
  const t = text.trim();
  lines.push(JSON.stringify({
    id: qid, source: 'qa-chiebukuro', platform: 'qa', kind: 'post',
    thread_url: `https://detail.chiebukuro.yahoo.co.jp/qa/question_detail/${qid}`, parent_id: null,
    title: t.split(' - ')[0], text: t, lang: 'ja', created: null, likes: 0, replies: 0, rating: null,
    author_key: null, via: 'websearch-snippet',
  }));
  added++;
}
if (lines.length) fs.appendFileSync(OUT, lines.join('\n') + '\n');
console.log(`qa-chiebukuro: +${added} (${seen.size} total)`);
