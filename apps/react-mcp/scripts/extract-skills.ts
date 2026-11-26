#!/usr/bin/env node

/**
 * Skills extraction script
 */

import {SkillsExtractor} from "../src/extraction/extractors/skills";

async function main() {
  if (process.argv.includes("--help")) {
    console.log(`Usage: extract-skills

Copies the HeroUI Agent Skills (skills/<name>/ in heroui-inc/heroui) to R2

Environment variables:
  GITHUB_TOKEN              GitHub personal access token (optional, for rate limits)
  CLOUDFLARE_ACCOUNT_ID     Cloudflare account ID (required)
  R2_ACCESS_KEY_ID          R2 access key ID (required)
  R2_SECRET_ACCESS_KEY      R2 secret access key (required)
  R2_BUCKET_NAME            R2 bucket name (required)
`);
    process.exit(0);
  }

  const extractor = new SkillsExtractor();
  await extractor.run();
}

main().catch(console.error);
