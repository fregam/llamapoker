/**
 * A tiny client-side router — real URLs (/table, /trainer…) without a router library.
 *   usePath()          the current pathname; re-renders on navigate() and back/forward
 *   navigate(path)     pushes a new URL, scrolls to the top, notifies subscribers
 *   setServerPath(p)   used by the prerender (src/entry-server.tsx) so a page can be
 *                      rendered to HTML for a given URL with no `window`
 * Routes and their titles / descriptions live in src/seo.ts.
 * Used by: App.tsx, components/Link.tsx, entry-server.tsx.
 */

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let serverPath = "/";

export function setServerPath(p: string) {
  serverPath = p;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("popstate", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("popstate", fn);
  };
}

/** Normalise "/table/" → "/table". */
export function cleanPath(p: string): string {
  return p.length > 1 ? p.replace(/\/+$/, "") : p;
}

export function usePath(): string {
  return useSyncExternalStore(
    subscribe,
    () => cleanPath(window.location.pathname),
    () => serverPath
  );
}

export function navigate(to: string) {
  if (cleanPath(window.location.pathname) === cleanPath(to)) return;
  window.history.pushState(null, "", to);
  window.scrollTo(0, 0);
  listeners.forEach((fn) => fn());
}
