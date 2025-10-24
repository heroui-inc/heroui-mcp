#!/usr/bin/env node
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Resolve workspace:* dependencies before publishing
 * Removes workspace dependencies that are bundled into the package
 */

const packageJsonPath = resolve(process.cwd(), 'package.json');
const backupPath = resolve(process.cwd(), 'package.json.backup');

// Create backup
copyFileSync(packageJsonPath, backupPath);

const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

// Remove workspace dependencies (they're bundled into dist)
const workspaceDeps = ['@heroui/analytics', '@heroui/config'];
let removed = 0;

if (pkg.dependencies) {
  workspaceDeps.forEach(dep => {
    if (pkg.dependencies[dep]) {
      console.log(`✓ Removing workspace dependency: ${dep}`);
      delete pkg.dependencies[dep];
      removed++;
    }
  });
}

if (removed > 0) {
  writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✓ ${removed} workspace dependencies resolved`);
  console.log('⚠️  Backup saved to package.json.backup - restore after publishing!');
} else {
  console.log('✓ No workspace dependencies found');
}
