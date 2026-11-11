// Vite config for llamapoker.com (apps/web). The dev server may read files from the
// monorepo root so that src/styles.css can import brand/tokens.css.
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { fs: { allow: ["../.."] } },
  // Monte Carlo tests run 20,000–40,000 deals; CI runners are slower than the dev PC, so give
  // each test well beyond vitest's 5 s default rather than lowering the iteration counts.
  test: { testTimeout: 60000 },
});
