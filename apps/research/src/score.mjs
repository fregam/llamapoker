// Tier 2 of the source map: rank every candidate in code, no AI.
// score = 0.40 voice (comments a week) + 0.25 reach (followers) + 0.20 recency + 0.15 access,
// each 0..1 (log-scaled against the whole pool). Missing numbers take the median of the
// candidate's type, times 0.8, so an unknown never beats a measured source of the same size.

const ACCESS = { public: 1, login: 0.8, "blocks-bots": 0.6, invite: 0.3 };

export function normUrl(u = "") {
  return String(u)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^(www\.|m\.|old\.)/, "")
    .replace(/#.*$/, "")
    .replace(/[?&](utm_[^=&]*|si|ref|fbclid|igsh|feature)=[^&]*/g, "")
    .replace(/^([^?]*?)&/, "$1?") // a kept param that followed a dropped first one
    .replace(/\/+(\?|$)/, "$1")
    .replace(/\?$/, "");
}

export function dedupe(rows) {
  const seen = new Map();
  for (const r of rows) {
    const k = normUrl(r.url) || r.platform + ":" + String(r.name).toLowerCase();
    const prev = seen.get(k);
    if (!prev) {
      seen.set(k, { ...r });
      continue;
    }
    for (const [f, v] of Object.entries(r)) if (prev[f] == null && v != null) prev[f] = v; // merge gaps
  }
  return [...seen.values()];
}

export function monthsAgo(last, now = new Date()) {
  const m = /^(\d{4})-(\d{2})/.exec(last ?? "");
  if (!m) return null;
  return (now.getFullYear() - +m[1]) * 12 + (now.getMonth() + 1 - +m[2]);
}

const median = (xs) => {
  const s = xs.filter((x) => x != null).sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};
const num = (x) => (typeof x === "number" && isFinite(x) && x >= 0 ? x : null);
const perWeek = (r) =>
  num(r.posts_per_week) != null && num(r.comments_per_post) != null ? r.posts_per_week * r.comments_per_post : null;

export function score(rows, now = new Date()) {
  const byType = {};
  for (const r of rows) (byType[r.type] ??= []).push(r);
  const med = {};
  for (const [t, rs] of Object.entries(byType)) {
    med[t] = { followers: median(rs.map((r) => num(r.followers))), cpw: median(rs.map(perWeek)) };
  }
  const filled = rows.map((r) => {
    let cpw = perWeek(r);
    let fol = num(r.followers);
    const imputed = [];
    if (cpw == null) {
      cpw = (med[r.type]?.cpw ?? 0) * 0.8;
      imputed.push("voice");
    }
    if (fol == null) {
      fol = (med[r.type]?.followers ?? 0) * 0.8;
      imputed.push("reach");
    }
    return { r, cpw, fol, imputed };
  });
  const maxL = (k) => Math.max(1e-9, ...filled.map((f) => Math.log10(1 + f[k])));
  const mc = maxL("cpw");
  const mf = maxL("fol");
  return filled
    .map(({ r, cpw, fol, imputed }) => {
      const voice = Math.log10(1 + cpw) / mc;
      const reach = Math.log10(1 + fol) / mf;
      const ago = monthsAgo(r.last_activity, now);
      const recency = ago == null ? 0.5 : Math.max(0, 1 - Math.max(0, ago - 1) / 23);
      const access = ACCESS[r.access] ?? 0.6;
      const s = 0.4 * voice + 0.25 * reach + 0.2 * recency + 0.15 * access;
      return {
        ...r,
        score: +s.toFixed(4),
        parts: { voice: +voice.toFixed(3), reach: +reach.toFixed(3), recency: +recency.toFixed(3), access },
        imputed,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// Top n for tier 3, but every type and language keeps a floor so the ranking can't drown
// small markets or formats.
export function pickForJudging(ranked, n = 200, minPerType = 8, minPerLang = 3) {
  const out = new Set();
  const take = (pred, k) => {
    let c = 0;
    for (const r of ranked) {
      if (c >= k) break;
      if (pred(r)) {
        out.add(r);
        c++;
      }
    }
  };
  for (const t of new Set(ranked.map((r) => r.type))) take((r) => r.type === t, minPerType);
  for (const l of new Set(ranked.map((r) => r.lang))) take((r) => r.lang === l, minPerLang);
  for (const r of ranked) {
    if (out.size >= n) break;
    out.add(r);
  }
  return ranked.filter((r) => out.has(r));
}
