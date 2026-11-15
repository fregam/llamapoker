#!/usr/bin/env node
// YouTube collector: every video of a channel since a date, plus its comments and replies.
//
//   node src/collect/youtube.mjs <channel-url> <source-slug> <since YYYY-MM-DD> [--tabs videos,shorts] [--max-comments 500]
//
// <channel-url> is the channel root (…/channel/UC…, …/@handle) or one tab (…/@handle/shorts).
// A tab URL collects only that tab; a root URL collects /videos and /shorts.
// Output: data/raw/<slug>.jsonl (one item per line, schema in .scratch/audience-research/sources/DEEP-BRIEF.md).
// Re-runnable: a video is done once its `post` line is written (after its comments), so a crash or
// bot wall resumes where it stopped. Usernames are never stored, only author_key = sha1(name)[0:12].
// Needs: py -3.11 -m yt_dlp.

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return dflt;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const MAX_COMMENTS = Number(flag('max-comments', '500'));
const TABS_ARG = flag('tabs', null);
const [channelUrl, slug, since] = args;
if (!channelUrl || !slug || !/^\d{4}-\d{2}-\d{2}$/.test(since ?? '')) {
  console.error('usage: node src/collect/youtube.mjs <channel-url> <source-slug> <since YYYY-MM-DD> [--tabs videos,shorts] [--max-comments 500]');
  process.exit(2);
}
const SINCE = since.replaceAll('-', '');
const OUT = join(ROOT, 'data/raw', `${slug}.jsonl`);
const LISTS = join(ROOT, 'data/raw', `${slug}.videos.json`); // cached video list + per-video status
mkdirSync(dirname(OUT), { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...m) => console.log(new Date().toISOString().slice(11, 19), slug, ...m);
const authorKey = (name) => (name ? createHash('sha1').update(String(name)).digest('hex').slice(0, 12) : null);
const ymd = (d) => (d && d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : null);
const tsDate = (t) => (t ? new Date(t * 1000).toISOString().slice(0, 10) : null);

// ---------- yt-dlp ----------
function ytdlp(extra) {
  return new Promise((res) => {
    const p = spawn('py', ['-3.11', '-m', 'yt_dlp', '--no-warnings', '--sleep-requests', '2', ...extra], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      windowsHide: true,
    });
    let out = '';
    let err = '';
    p.stdout.setEncoding('utf8').on('data', (d) => (out += d));
    p.stderr.setEncoding('utf8').on('data', (d) => (err += d));
    p.on('close', (code) => res({ code, out, err }));
  });
}
const isBotWall = (err) => /not a bot|Sign in to confirm you|HTTP Error 429|Too Many Requests|HTTP Error 403|rate-limited|try again later|content isn't available/i.test(err);
const isGone = (err) => /Private video|Video unavailable|members-only|This video has been removed|age-restricted|Sign in to confirm your age|Premieres in|live event will begin/i.test(err);

// Runs yt-dlp; on a bot wall waits 5, 10, 20, 30, 30… minutes and retries (keeps going).
async function ytdlpPatient(extra, what) {
  for (let attempt = 0; ; attempt++) {
    const r = await ytdlp(extra);
    if (r.code === 0) return r;
    if (isBotWall(r.err)) {
      const min = [5, 10, 20, 30][Math.min(attempt, 3)];
      log(`bot wall on ${what}; pausing ${min} min (${r.err.trim().split('\n').pop().slice(0, 160)})`);
      await sleep(min * 60_000);
      continue;
    }
    if (isGone(r.err)) return { ...r, gone: true };
    if (attempt >= 2) return { ...r, failed: true };
    log(`error on ${what} (retrying): ${r.err.trim().split('\n').pop()}`);
    await sleep(30_000);
  }
}

// ---------- state ----------
const seen = new Set();
const doneVideos = new Set();
if (existsSync(OUT)) {
  for (const line of readFileSync(OUT, 'utf8').split('\n')) {
    if (!line) continue;
    try {
      const it = JSON.parse(line);
      seen.add(it.id);
      if (it.kind === 'post') doneVideos.add(it.id);
    } catch {}
  }
}
const state = existsSync(LISTS) ? JSON.parse(readFileSync(LISTS, 'utf8')) : { tabs: {}, skipped: {} };
const saveState = () => writeFileSync(LISTS, JSON.stringify(state, null, 1));
const write = (items) => {
  const fresh = items.filter((it) => !seen.has(it.id));
  if (!fresh.length) return 0;
  appendFileSync(OUT, fresh.map((it) => JSON.stringify(it)).join('\n') + '\n');
  fresh.forEach((it) => seen.add(it.id));
  return fresh.length;
};

// ---------- list ----------
function tabUrls() {
  const m = channelUrl.match(/^(.*?)\/(videos|shorts|streams)\/?$/);
  if (m) return [[m[2], channelUrl]];
  const base = channelUrl.replace(/\/$/, '');
  const tabs = (TABS_ARG ?? 'videos,shorts').split(',');
  return tabs.map((t) => [t, `${base}/${t}`]);
}

async function listTab(tab, url) {
  if (state.tabs[tab]?.listedAt === new Date().toISOString().slice(0, 10)) return state.tabs[tab].entries;
  log(`listing ${url}`);
  const r = await ytdlpPatient(['--flat-playlist', '-J', '--extractor-args', 'youtubetab:approximate_date', url], `list ${tab}`);
  if (r.failed || r.gone) {
    log(`could not list ${tab}: ${r.err.trim().split('\n').pop()}`);
    return [];
  }
  const entries = (JSON.parse(r.out).entries ?? []).map((e) => ({ id: e.id, title: e.title ?? null, approx: tsDate(e.timestamp) }));
  state.tabs[tab] = { listedAt: new Date().toISOString().slice(0, 10), entries };
  saveState();
  log(`${tab}: ${entries.length} entries listed`);
  return entries;
}

