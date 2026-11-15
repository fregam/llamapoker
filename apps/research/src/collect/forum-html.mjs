// HTML forum collector: walks a section's thread list back to the cutoff, then every thread's
// pages (newest first, stopping once posts fall before the cutoff), one parser per site.
// Usage: node src/collect/forum-html.mjs <source-slug> [<source-slug> ...] [after=YYYY-MM-DD]
// Sites: CardsChat (XenForo on casino.us) and GipsyTeam (custom IPB).
// Re-runnable: skips post ids already in data/raw/<slug>.jsonl; a per-thread state file
// (in STATE_DIR) skips threads whose last-post time hasn't changed since they were finished.
// Usernames are never stored, only author_key = sha1(username).slice(0,12).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.resolve(HERE, '../../data/raw');
const STATE_DIR = process.env.STATE_DIR || path.join(RAW, '.state');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const DELAY = 1500;
const GT_CAP = 300; // posts per thread, GipsyTeam diaries

const SOURCES = {
  'fo-cc-general': { site: 'cc', base: 'https://www.casino.us/cardschat/general-poker-13/' },
  'fo-cc-learning': { site: 'cc', base: 'https://www.casino.us/cardschat/learning-poker-57/' },
  'fo-cc-online': { site: 'cc', base: 'https://www.casino.us/cardschat/online-poker-73/' },
  'fo-cc-tournament': { site: 'cc', base: 'https://www.casino.us/cardschat/tournament-poker-59/' },
  'fo-gt-mtt': { site: 'gt', forum: 7 },
  'fo-gt-nl40': { site: 'gt', forum: 11 },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha = (s) => crypto.createHash('sha1').update(String(s).trim().toLowerCase()).digest('hex').slice(0, 12);
const day = (unix) => new Date(unix * 1000).toISOString().slice(0, 10);

let last = 0;
async function get(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const wait = last + DELAY - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en,ru;q=0.8' } });
      if (res.ok) return await res.text();
      if (res.status === 404) return null;
      console.error(`  ${res.status} ${url}; backing off`);
      await sleep(res.status === 429 || res.status === 403 ? 90000 * (attempt + 1) : 15000);
    } catch (e) {
      console.error(`  ${e.message} ${url}; retry`);
      await sleep(15000);
    }
  }
  throw new Error(`gave up on ${url}`);
}

function decode(s) {
  return s
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&amp;/g, '&');
}

function stripQuotes(html) {
  // remove innermost blockquotes until none remain (quoted text belongs to another post)
  const re = /<blockquote\b[^>]*>(?:(?!<blockquote\b)[\s\S])*?<\/blockquote>/gi;
  let prev;
  do { prev = html; html = html.replace(re, ' '); } while (html !== prev);
  return html;
}

