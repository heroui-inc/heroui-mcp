import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import sortDestructureKeysPlugin from "eslint-plugin-sort-destructure-keys";
import sortKeysFixPlugin from "eslint-plugin-sort-keys-fix";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

/**
 * Base ESLint configuration for all HeroUI MCP packages
 * Provides TypeScript, import, prettier, and general code quality rules
 */
export const baseConfig = [
  ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "prettier",
  ),
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
      },
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      import: importPlugin,
      prettier: prettierPlugin,
      "sort-destructure-keys": sortDestructureKeysPlugin,
      "sort-keys-fix": sortKeysFixPlugin,
      "unused-imports": unusedImportsPlugin,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "error",
      "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import/newline-after-import": ["error", { count: 1 }],
      "import/no-duplicates": "error",
      "import/order": [
        "error",
        {
          alphabetize: {
            caseInsensitive: true,
            order: "asc",
          },
          groups: [
            "type",
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "unknown",
          ],
          "newlines-between": "always",
          pathGroups: [
            {
              group: "internal",
              pattern: "~/**",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["type"],
          warnOnUnassignedImports: true,
        },
      ],
      "no-console": "warn",
      "no-process-exit": "off",
      "no-unused-vars": "off",
      "object-curly-spacing": ["error", "never"],
      "padding-line-between-statements": [
        "warn",
        { blankLine: "always", next: "return", prev: "*" },
      ],
      "prettier/prettier": "error",
      "sort-destructure-keys/sort-destructure-keys": "off",
      "sort-imports": [
        "error",
        {
          allowSeparatedGroups: true,
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
        },
      ],
      "sort-keys": "off",
      "sort-keys-fix/sort-keys-fix": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrors: "none",
          vars: "all",
          varsIgnorePattern: "^_",
        },
      ],
    },
    settings: {
      "import/resolver": {
        node: true,
        typescript: true,
      },
    },
  },
  {
    files: [".*.js", ".*.cjs", ".*.mjs", "test-mcp-local.js", "test-api.mjs"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ["scripts/**/*.mjs"],
    ...tseslint.configs.disableTypeChecked,
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    ignores: [
      "**/.temp/**",
      "**/.next/**",
      "**/.swc/**",
      "**/.turbo/**",
      "**/.cache/**",
      "**/.build/**",
      "**/.vercel/**",
      "**/.rollup.cache/**",
      "**/.rollup.cache",
      "**/.changeset/**",
      "**/.DS_Store",
      "**/dist/**",
      "**/build/**",
      "**/public/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/.contentlayer/",
      "**/__snapshots__/**",
      "**/pnpm-lock.yaml",
      "**/.source/**",
      "**/next-env.d.ts",
      "**/.wrangler/**",
      "**/data/**/*.json",
      "!.vscode/**",
      "!scripts/**",
      "eslint.config.js",
      "tsup.config.ts",
    ],
  },
];
