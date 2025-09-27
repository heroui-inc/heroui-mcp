import { defineConfig } from "tsup"

export default defineConfig([
  // STDIO build for NPM
  {
    entry: { stdio: "src/stdio.ts" },
    format: "esm",
    outDir: "dist",
    treeshake: "safest",
    splitting: false,
  },
  // HTTP build for Cloudflare Workers
  {
    entry: { index: "src/http.ts" },
    format: "esm",
    outDir: "dist",
    platform: "neutral",
    treeshake: "safest",
    splitting: false,
    target: "es2022",
  },
])