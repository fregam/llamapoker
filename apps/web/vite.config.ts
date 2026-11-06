// Vite config for llamapoker.com (apps/web). The dev server may read files from the
// monorepo root so that src/styles.css can import brand/tokens.css.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { fs: { allow: ["../.."] } },
});
