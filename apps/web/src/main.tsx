/**
 * Entry point. Loads the single global stylesheet, styles.css, and starts <App /> inside
 * React.StrictMode in #root (index.html).
 * Prerendered pages (scripts/prerender.mjs) arrive with their HTML already in #root: those are
 * hydrated (hydrateRoot), so the first paint is the server HTML and the bundle only attaches
 * behaviour, but only when #root's data-path (written by the prerender) is the URL in the
 * address bar. Empty shells (the Trainer, 404.html) and any page served for a different URL
 * are rendered from scratch (createRoot), which replaces whatever markup was there.
 * Before hydrating, the router's server snapshot is set to the real URL: during hydration
 * usePath() reads that snapshot, and it must match the path the HTML was rendered for.
 * Uses: App.tsx, router (setServerPath, cleanPath), styles.css.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { cleanPath, setServerPath } from "./router";
import "./styles.css";

const root = document.getElementById("root")!;
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const path = cleanPath(window.location.pathname);

if (root.firstElementChild && root.dataset.path === path) {
  setServerPath(path);
  ReactDOM.hydrateRoot(root, app);
} else {
  ReactDOM.createRoot(root).render(app);
}
