import {dirname} from "path";
import {fileURLToPath} from "url";

import {cloudflareWorkerConfig} from "@heroui/config/eslint/cloudflare-worker";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  ...cloudflareWorkerConfig,
  {
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json", "./mastra/tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: ["src/api/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*", "../../*", "../../../*"],
              message:
                "API module must be isolated. Imports from outside src/api/ are not allowed.",
            },
            {
              group: ["~/lib/*", "~/services/*", "~/tools/*"],
              message:
                "API module must be isolated. Imports from outside src/api/ are not allowed.",
            },
          ],
        },
      ],
    },
  },
];
