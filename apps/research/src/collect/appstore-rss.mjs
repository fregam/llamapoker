// App Store reviews via the public iTunes RSS feed (10 pages x 50, most recent, per storefront).
// Usage: node src/collect/appstore-rss.mjs <source-slug> <app-id> [cc,cc,...]
// Output: data/raw/<source-slug>.jsonl. Re-runnable: skips review ids already in the file.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [slug, appId, ccArg] = process.argv.slice(2);
if (!slug || !appId) { console.error('usage: appstore-rss.mjs <slug> <app-id> [cc,...]'); process.exit(1); }
const COUNTRIES = (ccArg ?? 'us,gb,ca,au,in,ph,de,fr,es,it,br,mx,ru,kr,jp,cn,tw,th,vn,id,tr,pl,nl,se').split(',');
const SINCE = '2025-11-15';
const SORT = process.env.SORT ?? 'mostrecent'; // mosthelpful reaches past the 500-review cap
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, 'data', 'raw', `${slug}.jsonl`);
mkdirSync(dirname(out), { recursive: true });

const seen = new Set();
if (existsSync(out)) for (const l of readFileSync(out, 'utf8').split('\n')) if (l) seen.add(JSON.parse(l).id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hash = (s) => createHash('sha1').update(String(s)).digest('hex').slice(0, 12);

async function getJson(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    let res;
    try { res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 research-collector' } }); }
    catch { await sleep(10000 * (attempt + 1)); continue; } // ECONNRESET etc.
    if (res.status === 429 || res.status === 403 || res.status >= 500) { await sleep(15000 * (attempt + 1)); continue; }
    if (!res.ok) return null;
    try { return await res.json(); } catch { return null; }
  }
  return null;
}

let added = 0;
for (const cc of COUNTRIES) {
  let ccAdded = 0;
  for (let page = 1; page <= 10; page++) {
    const j = await getJson(`https://itunes.apple.com/${cc}/rss/customerreviews/page=${page}/id=${appId}/sortby=${SORT}/json`);
    await sleep(1500);
    let entries = j?.feed?.entry;
    if (!entries) break;
    if (!Array.isArray(entries)) entries = [entries];
    entries = entries.filter((e) => e['im:rating']);
    if (!entries.length) break;
    let old = 0;
    for (const e of entries) {
      const created = e.updated.label.slice(0, 10);
      if (created < SINCE) { old++; continue; }
      const id = e.id.label;
      if (seen.has(id)) continue;
      seen.add(id);
      const item = {
        id, source: slug, platform: 'appstore', kind: 'review',
        thread_url: `https://apps.apple.com/${cc}/app/id${appId}`, parent_id: null,
        title: e.title?.label ?? null, text: e.content?.label ?? '', lang: null, created,
        likes: Number(e['im:voteSum']?.label ?? 0), replies: 0,
        rating: Number(e['im:rating'].label), author_key: hash(e.author?.name?.label ?? ''),
        country: cc,
      };
      appendFileSync(out, JSON.stringify(item) + '\n');
      added++; ccAdded++;
    }
    if (SORT === 'mostrecent' && old === entries.length) break; // whole page older than the window
  }
  console.log(`${slug} ${cc}: +${ccAdded}`);
}
console.log(`${slug}: +${added} new, ${seen.size} total`);
