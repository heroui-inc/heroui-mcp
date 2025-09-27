#!/usr/bin/env node

import {S3Client, GetObjectCommand} from "@aws-sdk/client-s3";
import {exec} from 'child_process';
import {promisify} from 'util';

const execAsync = promisify(exec);

// Parse command line arguments
const args = process.argv.slice(2);
const argMap = {};
args.forEach(arg => {
  const [key, value] = arg.split('=');
  argMap[key.replace('--', '')] = value || true;
});

const forceExtract = argMap.force === 'true';
const targetLibrary = argMap.library || 'both';
const specificVersion = argMap.version;

// Configure S3 client for R2
const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function getStoredVersion(library) {
  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || "heroui-mcp-data",
        Key: "metadata/versions.json",
      })
    );
    const text = await response.Body.transformToString();
    const metadata = JSON.parse(text);
    return metadata[library]?.current || null;
  } catch (error) {
    console.log(`No existing metadata for ${library}`);
    return null;
  }
}

async function getLatestVersion(packageName) {
  try {
    const {stdout} = await execAsync(`npm view ${packageName} version`);
    const version = stdout.trim();
    return version.startsWith('v') ? version : `v${version}`;
  } catch (error) {
    console.error(`Failed to get version for ${packageName}:`, error);
    return null;
  }
}

// GitHub Actions output helper
function setOutput(name, value) {
  console.log(`::set-output name=${name}::${value}`);
}

async function main() {
  const results = {
    heroui: {needsUpdate: false, version: null},
    native: {needsUpdate: false, version: null}
  };

  // Check HeroUI
  if (targetLibrary === 'both' || targetLibrary === 'heroui') {
    const storedVersion = await getStoredVersion('heroui');
    const latestVersion = specificVersion || await getLatestVersion('@heroui/react');

    if (latestVersion) {
      results.heroui.version = latestVersion;
      results.heroui.needsUpdate = forceExtract || !storedVersion || storedVersion !== latestVersion;
      console.log(`HeroUI: stored=${storedVersion}, latest=${latestVersion}, needsUpdate=${results.heroui.needsUpdate}`);
    }
  }

  // Check Native
  if (targetLibrary === 'both' || targetLibrary === 'native') {
    const storedVersion = await getStoredVersion('native');
    const latestVersion = specificVersion || await getLatestVersion('heroui-native');

    if (latestVersion) {
      results.native.version = latestVersion;
      results.native.needsUpdate = forceExtract || !storedVersion || storedVersion !== latestVersion;
      console.log(`Native: stored=${storedVersion}, latest=${latestVersion}, needsUpdate=${results.native.needsUpdate}`);
    }
  }

  // Set GitHub Actions outputs
  setOutput('heroui-needs-update', results.heroui.needsUpdate);
  setOutput('native-needs-update', results.native.needsUpdate);
  setOutput('heroui-version', results.heroui.version);
  setOutput('native-version', results.native.version);
}

// Run the script
main().catch(error => {
  console.error('Error checking versions:', error);
  process.exit(1);
});