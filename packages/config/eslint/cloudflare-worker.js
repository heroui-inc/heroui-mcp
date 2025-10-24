import {nodeConfig} from "./node.js";

/**
 * ESLint configuration for Cloudflare Workers packages
 * Extends node config with Cloudflare Workers-specific globals and rules
 */
export const cloudflareWorkerConfig = [
  ...nodeConfig,
  {
    languageOptions: {
      globals: {
        R2Bucket: "readonly", // Cloudflare R2 storage
      },
    },
  },
  {
    files: ["src/worker.ts", "src/index.ts", "src/api.ts"],
    rules: {
      // Cloudflare Workers specific - restrict globals not available in Workers
      "no-restricted-globals": ["error", "window", "document"],
    },
  },
];
