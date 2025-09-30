/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * Package information - only the essential fields
 * This avoids bundling the entire package.json
 */

// At build time, tsup will replace __PACKAGE_NAME__ and __PACKAGE_VERSION__ with actual string values
// The redundant ternary (true ? value : value) will be optimized away by most JS engines

export const packageInfo = {
  // @ts-ignore - __PACKAGE_NAME__ is replaced by tsup at build time
  name: typeof __PACKAGE_NAME__ !== "undefined" ? __PACKAGE_NAME__ : "@heroui/mcp",
  // @ts-ignore - __PACKAGE_VERSION__ is replaced by tsup at build time
  version: typeof __PACKAGE_VERSION__ !== "undefined" ? __PACKAGE_VERSION__ : "1.0.0-alpha.1",
};
