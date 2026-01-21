#!/usr/bin/env node

import {S3Client, GetObjectCommand} from "@aws-sdk/client-s3";
import fs from "fs";

// Parse command line arguments
const args = process.argv.slice(2);
const argMap = {};
args.forEach(arg => {
  const [key, value] = arg.split('=');
  argMap[key.replace('--', '')] = value || true;
});

const forceExtract = argMap.force === 'true';
const specificVersion = typeof argMap.version === 'string' && argMap.version !== '' ? argMap.version : undefined;

console.log(`🔧 Script configuration:`);
console.log(`   force: ${argMap.force} (parsed as forceExtract: ${forceExtract})`);
console.log(`   version: ${specificVersion || '(will fetch latest)'}`);

// Configure S3 client for R2
const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Get stored version from ctx.json
 * Returns the version string if ctx.json exists, null otherwise
 */
async function getStoredVersion() {
  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: "react/latest/ctx.json",
      })
    );
    const text = await response.Body.transformToString();
    const ctxData = JSON.parse(text);
    return ctxData.version || null;
  } catch (error) {
    if (error.name === "NoSuchKey") {
      console.log("No existing ctx.json found");
    } else {
      console.log(`Error reading ctx.json: ${error.message}`);
    }
    return null;
  }
}

/**
 * Check if theme.json exists in R2
 * Returns true if theme.json exists, false otherwise
 */
async function themeExists() {
  try {
    await client.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: "react/latest/theme.json",
      })
    );
    return true;
  } catch (error) {
    if (error.name === "NoSuchKey") {
      return false;
    }
    // For other errors, assume it doesn't exist to be safe
    return false;
  }
}

async function getLatestVersion() {
  try {
    // Fetch version from GitHub v3 branch package.json (same as extractor)
    const url = 'https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/packages/react/package.json';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch package.json: ${response.status}`);
    }
    const packageJson = await response.json();
    const version = packageJson.version;
    return version.startsWith('v') ? version : `v${version}`;
  } catch (error) {
    console.error('Failed to get version from GitHub:', error);
    return null;
  }
}

// GitHub Actions output helper
function setOutput(name, value) {
  // Use GITHUB_OUTPUT file for GitHub Actions (recommended method)
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    const valueStr = String(value || '');
    // Escape multiline values and special characters per GitHub Actions spec
    const delimiter = `ghadelimiter_${Math.random().toString(36).substring(7)}`;
    const escapedValue = valueStr.includes('\n') 
      ? `${delimiter}${valueStr}${delimiter}` 
      : valueStr;
    fs.appendFileSync(outputFile, `${name}=${escapedValue}\n`);
  } else {
    // Fallback to deprecated method for compatibility
    console.log(`::set-output name=${name}::${value}`);
  }
}

async function main() {
  const results = {
    components: {needsUpdate: false, version: null},
    theme: {needsUpdate: false, version: null}
  };

  // Get latest version from GitHub
  const latestVersion = specificVersion || await getLatestVersion();
  
  if (!latestVersion) {
    console.error("Failed to get latest version from GitHub");
    process.exit(1);
  }

  const storedVersion = await getStoredVersion();
  const themeFileExists = await themeExists();

  results.components.version = latestVersion;
  results.components.needsUpdate = forceExtract || !storedVersion || storedVersion !== latestVersion;
  console.log(`HeroUI Components: stored=${storedVersion || 'none'}, latest=${latestVersion}, needsUpdate=${results.components.needsUpdate}`);

  results.theme.version = latestVersion;
  results.theme.needsUpdate = forceExtract || !themeFileExists || !storedVersion || storedVersion !== latestVersion;
  console.log(`Theme: stored=${storedVersion || 'none'}, latest=${latestVersion}, theme.json exists=${themeFileExists}, needsUpdate=${results.theme.needsUpdate}`);

  console.log(`\n📤 Setting outputs:`);
  console.log(`   components-needs-update: ${results.components.needsUpdate}`);
  console.log(`   theme-needs-update: ${results.theme.needsUpdate}`);
  
  // Set GitHub Actions outputs
  setOutput('components-needs-update', results.components.needsUpdate);
  setOutput('theme-needs-update', results.theme.needsUpdate);
  // Only output version if it's a valid string (not undefined/null/boolean)
  if (results.components.version && typeof results.components.version === 'string') {
    setOutput('components-version', results.components.version);
  } else {
    setOutput('components-version', '');
  }
  if (results.theme.version && typeof results.theme.version === 'string') {
    setOutput('theme-version', results.theme.version);
  } else {
    setOutput('theme-version', '');
  }
}

// Run the script
main().catch(error => {
  console.error('Error checking versions:', error);
  process.exit(1);
});