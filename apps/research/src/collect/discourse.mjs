// Discourse forum collector (public JSON API, no auth).
// Usage: node src/collect/discourse.mjs <base-url> <source-slug> [after=YYYY-MM-DD]
//   e.g. node src/collect/discourse.mjs https://forum.casino.org fo-replay
// Walks /latest.json?page=N back to the cutoff (by last activity), then fetches every topic
// (/t/<id>.json + /t/<id>/posts.json?post_ids[]= for long topics) and keeps posts created in the window.
// Re-runnable: finished topics are listed in data/raw/<slug>.topics.done; post ids are deduped.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [baseArg, slug, afterArg = '2025-11-15'] = process.argv.slice(2);
if (!baseArg || !slug) {
  console.error('usage: discourse.mjs <base-url> <source-slug> [after]');
  process.exit(1);
}
const BASE = baseArg.replace(/\/$/, '');
const CUTOFF = new Date(`${afterArg}T00:00:00Z`).getTime();
const SLEEP_MS = 1500;
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', '..', 'data', 'raw', `${slug}.jsonl`);
const doneFile = join(here, '..', '..', 'data', 'raw', `${slug}.topics.done`);
mkdirSync(dirname(out), { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const authorKey = (u) => (u ? createHash('sha1').update(u).digest('hex').slice(0, 12) : null);

const seen = new Set();
if (existsSync(out)) {
  for (const line of readFileSync(out, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { seen.add(JSON.parse(line).id); } catch {}
  }
}
const done = new Set(existsSync(doneFile) ? readFileSync(doneFile, 'utf8').split('\n').filter(Boolean) : []);

async function getJson(path) {
  const url = path.startsWith('http') ? path : BASE + path;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'research-collector/1.0', Accept: 'application/json' } });
      if (res.status === 404 || res.status === 410) return null; // deleted / private topic
      if (res.status === 429 || res.status === 403 || res.status >= 500) {
        const ra = Number(res.headers.get('retry-after')) || 0;
        const e = new Error(`HTTP ${res.status}`);
        e.wait = ra * 1000;
        throw e;
      }
      const txt = await res.text();
      if (!txt.trim()) throw new Error('empty body');
      return JSON.parse(txt);
    } catch (e) {
      const wait = Math.max(e.wait || 0, Math.min(300_000, 5_000 * 2 ** attempt));
      console.error(`  ${url}: ${e.message}; retry in ${wait / 1000}s`);
      if (attempt > 8) throw e;
      await sleep(wait);
    }
  }
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
function htmlToText(html = '') {
  return html
    .replace(/<aside class="quote[\s\S]*?<\/aside>/g, '') // quoted text belongs to another post
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h\d|blockquote|pre|div)>/gi, '\n')
    .replace(/<img[^>]*class="emoji[^"]*"[^>]*alt="([^"]*)"[^>]*>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => {
      if (ENT[e]) return ENT[e];
      if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return m;
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Category id -> slug (incl. subcategories).
const cats = {};
const site = await getJson('/site.json');
for (const c of site?.categories || []) cats[c.id] = c.slug;

// 1) Topic list back to the cutoff.
const topics = new Map();
for (let page = 0; ; page++) {
  const j = await getJson(`/latest.json?no_definitions=true&page=${page}`);
  const list = j?.topic_list?.topics || [];
  let inWindow = 0;
  for (const t of list) {
    const bumped = new Date(t.bumped_at || t.last_posted_at || t.created_at).getTime();
    if (bumped >= CUTOFF) {
      inWindow++;
      topics.set(t.id, { id: t.id, slug: t.slug, title: t.title, category: cats[t.category_id] ?? null });
    }
  }
  console.log(`${slug} latest page ${page}: ${list.length} topics, ${inWindow} in window (total ${topics.size})`);
  if (!list.length || !inWindow || !j.topic_list.more_topics_url) break;
  await sleep(SLEEP_MS);
}

// 2) Every topic, every post.
let added = 0, n = 0;
for (const t of topics.values()) {
  n++;
  if (done.has(String(t.id))) continue;
  await sleep(SLEEP_MS);
  const j = await getJson(`/t/${t.id}.json`);
  if (!j) { appendFileSync(doneFile, `${t.id}\n`); continue; }
  const posts = [...(j.post_stream?.posts || [])];
  const have = new Set(posts.map((p) => p.id));
  const missing = (j.post_stream?.stream || []).filter((id) => !have.has(id));
  // Walk the stream newest-first and stop at the first chunk entirely before the cutoff:
  // megathreads have tens of thousands of older posts we don't need.
  for (let end = missing.length; end > 0; end -= 20) {
    await sleep(SLEEP_MS);
    const qs = missing.slice(Math.max(0, end - 20), end).map((id) => `post_ids[]=${id}`).join('&');
    const more = await getJson(`/t/${t.id}/posts.json?${qs}`);
    const chunk = more?.post_stream?.posts || [];
    posts.push(...chunk);
    if (chunk.length && chunk.every((p) => new Date(p.created_at).getTime() < CUTOFF)) break;
  }
  const byNumber = new Map(posts.map((p) => [p.post_number, p.id]));
  const threadUrl = `${BASE}/t/${j.slug || t.slug}/${t.id}`;
  const lines = [];
  for (const p of posts) {
    if (p.post_type && p.post_type !== 1) continue; // skip moderator actions / whispers
    if (new Date(p.created_at).getTime() < CUTOFF) continue;
    const id = `${t.id}-${p.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const likes = p.like_count ?? (p.actions_summary || []).find((a) => a.id === 2)?.count ?? 0;
    lines.push(JSON.stringify({
      id, source: slug, platform: 'forum', kind: p.post_number === 1 ? 'post' : 'reply',
      thread_url: threadUrl,
      parent_id: p.post_number === 1 ? null : `${t.id}-${byNumber.get(p.reply_to_post_number || 1) ?? ''}`,
      title: j.title || t.title, text: htmlToText(p.cooked), lang: null,
      created: p.created_at.slice(0, 10), likes, replies: p.reply_count ?? 0, rating: null,
      author_key: authorKey(p.username), category: t.category,
    }));
  }
  if (lines.length) appendFileSync(out, lines.join('\n') + '\n');
  appendFileSync(doneFile, `${t.id}\n`);
  added += lines.length;
  if (n % 25 === 0) console.log(`${slug} topics ${n}/${topics.size}, posts added ${added}`);
}
console.log(`done ${slug}: ${topics.size} topics, ${added} posts added -> ${out}`);
