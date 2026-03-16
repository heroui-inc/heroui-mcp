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
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
  },
];

