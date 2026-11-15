// Reddit collector via the Arctic Shift archive API (no Reddit auth needed).
// Usage: node src/collect/reddit.mjs <subreddit> <source-slug> [after=YYYY-MM-DD] [before=YYYY-MM-DD]
// Pulls every post and every comment in the window, paginating by created_utc (ascending).
// Re-runnable: resumes from the newest created_utc already in the output file and skips known ids.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [sub, slug, afterArg = '2025-11-15', beforeArg] = process.argv.slice(2);
if (!sub || !slug) {
  console.error('usage: reddit.mjs <subreddit> <source-slug> [after] [before]');
  process.exit(1);
}
const API = 'https://arctic-shift.photon-reddit.com/api';
const SLEEP_MS = 1500;
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', '..', 'data', 'raw', `${slug}.jsonl`);
mkdirSync(dirname(out), { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const authorKey = (a) =>
  !a || a === '[deleted]' || a === 'AutoModerator' ? null : createHash('sha1').update(a).digest('hex').slice(0, 12);
const day = (utc) => new Date(utc * 1000).toISOString().slice(0, 10);
const strip = (id) => (id ? String(id).replace(/^t\d_/, '') : null);

// Known ids and resume point per kind.
const seen = new Set();
const lastTs = { post: 0, comment: 0 };
if (existsSync(out)) {
  for (const line of readFileSync(out, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line);
      seen.add(`${o.kind}:${o.id}`);
      if (o._utc && o._utc > lastTs[o.kind]) lastTs[o.kind] = o._utc;
    } catch {}
  }
}

async function getJson(url) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'research-collector/1.0' } });
      if (res.status === 429 || res.status === 403 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      if (j.error) throw new Error(j.error);
      return j;
    } catch (e) {
      const wait = Math.min(300_000, 5_000 * 2 ** attempt);
      console.error(`  ${e.message}; retry in ${wait / 1000}s`);
      if (attempt > 10) throw e;
      await sleep(wait);
    }
  }
}

const POST_FIELDS = 'id,author,title,selftext,created_utc,score,num_comments,link_flair_text';
const COMMENT_FIELDS = 'id,author,body,created_utc,score,link_id,parent_id';

function toItem(kind, d) {
  if (kind === 'post') {
    return {
      id: d.id, source: slug, platform: 'reddit', kind: 'post',
      thread_url: `https://www.reddit.com/r/${sub}/comments/${d.id}/`,
      parent_id: null, title: d.title ?? null,
      text: d.selftext && d.selftext !== '[removed]' && d.selftext !== '[deleted]' ? d.selftext : (d.selftext || ''),
      lang: null, created: day(d.created_utc), likes: d.score ?? 0, replies: d.num_comments ?? 0,
      rating: null, author_key: authorKey(d.author), flair: d.link_flair_text ?? null, _utc: d.created_utc,
    };
  }
  return {
    id: d.id, source: slug, platform: 'reddit', kind: 'comment',
    thread_url: `https://www.reddit.com/r/${sub}/comments/${strip(d.link_id)}/`,
    parent_id: strip(d.parent_id), title: null, text: d.body ?? '',
    lang: null, created: day(d.created_utc), likes: d.score ?? 0, replies: null,
    rating: null, author_key: authorKey(d.author), _utc: d.created_utc,
  };
}

async function walk(kind) {
  const path = kind === 'post' ? 'posts' : 'comments';
  const fields = kind === 'post' ? POST_FIELDS : COMMENT_FIELDS;
  const startUtc = Math.floor(new Date(`${afterArg}T00:00:00Z`).getTime() / 1000);
  let after = Math.max(startUtc, lastTs[kind] ? lastTs[kind] - 1 : 0);
  let added = 0;
  for (;;) {
    let url = `${API}/${path}/search?subreddit=${sub}&sort=asc&limit=auto&fields=${fields}&after=${after}`;
    if (beforeArg) url += `&before=${beforeArg}`;
    const j = await getJson(url);
    const rows = j.data || [];
    let fresh = 0;
    const lines = [];
    for (const d of rows) {
      const key = `${kind}:${d.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(JSON.stringify(toItem(kind, d)));
      fresh++;
    }
    if (lines.length) appendFileSync(out, lines.join('\n') + '\n');
    added += fresh;
    const last = rows.length ? rows.at(-1).created_utc : after;
    console.log(`${slug} ${kind}: +${fresh} (total new ${added}) up to ${rows.length ? day(last) : '-'}`);
    if (!rows.length || (fresh === 0 && last <= after + 1)) break;
    after = last - 1; // overlap one second; dedupe by id handles ties
    await sleep(SLEEP_MS);
  }
  return added;
}

const p = await walk('post');
const c = await walk('comment');
console.log(`done ${slug}: ${p} posts, ${c} comments added -> ${out}`);
