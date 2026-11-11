/**
 * The wall's only way to data: GET /api/state (the whole reading) and a few POSTs for the
 * operator's actions. `useWall` keeps the reading fresh (every 60 s while live and visible) and
 * exposes `reload` so an action can show its effect at once. Used by App.tsx.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { WallState } from "../model";

export type Reading = WallState & { days: string[] };

async function parse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (res.status === 401) {
    window.location.reload(); // the session ended: the server answers the page with the login screen
    throw new Error("signed out");
  }
  if (!res.ok) throw new Error(body.error ?? `${res.status}`);
  return body;
}

export const fetchState = (day: string | null) => fetch(`/api/state${day ? `?day=${day}` : ""}`).then((r) => parse<Reading>(r));

export const post = (path: string, body: unknown) =>
  fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => parse<{ ok: true }>(r));

export const fetchEvents = (query: Record<string, string>) =>
  fetch(`/api/event?${new URLSearchParams(query)}`).then((r) => parse<{ events: unknown[] }>(r));

export function useWall(day: string | null) {
  const [state, setState] = useState<Reading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [changedAt, setChangedAt] = useState(0); // when the reading last differed (motion only on real change)
  const last = useRef<string>("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const s = await fetchState(day);
      const sig = JSON.stringify({ ...s, asof: "", briefing: "" });
      if (sig !== last.current) {
        last.current = sig;
        setChangedAt(Date.now());
      }
      setState(s);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    void reload();
    if (day) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void reload();
    }, 60000);
    return () => window.clearInterval(id);
  }, [reload, day]);

  return { state, error, loading, reload, changedAt };
}

export function useMedia(query: string): boolean {
  const [m, setM] = useState(() => (typeof window === "undefined" ? false : window.matchMedia(query).matches));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return m;
}

export const clock = (iso: string, today: string) => {
  const d = new Date(iso);
  const hm = d.toISOString().slice(11, 16);
  return iso.slice(0, 10) === today ? hm : `${iso.slice(5, 10)} ${hm}`;
};

export const shiftDay = (day: string, by: number) => {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + by);
  return d.toISOString().slice(0, 10);
};
