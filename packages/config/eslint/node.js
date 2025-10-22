import globals from "globals";

import {baseConfig} from "./base.js";

/**
 * ESLint configuration for Node.js packages
 * Extends base with Node.js and ES2025 globals
 */
export const nodeConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2025,
      },
    },
  },
];
