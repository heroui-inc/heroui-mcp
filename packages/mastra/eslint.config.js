import {dirname} from "path";
import {fileURLToPath} from "url";

import {nodeConfig} from "@heroui/config/eslint/node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  ...nodeConfig,
  {
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    ignores: [".mastra/**"],
  },
];
