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
const targetLibrary = argMap.library || 'all';
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
        Bucket: process.env.R2_BUCKET_NAME,
        Key: "native/versions.json",
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
    components: {needsUpdate: false, version: null},
    theme: {needsUpdate: false, version: null}
  };

  // Check Components
  if (targetLibrary === 'all' || targetLibrary === 'components') {
    const storedVersion = await getStoredVersion('heroui-native');
    const latestVersion = specificVersion || await getLatestVersion('heroui-native');

    if (latestVersion) {
      results.components.version = latestVersion;
      results.components.needsUpdate = forceExtract || !storedVersion || storedVersion !== latestVersion;
      console.log(`HeroUI Native Components: stored=${storedVersion}, latest=${latestVersion}, needsUpdate=${results.components.needsUpdate}`);
    }
  }

  // Check Theme
  if (targetLibrary === 'all' || targetLibrary === 'theme') {
    const storedVersion = await getStoredVersion('heroui-native-theme');
    const latestVersion = specificVersion || await getLatestVersion('heroui-native');

    if (latestVersion) {
      results.theme.version = latestVersion;
      results.theme.needsUpdate = forceExtract || !storedVersion || storedVersion !== latestVersion;
      console.log(`HeroUI Native Theme: stored=${storedVersion}, latest=${latestVersion}, needsUpdate=${results.theme.needsUpdate}`);
    }
  }

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

main().catch(error => {
  console.error('Error checking versions:', error);
  process.exit(1);
});
