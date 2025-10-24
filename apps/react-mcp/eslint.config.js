import {dirname} from "path";
import {fileURLToPath} from "url";

import {cloudflareWorkerConfig} from "@heroui/config/eslint/cloudflare-worker";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  ...cloudflareWorkerConfig,
  {
    ignores: ["scripts/**/*"],
  },
  {
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
  },
  // Shared module restrictions - cannot import from other modules
  {
    files: ["src/shared/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../mcp/*", "../api/*", "../extraction/*"],
              message:
                "Shared module cannot import from other modules (mcp, api, extraction). Keep shared code dependency-free.",
            },
          ],
        },
      ],
    },
  },
  // MCP module restrictions - can only import from shared
  {
    files: ["src/mcp/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../api/*", "../extraction/*"],
              message:
                "MCP module can only import from ../shared. Cannot import from api or extraction modules.",
            },
          ],
        },
      ],
    },
  },
  // API module restrictions - can only import from shared
  {
    files: ["src/api/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../mcp/*", "../extraction/*"],
              message:
                "API module can only import from ../shared. Cannot import from mcp or extraction modules.",
            },
          ],
        },
      ],
    },
  },
  // Extraction module restrictions - can only import from shared
  {
    files: ["src/extraction/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../mcp/*", "../api/*"],
              message:
                "Extraction module can only import from ../shared. Cannot import from mcp or api modules.",
            },
          ],
        },
      ],
    },
  },
];