// ---------- one video ----------
function toItems(info, tab) {
  const url = tab === 'shorts' ? `https://www.youtube.com/shorts/${info.id}` : `https://www.youtube.com/watch?v=${info.id}`;
  const comments = info.comments ?? [];
  const replyCount = {};
  for (const c of comments) if (c.parent && c.parent !== 'root') replyCount[c.parent] = (replyCount[c.parent] ?? 0) + 1;
  const items = comments.map((c) => ({
    id: c.id,
    source: slug,
    platform: 'youtube',
    kind: c.parent && c.parent !== 'root' ? 'reply' : 'comment',
    thread_url: url,
    parent_id: c.parent && c.parent !== 'root' ? c.parent : info.id,
    title: info.title ?? null,
    text: c.text ?? '',
    lang: null,
    created: tsDate(c.timestamp),
    likes: c.like_count ?? 0,
    replies: replyCount[c.id] ?? 0,
    rating: null,
    author_key: authorKey(c.author_id ?? c.author),
  }));
  const post = {
    id: info.id,
    source: slug,
    platform: 'youtube',
    kind: 'post',
    thread_url: url,
    parent_id: null,
    title: info.title ?? null,
    text: info.description ?? '',
    lang: info.language ?? null,
    created: ymd(info.upload_date),
    likes: info.like_count ?? 0,
    replies: info.comment_count ?? comments.length,
    rating: null,
    author_key: authorKey(info.channel_id ?? info.uploader),
    tab,
    views: info.view_count ?? null,
    duration: info.duration ?? null,
    comments_collected: comments.length,
  };
  return { items, post };
}

async function fetchVideo(id, tab) {
  // comment_sort=new: newest first. max_comments = total,parents,replies,replies-per-thread.
  const r = await ytdlpPatient(
    [
      '--skip-download', '--write-comments', '-J', '--no-quiet',
      '--extractor-args', `youtube:comment_sort=new;max_comments=all,${MAX_COMMENTS},all,all`,
      `https://www.youtube.com/watch?v=${id}`,
    ],
    `video ${id}`,
  );
  if (r.gone) return { skip: r.err.trim().split('\n').pop() };
  if (r.failed) return { fail: r.err.trim().split('\n').pop() };
  // yt-dlp prints the page's own count ("Downloading ~N comments"); comment_count may be overwritten
  const m = r.err.match(/Downloading ~?([\d,]+) comments/);
  return { info: JSON.parse(r.out), expected: m ? Number(m[1].replaceAll(',', '')) : null };
}

// ---------- main ----------
const totals = { videos: 0, items: 0, old: 0, skipped: 0 };
for (const [tab, url] of tabUrls()) {
  const entries = await listTab(tab, url);
  let oldStreak = 0;
  for (const e of entries) {
    if (doneVideos.has(e.id)) { oldStreak = 0; continue; }
    if (state.skipped[e.id]) {
      if (state.skipped[e.id].startsWith('older')) { oldStreak++; if (oldStreak >= 5) break; }
      continue;
    }
    // Lists are newest first. Approximate dates (videos tab) let us stop early; shorts have none,
    // so we fetch and stop after 5 videos in a row older than the cutoff (pinned/odd ordering).
    if (e.approx && e.approx < ymd(SINCE)) {
      // approximate dates can be a few days off: only trust them once well past the cutoff
      const days = (Date.parse(ymd(SINCE)) - Date.parse(e.approx)) / 864e5;
      if (days > 10) { oldStreak++; if (oldStreak >= 5) break; continue; }
    }
    const got = await fetchVideo(e.id, tab);
    if (got.skip) {
      log(`skip ${e.id}: ${got.skip}`);
      state.skipped[e.id] = got.skip;
      saveState();
      totals.skipped++;
      continue;
    }
    if (got.fail) { log(`fail ${e.id} (retried next run): ${got.fail}`); totals.skipped++; continue; }
    // Soft wall: the page reports comments but few come back. Back off once and refetch.
    const top = (g) => (g.info.comments ?? []).filter((c) => !c.parent || c.parent === 'root').length;
    if (got.expected > 5 && top(got) < Math.min(got.expected, MAX_COMMENTS) * 0.3) {
      log(`soft wall on ${e.id}: ${top(got)} top-level of ~${got.expected}; pausing 5 min, refetching`);
      await sleep(5 * 60_000);
      const again = await fetchVideo(e.id, tab);
      if (again.info && top(again) > top(got)) Object.assign(got, again);
    }
    const info = got.info;
    if (info.upload_date && info.upload_date < SINCE) {
      state.skipped[e.id] = `older than ${since} (${ymd(info.upload_date)})`;
      saveState();
      totals.old++;
      oldStreak++;
      if (oldStreak >= 5) break;
      continue;
    }
    oldStreak = 0;
    const { items, post } = toItems(info, tab);
    post.comments_expected = got.expected;
    const n = write(items);
    write([post]); // done marker: written last
    doneVideos.add(e.id);
    totals.videos++;
    totals.items += n + 1;
    log(`${tab} ${e.id} ${post.created} +${n} comments (page says ~${got.expected ?? '?'})  [${totals.videos} videos this run]`);
    await sleep(3000 + Math.random() * 3000);
  }
}
log(`done: ${totals.videos} videos, ${totals.items} items written, ${totals.old} older stopped, ${totals.skipped} skipped`);
