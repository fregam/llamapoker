/**
 * <Link> — an <a href> that navigates client-side (src/router.ts) on a plain click,
 * but still behaves like a normal link for middle-click, Ctrl/Cmd-click and crawlers.
 * Used by: App.tsx (masthead, colophon), views/Home.tsx.
 */

import { AnchorHTMLAttributes, MouseEvent } from "react";
import { navigate } from "../router";

export function Link({ to, onClick, ...rest }: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  }
  return <a href={to} onClick={handle} {...rest} />;
}
