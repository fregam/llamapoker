#!/usr/bin/env node
// YouTube collector on the official Data API v3 (no bot wall; ~1 quota unit per 100 comments).
//
//   node src/collect/youtube-api.mjs <channel-id | @handle> <source-slug> <since YYYY-MM-DD> [--shorts-only] [--max-comments 2000]
//
// Key: `youtube_api_key` in the repo-root credentials.json (never printed), or env YT_API_KEY.
// Output: data/raw/<slug>.jsonl in the DEEP-BRIEF schema. Re-runnable: ids already in the file are
// skipped and finished videos are listed in data/raw/<slug>.api-state.json. Stops cleanly when the
// daily quota runs out (exit 3): run it again the next day.
// Usernames are never stored, only author_key = sha1(commenter channel id)[0:12].

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const args = process.argv.slice(2);
const has = (f) => (args.includes(f) ? (args.splice(args.indexOf(f), 1), true) : false);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return dflt;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const SHORTS_ONLY = has('--shorts-only');
const MAX_COMMENTS = Number(flag('max-comments', '2000'));
const [channelArg, slug, since] = args;
if (!channelArg || !slug || !/^\d{4}-\d{2}-\d{2}$/.test(since ?? '')) {
  console.error('usage: node src/collect/youtube-api.mjs <channel-id|@handle> <slug> <since YYYY-MM-DD> [--shorts-only] [--max-comments 2000]');
  process.exit(2);
}

function apiKey() {
  if (process.env.YT_API_KEY) return process.env.YT_API_KEY;
  const common = execSync('git rev-parse --path-format=absolute --git-common-dir', { cwd: HERE, encoding: 'utf8' }).trim();
  const creds = JSON.parse(readFileSync(join(common, '..', 'credentials.json'), 'utf8'));
  if (!creds.youtube_api_key) throw new Error('youtube_api_key missing in credentials.json');
  return creds.youtube_api_key;
}
const KEY = apiKey();

const OUT = join(ROOT, 'data/raw', `${slug}.jsonl`);
const STATE = join(ROOT, 'data/raw', `${slug}.api-state.json`);
mkdirSync(dirname(OUT), { recursive: true });
const seen = new Set();
if (existsSync(OUT)) for (const l of readFileSync(OUT, 'utf8').split('\n')) if (l) try { seen.add(JSON.parse(l).id); } catch {}
const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : { done: {}, units: 0 };
const save = () => writeFileSync(STATE, JSON.stringify(state));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...m) => console.log(new Date().toISOString().slice(11, 19), slug, ...m);
const authorKey = (name) => (name ? createHash('sha1').update(String(name)).digest('hex').slice(0, 12) : null);
const emit = (o) => {
  if (seen.has(o.id)) return 0;
  seen.add(o.id);
  appendFileSync(OUT, JSON.stringify(o) + '\n');
  return 1;
};

class Quota extends Error {}
async function api(path, params) {
  const url = `https://www.googleapis.com/youtube/v3/${path}?` + new URLSearchParams({ ...params, key: KEY });
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(url);
    state.units++;
    if (r.ok) return r.json();
    const body = await r.json().catch(() => ({}));
    const reason = body?.error?.errors?.[0]?.reason ?? String(r.status);
    if (/quotaExceeded|dailyLimitExceeded/.test(reason)) throw new Quota(reason);
    if (/commentsDisabled|videoNotFound|forbidden|playlistNotFound|commentThreadNotFound/.test(reason)) return { skipped: reason, items: [] };
    if (attempt >= 4) throw new Error(`${path}: ${reason}`);
    await sleep(2000 * 2 ** attempt); // rateLimitExceeded, 5xx
  }
}

async function channelId() {
  if (/^UC[\w-]{22}$/.test(channelArg)) return channelArg;
  const j = await api('channels', { part: 'id', forHandle: channelArg.replace(/^@/, '') });
  if (!j.items?.[0]) throw new Error('channel not found: ' + channelArg);
  return j.items[0].id;
}

