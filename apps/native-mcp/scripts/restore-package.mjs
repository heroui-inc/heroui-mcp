#!/usr/bin/env node
import { existsSync, copyFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';

/**
 * Restore package.json from backup after publishing
 */

const packageJsonPath = resolve(process.cwd(), 'package.json');
const backupPath = resolve(process.cwd(), 'package.json.backup');

if (existsSync(backupPath)) {
  copyFileSync(backupPath, packageJsonPath);
  unlinkSync(backupPath);
  console.log('✓ package.json restored from backup');
} else {
  console.log('⚠️  No backup found');
}
