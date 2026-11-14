// Vite config for the wall (apps/wall). `npm run dev` runs this behind `wrangler pages dev`, which
// serves the Pages Functions (functions/) and a local D1 database and proxies everything else here.
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: { include: ["src/**/*.test.ts", "functions/**/*.test.ts", "scripts/**/*.test.mjs"] },
});