async function listVideos(cid) {
  // UU… = all uploads, UUSH… = Shorts only.
  const playlistId = (SHORTS_ONLY ? 'UUSH' : 'UU') + cid.slice(2);
  const ids = [];
  let pageToken;
  for (;;) {
    const j = await api('playlistItems', { part: 'contentDetails', playlistId, maxResults: 50, ...(pageToken ? { pageToken } : {}) });
    let older = 0;
    for (const it of j.items ?? []) {
      const d = (it.contentDetails.videoPublishedAt ?? '').slice(0, 10);
      if (d && d < since) older++;
      else if (d) ids.push(it.contentDetails.videoId);
    }
    pageToken = j.nextPageToken;
    if (!pageToken || older === (j.items ?? []).length) break; // uploads are newest first
  }
  return ids;
}

const commentItem = (c, videoUrl, title, parent, replies) => ({
  id: c.id,
  source: slug,
  platform: 'youtube',
  kind: parent ? 'reply' : 'comment',
  thread_url: videoUrl,
  parent_id: parent,
  title,
  text: c.snippet.textOriginal ?? '',
  lang: null,
  created: (c.snippet.publishedAt ?? '').slice(0, 10),
  likes: c.snippet.likeCount ?? 0,
  replies,
  rating: null,
  author_key: authorKey(c.snippet.authorChannelId?.value ?? c.snippet.authorDisplayName),
});

async function collectVideo(v) {
  const url = `https://www.youtube.com/watch?v=${v.id}`;
  const title = v.snippet.title;
  let n = 0;
  let top = 0;
  let pageToken;
  let skipped = null;
  while (top < MAX_COMMENTS) {
    const j = await api('commentThreads', { part: 'snippet,replies', videoId: v.id, maxResults: 100, order: 'time', textFormat: 'plainText', ...(pageToken ? { pageToken } : {}) });
    if (j.skipped) { skipped = j.skipped; break; }
    for (const t of j.items ?? []) {
      top++;
      const total = t.snippet.totalReplyCount ?? 0;
      n += emit(commentItem(t.snippet.topLevelComment, url, title, v.id, total));
      let replies = t.replies?.comments ?? [];
      if (total > replies.length) {
        replies = [];
        let rt;
        do {
          const rj = await api('comments', { part: 'snippet', parentId: t.id, maxResults: 100, textFormat: 'plainText', ...(rt ? { pageToken: rt } : {}) });
          replies.push(...(rj.items ?? []));
          rt = rj.nextPageToken;
        } while (rt);
      }
      for (const r of replies) n += emit(commentItem(r, url, title, t.id, 0));
    }
    pageToken = j.nextPageToken;
    if (!pageToken) break;
  }
  // The video itself goes last: its line marks the video as complete.
  n += emit({
    id: v.id, source: slug, platform: 'youtube', kind: 'post', thread_url: url, parent_id: null, title,
    text: v.snippet.description ?? '', lang: v.snippet.defaultAudioLanguage ?? v.snippet.defaultLanguage ?? null,
    created: (v.snippet.publishedAt ?? '').slice(0, 10), likes: Number(v.statistics?.likeCount ?? 0),
    replies: Number(v.statistics?.commentCount ?? 0), rating: null, author_key: null,
  });
  return { n, skipped };
}

try {
  const cid = await channelId();
  const ids = (await listVideos(cid)).filter((id) => !state.done[id]);
  log(`${ids.length} videos to collect since ${since}${SHORTS_ONLY ? ' (shorts only)' : ''}`);
  let total = 0;
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const j = await api('videos', { part: 'snippet,statistics', id: batch.join(','), maxResults: 50 });
    for (const v of j.items ?? []) {
      const { n, skipped } = await collectVideo(v);
      total += n;
      state.done[v.id] = skipped ?? 'ok';
      save();
    }
    log(`${Math.min(i + 50, ids.length)}/${ids.length} videos, +${total} items, ~${state.units} units used`);
  }
  save();
  log(`done: +${total} items, ${Object.keys(state.done).length} videos, ~${state.units} units used in total`);
} catch (e) {
  save();
  if (e instanceof Quota) {
    log(`daily quota reached (${e.message}); run again tomorrow to resume`);
    process.exit(3);
  }
  throw e;
}