function toText(html) {
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  html = html.replace(/<img[^>]*\balt="([^"]*)"[^>]*>/gi, (_, a) => (/^[\p{Emoji}\s:]+$/u.test(a) ? a : ' '));
  html = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d)>/gi, '\n');
  const t = decode(html.replace(/<[^>]+>/g, ''));
  return t.replace(/[ \t ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ---------- CardsChat (XenForo) ----------
const CC_ORIGIN = 'https://www.casino.us';
const cc = {
  listUrl: (src, n) => src.base + (n > 1 ? `page-${n}` : ''),
  parseList(html) {
    const items = [];
    for (const chunk of html.split(/<div class="structItem structItem--thread/).slice(1)) {
      const id = (chunk.match(/js-threadListItem-(\d+)/) || [])[1];
      const a = chunk.match(/<div class="structItem-title">[\s\S]*?<a href="([^"]+)"[^>]*data-tp-primary[^>]*>([\s\S]*?)<\/a>/);
      const lastTs = +((chunk.match(/structItem-latestDate[^>]*data-timestamp="(\d+)"/) || [])[1] || 0);
      if (!id || !a) continue;
      const jumps = [...chunk.matchAll(/structItem-pageJump[\s\S]*?<\/span>/g)].join('');
      const pages = Math.max(1, ...[...jumps.matchAll(/page-(\d+)/g)].map((m) => +m[1]));
      items.push({ id, url: CC_ORIGIN + a[1], title: toText(a[2]), lastTs, pages, sticky: /structItem-status--sticky/.test(chunk) });
    }
    return items;
  },
  pageUrl: (t, n) => t.url + (n > 1 ? `page-${n}` : ''),
  lastPage(html) {
    return Math.max(1, ...[...html.matchAll(/class="pageNav-page[^"]*"><a href="[^"]*\/page-(\d+)"/g)].map((m) => +m[1]));
  },
  parsePosts(html) {
    const posts = [];
    for (const chunk of html.split(/<article class="message message--post/).slice(1)) {
      const id = (chunk.match(/data-content="post-(\d+)"/) || [])[1];
      const author = decode((chunk.match(/data-author="([^"]*)"/) || [])[1] || '');
      const ts = +((chunk.match(/data-timestamp="(\d+)"[^>]*itemprop="datePublished"/) || chunk.match(/message-attribution[\s\S]*?data-timestamp="(\d+)"/) || [])[1] || 0);
      const num = +((chunk.match(/itemprop="name" content="Post #(\d+)"/) || [])[1] || 0);
      const body = (chunk.match(/<div class="bbWrapper">([\s\S]*?)<div class="js-selectToQuoteEnd">/) || [])[1];
      const likes = +((chunk.match(/itemprop="userInteractionCount" content="(\d+)"/) || [])[1] || 0);
      if (!id || body == null) continue;
      posts.push({ id, author, ts, first: num === 1, likes, text: toText(stripQuotes(body)) });
    }
    return posts;
  },
};

// ---------- GipsyTeam ----------
const GT = 'https://forum.gipsyteam.ru/index.php';
const RU_MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
function ruTime(s) {
  // list-page "last post" labels: "59 мин назад", "Сегодня, 10:00", "Вчера, 05:26", "12 ноября, 08:57", "15.08.2025 21:39"
  s = s.trim();
  const now = new Date();
  let m;
  if (/назад/.test(s)) return Math.floor(now / 1000);
  if ((m = s.match(/^(Сегодня|Вчера)/))) return Math.floor(now / 1000) - (m[1] === 'Вчера' ? 86400 : 0);
  if ((m = s.match(/^(\d{1,2})\.(\d{2})\.(\d{4})/))) return Date.UTC(+m[3], +m[2] - 1, +m[1]) / 1000;
  if ((m = s.match(/^(\d{1,2}) (\S+?),/))) {
    const mon = RU_MONTHS.indexOf(m[2]);
    if (mon >= 0) {
      let t = Date.UTC(now.getUTCFullYear(), mon, +m[1]) / 1000;
      if (t > now / 1000 + 86400) t = Date.UTC(now.getUTCFullYear() - 1, mon, +m[1]) / 1000;
      return t;
    }
  }
  return 0;
}
const gt = {
  listUrl: (src, n) => `${GT}?showforum=${src.forum}${n > 1 ? `&st=${(n - 1) * 30}` : ''}`,
  parseList(html) {
    const items = [];
    for (const chunk of html.split(/<!-- Begin Topic Entry /).slice(1)) {
      const id = (chunk.match(/^(\d+)/) || [])[1];
      const a = chunk.match(/class="subthm-card--heading"[^>]*>([\s\S]*?)<\/a>/);
      const time = (chunk.match(/class="subthm-card--time">([^<]*)</) || [])[1] || '';
      if (!id || !a) continue;
      items.push({ id, url: `${GT}?viewtopic=${id}`, title: toText(a[1]), lastTs: ruTime(time), sticky: false });
    }
    return items;
  },
  pageUrl: (t, n) => t.url + (n > 1 ? `&st=${(n - 1) * 20}` : ''),
  lastPage(html, t) {
    const sts = [...html.matchAll(new RegExp(`viewtopic=${t.id}&amp;st=(\\d+)`, 'g'))].map((m) => +m[1]);
    return Math.max(0, ...sts) / 20 + 1;
  },
  parsePosts(html) {
    const posts = [];
    for (const chunk of html.split(/<!--Begin Msg Number /).slice(1)) {
      const id = (chunk.match(/^(\d+)/) || [])[1];
      const author = toText((chunk.match(/class="post-author--link[^"]*"[^>]*>([\s\S]*?)<\/a>/) || [])[1] || '');
      const ts = +((chunk.match(/post-date--item" data-timestamp="(\d+)"/) || [])[1] || 0);
      const body = (chunk.match(new RegExp(`<div id="post-${id}">([\\s\\S]*?)<!-- !post-content -->`)) || [])[1];
      const likes = +((chunk.match(/id="comment\d+Rating"[^>]*>(-?\d+)</) || [])[1] || 0);
      if (!id || body == null) continue;
      posts.push({ id, author, ts, first: false, likes, text: toText(stripQuotes(body.replace(/<\/div>\s*<\/div>\s*$/, ''))) });
    }
    return posts;
  },
};

const SITES = { cc, gt };

// ---------- driver ----------
async function collect(slug, cutoffDay) {
  const src = SOURCES[slug];
  if (!src) throw new Error(`unknown slug ${slug}`);
  const site = SITES[src.site];
  const cutoff = Date.parse(cutoffDay + 'T00:00:00Z') / 1000;
  fs.mkdirSync(RAW, { recursive: true });
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const outFile = path.join(RAW, `${slug}.jsonl`);
  const stateFile = path.join(STATE_DIR, `${slug}.json`);
  const seen = new Set();
  const perThread = {};
  if (fs.existsSync(outFile)) {
    for (const line of fs.readFileSync(outFile, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try { const o = JSON.parse(line); seen.add(o.id); const t = o.parent_id || o.id; perThread[t] = (perThread[t] || 0) + 1; } catch {}
    }
  }
  const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : { threads: {}, list: null };
  const saveState = () => fs.writeFileSync(stateFile, JSON.stringify(state));
  const out = fs.createWriteStream(outFile, { flags: 'a' });

  // 1. thread list, back to the cutoff
  let threads = state.list;
  if (!threads) {
    threads = [];
    const ids = new Set();
    for (let n = 1; n < 2000; n++) {
      const html = await get(site.listUrl(src, n));
      if (!html) break;
      const items = site.parseList(html);
      if (!items.length) break;
      let fresh = 0;
      for (const it of items) {
        if (it.lastTs >= cutoff && !ids.has(it.id)) { ids.add(it.id); threads.push(it); }
        if (!it.sticky && it.lastTs >= cutoff) fresh++;
      }
      console.error(`${slug} list p${n}: ${items.length} items, ${fresh} in window, total ${threads.length}`);
      if (!fresh && items.some((i) => !i.sticky)) break;
    }
    state.list = threads;
    saveState();
  }

  // 2. each thread, newest page first
  let added = 0;
  let fails = 0;
  for (const [i, t] of threads.entries()) {
    if (state.threads[t.id] === t.lastTs) continue;
    try {
    const tKey = src.site === 'gt' ? `gt-t${t.id}` : `cc-t${t.id}`;
    const p1 = await get(site.pageUrl(t, 1));
    if (!p1) { state.threads[t.id] = t.lastTs; continue; }
    const lastPage = site.lastPage(p1, t);
    let firstPostId = null;
    for (const p of site.parsePosts(p1)) { firstPostId = p.id; break; }
    let n = lastPage;
    let tAdded = 0;
    while (n >= 1) {
      const html = n === 1 ? p1 : await get(site.pageUrl(t, n));
      if (!html) break;
      const posts = site.parsePosts(html);
      let older = false;
      for (const p of posts.reverse()) {
        if (!p.ts) { console.error(`  no timestamp on post ${p.id}; skipped`); continue; }
        if (p.ts < cutoff) { older = true; continue; }
        const id = `${src.site}-${p.id}`;
        if (seen.has(id)) continue;
        if (src.site === 'gt' && (perThread[tKey] || 0) >= GT_CAP) break;
        const isOp = p.first || p.id === firstPostId;
        const item = {
          id, source: slug, platform: 'forum', kind: isOp ? 'post' : 'comment', thread_url: t.url,
          parent_id: isOp ? null : tKey, title: t.title, text: p.text, lang: null, created: day(p.ts),
          likes: p.likes, replies: 0, rating: null, author_key: sha(p.author),
        };
        if (isOp) item.id = tKey; // the thread's opening post is the thread item
        if (seen.has(item.id)) continue;
        out.write(JSON.stringify(item) + '\n');
        seen.add(item.id);
        perThread[tKey] = (perThread[tKey] || 0) + 1;
        added++; tAdded++;
      }
      if (older || (src.site === 'gt' && (perThread[tKey] || 0) >= GT_CAP)) break;
      n--;
    }
    state.threads[t.id] = t.lastTs;
    saveState();
    console.error(`${slug} [${i + 1}/${threads.length}] ${t.id} pages=${lastPage} +${tAdded} (${added} total)`);
    fails = 0;
    } catch (e) {
      console.error(`${slug} [${i + 1}/${threads.length}] ${t.id} FAILED: ${e.message}`);
      if (++fails >= 5) throw new Error(`${slug}: 5 threads failed in a row; host refusing, stop and resume later`);
    }
  }
  out.end();
  console.error(`${slug} done: +${added}`);
}

const args = process.argv.slice(2);
const after = (args.find((a) => a.startsWith('after=')) || 'after=2025-11-15').slice(6);
for (const slug of args.filter((a) => !a.startsWith('after='))) await collect(slug, after);
