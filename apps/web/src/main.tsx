/**
 * Entry point. Mounts <App /> into #root (index.html) inside React.StrictMode
 * and loads the single global stylesheet, styles.css.
 * Uses: App.tsx, styles.css.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
