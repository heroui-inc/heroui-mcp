#!/usr/bin/env node

/**
 * Theme extraction script for HeroUI Native
 */

import {ThemeExtractor} from "../extractors/theme";

async function main() {
  // Parse arguments
  const force = process.argv.includes("--force");
  const versionArg = process.argv.find((arg) => arg.startsWith("--version="))?.split("=")[1];
  const specificVersion =
    versionArg && versionArg !== "true" && versionArg !== "false" ? versionArg : undefined;

  // Handle --help
  if (process.argv.includes("--help")) {
    console.log(`Usage: extract-theme [--force] [--version=VERSION]

Extracts HeroUI Native theme documentation and uploads to R2

Options:
  --force           Force re-extraction even if version exists
  --version=VERSION Extract specific version

Environment variables:
  GITHUB_TOKEN              GitHub personal access token (optional, for rate limits)
  CLOUDFLARE_ACCOUNT_ID     Cloudflare account ID (required)
  R2_ACCESS_KEY_ID          R2 access key ID (required)
  R2_SECRET_ACCESS_KEY      R2 secret access key (required)
  R2_BUCKET_NAME            R2 bucket name (required)
`);
    process.exit(0);
  }

  // Run extraction
  const extractor = new ThemeExtractor();
  await extractor.run(force, specificVersion);
}

main().catch(console.error);
