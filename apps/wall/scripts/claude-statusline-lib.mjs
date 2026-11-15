// The pure half of scripts/claude-statusline.mjs: what the status line shows, which limit
// readings to send to the wall, and when. Tested in claude-statusline.test.mjs.
//
// Claude Code pipes a JSON object to the status line command on every refresh. For subscribers
// it carries `rate_limits.five_hour` and `rate_limits.seven_day`, each
// `{ used_percentage: 0-100, resets_at: epoch seconds }`, and only once the first API response
// of the session is in. A window that is missing is skipped, never sent as zero.

export const WINDOWS = [
  { id: "five_hour", short: "5h" },
  { id: "seven_day", short: "wk" },
];

/** A reading still the same after this long is sent again, so the wall's "as of" stays true. */
export const HEARTBEAT_MS = 10 * 60 * 1000;
/** After the wall did not answer, wait this long before trying again (keeps the line fast). */
export const BACKOFF_MS = 5 * 60 * 1000;

const windowsOf = (payload) =>
  WINDOWS.flatMap(({ id, short }) => {
    const w = payload?.rate_limits?.[id];
    const used = w?.used_percentage;
    const resetsAt = w?.resets_at;
    // typeof, not Number(): Number(null) is 0, and a blank reading must never become 0%.
    return typeof used === "number" && typeof resetsAt === "number" && Number.isFinite(used) && Number.isFinite(resetsAt) ? [{ id, short, used, resetsAt }] : [];
  });

/** The `usage` events for the wall (common event format), one per window present. */
export function limitEvents(payload, now = new Date()) {
  const ts = now.toISOString();
  return windowsOf(payload).map((w) => ({ kind: "usage", channel: "claude", subject: w.id, amount: w.used, unit: "%", ts, meta: { resets_at: w.resetsAt } }));
}

/** What identifies a reading: the whole percent and the reset time of each window. */
export function readingKey(payload) {
  return windowsOf(payload).map((w) => `${w.id}:${Math.round(w.used)}:${w.resetsAt}`).join("|");
}

/**
 * Whether to send now. `last` is the state file: `{ key, sentAt, failedAt }` (ms). Nothing to
 * send without a reading; otherwise send when the reading changed or the heartbeat is due,
 * unless the wall failed to answer within the backoff.
 */
export function shouldSend(payload, last, nowMs = Date.now()) {
  const key = readingKey(payload);
  if (!key) return false;
  if (last?.failedAt && nowMs - last.failedAt < BACKOFF_MS) return false;
  return key !== last?.key || !last?.sentAt || nowMs - last.sentAt >= HEARTBEAT_MS;
}

/** The status line itself: the model, then each window's percent. */
export function statusText(payload) {
  const parts = [];
  const model = payload?.model?.display_name;
  if (model) parts.push(model);
  for (const w of windowsOf(payload)) parts.push(`${w.short} ${Math.round(w.used)}%`);
  return parts.join(" · ") || "Claude";
}
