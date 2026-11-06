/**
 * Server entry used only at build time: renders the app to an HTML string for one URL,
 * so search engines and link previews get real content. Built with
 * `vite build --ssr src/entry-server.tsx --outDir dist-ssr`, then driven by
 * scripts/prerender.mjs, which writes one HTML file per route into dist/.
 * Uses: App.tsx, router (setServerPath), seo (route table).
 */

import { renderToString } from "react-dom/server";
import App from "./App";
import { setServerPath } from "./router";

export { ROUTES, NOT_FOUND } from "./seo";

export function render(path: string): string {
  setServerPath(path);
  return renderToString(<App />);
}
