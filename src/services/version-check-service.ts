/**
 * Version Check Service
 * Provides functionality to check and compare package versions from npm registry
 */

import {z} from "zod";

// Response schema from npm registry
const npmPackageSchema = z.object({
  "dist-tags": z.object({
    alpha: z.string().optional(),
    beta: z.string().optional(),
    latest: z.string(),
    next: z.string().optional(),
  }),
  time: z.record(z.string(), z.string()).optional(),
  versions: z.record(z.string(), z.any()).optional(),
});

// Version comparison result schema
export const versionComparisonSchema = z.object({
  allVersions: z.array(z.string()).optional(),
  currentVersion: z.string(),
  isLatest: z.boolean(),
  isPrerelease: z.boolean(),
  isVersionError: z.boolean().optional(),
  latestVersion: z.string(),
  recommendation: z.string(),
  updateAvailable: z.boolean(),
});

export type VersionComparison = z.infer<typeof versionComparisonSchema>;

interface PackageInfo {
  versions?: Record<string, unknown>;
  "dist-tags"?: {
    latest?: string;
    next?: string;
    alpha?: string;
    [key: string]: string | undefined;
  };
  [key: string]: unknown;
}

interface CacheData {
  data: PackageInfo;
  timestamp: number;
}

export class VersionCheckService {
  private readonly npmRegistryUrl = "https://registry.npmjs.org";
  private cache: Map<string, CacheData> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Get package information from npm registry
   */
  private async fetchPackageInfo(packageName: string): Promise<PackageInfo> {
    const cacheKey = `pkg:${packageName}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const url = `${this.npmRegistryUrl}/${packageName}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch package info for ${packageName}: ${response.statusText}`);
    }

    const data = await response.json();
    const parsed = npmPackageSchema.parse(data);

    this.cache.set(cacheKey, {data: parsed, timestamp: Date.now()});

    return parsed;
  }

  /**
   * Check if a version is a prerelease version
   */
  private isPrerelease(version: string): boolean {
    return (
      version.includes("-alpha") ||
      version.includes("-beta") ||
      version.includes("-rc") ||
      version.includes("-next")
    );
  }

  /**
   * Compare two semantic versions
   * Returns: -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    // Remove 'v' prefix if present
    const clean1 = v1.replace(/^v/, "");
    const clean2 = v2.replace(/^v/, "");

    // Split into base version and prerelease
    const [base1, pre1] = clean1.split("-");
    const [base2, pre2] = clean2.split("-");

    // Split base version into parts
    const parts1 = base1.split(".");
    const parts2 = base2.split(".");

    // Compare major.minor.patch
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parseInt(parts1[i] || "0", 10);
      const num2 = parseInt(parts2[i] || "0", 10);

      if (num1 < num2) return -1;
      if (num1 > num2) return 1;
    }

    // Base versions are equal, now compare prereleases
    if (!pre1 && !pre2) return 0; // Both are releases
    if (!pre1 && pre2) return 1; // Release > prerelease
    if (pre1 && !pre2) return -1; // Prerelease < release

    // Both have prereleases, need to compare them
    // Extract prerelease type and number (e.g., "alpha.33" -> ["alpha", "31"])
    const preMatch1 = pre1.match(/^([a-z]+)\.?(\d+)?$/i);
    const preMatch2 = pre2.match(/^([a-z]+)\.?(\d+)?$/i);

    if (!preMatch1 || !preMatch2) {
      // Fallback to string comparison if format is unexpected
      return pre1.localeCompare(pre2);
    }

    const [, preType1, preNum1] = preMatch1;
    const [, preType2, preNum2] = preMatch2;

    // Compare prerelease types (alpha < beta < rc)
    const preOrder: Record<string, number> = {alpha: 1, beta: 2, rc: 3};
    const order1 = preOrder[preType1.toLowerCase()] || 0;
    const order2 = preOrder[preType2.toLowerCase()] || 0;

    if (order1 !== order2) {
      return order1 - order2;
    }

    // Same prerelease type, compare numbers
    const num1 = parseInt(preNum1 || "0", 10);
    const num2 = parseInt(preNum2 || "0", 10);

    return num1 - num2;
  }

  /**
   * Get the latest v3 version (stable or alpha)
   */
  private getLatestV3Version(packageInfo: PackageInfo): string {
    const versions = Object.keys(packageInfo.versions || {});

    // Filter for v3 versions (both stable and alpha)
    const v3Versions = versions.filter((v) => {
      const clean = v.replace(/^v/, "");

      return clean.startsWith("3.");
    });

    if (v3Versions.length === 0) {
      // Fallback to alpha if no v3 stable found
      return packageInfo["dist-tags"]?.alpha || packageInfo["dist-tags"]?.latest || "unknown";
    }

    // Sort v3 versions and get the latest
    v3Versions.sort((a, b) => this.compareVersions(b, a));

    return v3Versions[0];
  }

  /**
   * Check version status for HeroUI packages (v3 focused)
   */
  async checkHeroUIVersion(currentVersion?: string): Promise<VersionComparison> {
    const packageInfo = await this.fetchPackageInfo("@heroui/react");

    // Get the latest v3 version
    const latestV3 = this.getLatestV3Version(packageInfo);

    // Get v3 versions for display
    const v3Versions = Object.keys(packageInfo.versions || {})
      .filter((v) => v.replace(/^v/, "").startsWith("3."))
      .sort((a, b) => this.compareVersions(b, a))
      .slice(0, 10);

    // If no current version provided, assume user wants to check latest
    if (!currentVersion) {
      return {
        allVersions: v3Versions,
        currentVersion: "unknown",
        isLatest: false,
        isPrerelease: false,
        latestVersion: latestV3,
        recommendation: `Install HeroUI v3 using: npm install @heroui/react@${latestV3}`,
        updateAvailable: true,
      };
    }

    // Check if current version is v2 or lower
    const currentMajor = parseInt(currentVersion.replace(/^v/, "").split(".")[0], 10);

    if (currentMajor < 3) {
      const isAlpha = latestV3.includes("alpha");

      return {
        allVersions: v3Versions,
        currentVersion,
        isLatest: false,
        isPrerelease: false,
        isVersionError: true,
        latestVersion: latestV3,
        recommendation: `**This MCP server is only compatible with @heroui/react v3+**\n\nYou are currently using v${currentMajor}.x, which is not supported.\n\n## Required Action:\n\n1. Upgrade to HeroUI v3 (currently in ${isAlpha ? "alpha" : "stable"} status):\n   \`\`\`bash\n   npm install @heroui/react@${latestV3}\n   \`\`\`\n\n2. Update your imports and components to v3 syntax\n\n⚠️ **Note:** v3 is ${isAlpha ? "currently in alpha and may have breaking changes" : "the latest stable version"}`,
        updateAvailable: true,
      };
    }

    // Check if the provided version actually exists
    const allVersions = Object.keys(packageInfo.versions || {});
    const versionExists = allVersions.includes(currentVersion.replace(/^v/, ""));

    // For v3 versions, compare with latest v3
    const comparison = this.compareVersions(currentVersion, latestV3);
    const isPrerelease = this.isPrerelease(currentVersion);

    // If current version is higher than latest AND doesn't exist in registry, it's invalid
    if (comparison > 0 && !versionExists) {
      const isAlpha = latestV3.includes("alpha");

      return {
        allVersions: v3Versions,
        currentVersion,
        isLatest: false,
        isPrerelease,
        isVersionError: true,
        latestVersion: latestV3,
        recommendation: `**Invalid version detected: ${currentVersion}**\n\nThis version does not exist in the npm registry.\n\n## Available latest version:\n- **${latestV3}** (${isAlpha ? "alpha" : "stable"})\n\n## Required Action:\n\nUpdate your package.json to use the correct version:\n\`\`\`bash\nnpm install @heroui/react@${latestV3}\n\`\`\`\n\n## Recent v3 versions:\n${v3Versions
          .slice(0, 5)
          .map((v) => `- ${v}`)
          .join("\n")}`,
        updateAvailable: true,
      };
    }

    const isLatest = comparison >= 0;
    let recommendation = "";

    if (isLatest) {
      recommendation = `You are using the latest v3 version of HeroUI${isPrerelease ? " (prerelease)" : ""}.`;
    } else {
      recommendation = `Update available! You can update from ${currentVersion} to ${latestV3} using: npm update @heroui/react`;
    }

    return {
      allVersions: v3Versions,
      currentVersion,
      isLatest,
      isPrerelease,
      latestVersion: latestV3,
      recommendation,
      updateAvailable: !isLatest,
    };
  }

  /**
   * Check version status for the MCP server itself
   */
  async checkMCPVersion(currentVersion?: string): Promise<VersionComparison> {
    const packageInfo = await this.fetchPackageInfo("@heroui/mcp");

    if (!currentVersion) {
      return {
        allVersions: Object.keys(packageInfo.versions || {})
          .reverse()
          .slice(0, 10),
        currentVersion: "unknown",
        isLatest: false,
        isPrerelease: false,
        latestVersion: packageInfo["dist-tags"]?.latest || "unknown",
        recommendation: "Install HeroUI MCP using: npm install -g @heroui/mcp",
        updateAvailable: true,
      };
    }

    const latest = packageInfo["dist-tags"]?.latest || "unknown";
    const comparison = this.compareVersions(currentVersion, latest);
    const isLatest = comparison >= 0;
    const isPrerelease = this.isPrerelease(currentVersion);

    let recommendation = "";

    if (isLatest && !isPrerelease) {
      recommendation = "You are using the latest stable version of HeroUI MCP.";
    } else if (isLatest && isPrerelease) {
      recommendation = `You are using a prerelease version (${currentVersion}). Consider switching to the stable version ${latest} for production use.`;
    } else {
      recommendation = `Update available! You can update from ${currentVersion} to ${latest} using: npm update -g @heroui/mcp`;
    }

    return {
      allVersions: Object.keys(packageInfo.versions || {})
        .reverse()
        .slice(0, 10),
      currentVersion,
      isLatest,
      isPrerelease,
      latestVersion: latest,
      recommendation,
      updateAvailable: !isLatest,
    };
  }

  /**
   * Unified check version method
   */
  async checkVersion(pkg: "heroui" | "mcp", currentVersion?: string): Promise<string> {
    let versionInfo;
    let packageName: string;

    switch (pkg) {
      case "heroui":
        packageName = "HeroUI";
        versionInfo = await this.checkHeroUIVersion(currentVersion);
        break;
      case "mcp":
        packageName = "HeroUI MCP";
        versionInfo = await this.checkMCPVersion(currentVersion);
        break;
    }

    // const isVersionValid = currentVersion && !versionInfo.isVersionError;
    const recommendation = versionInfo.recommendation || "";

    let result = `# ${packageName} Version Check\n\n`;

    if (currentVersion) {
      result += `**Current Version:** ${currentVersion}\n`;
    }
    result += `**Latest Version:** ${versionInfo.latestVersion}\n`;

    if (versionInfo.isVersionError) {
      result += `**Status:** ❌ Error\n\n${recommendation}`;
    } else if (!currentVersion) {
      result += `**Status:** ℹ️ Not installed\n\n`;
      result += `## Installation\n\n`;
      result += `\`\`\`bash\n`;

      switch (pkg) {
        case "heroui":
          result += `npm install @heroui/react@${versionInfo.latestVersion}\n`;
          break;
        case "mcp":
          result += `npm install -g @heroui/mcp\n`;
          break;
      }

      result += `\`\`\``;
    } else if (versionInfo.isLatest) {
      result += `**Status:** ✅ Up to date\n\n${recommendation}`;
    } else {
      result += `**Status:** ⚠️ Update available\n\n${recommendation}`;
    }

    if (versionInfo.allVersions && versionInfo.allVersions.length > 0) {
      result += `\n\n## Recent Versions\n${versionInfo.allVersions
        .slice(0, 5)
        .map((v) => `- ${v}`)
        .join("\n")}`;
    }

    return result;
  }

  /**
   * Get all available versions for a package
   */
  async getAvailableVersions(packageName: string): Promise<string[]> {
    const fullPackageName = packageName.startsWith("@") ? packageName : `@heroui/${packageName}`;
    const packageInfo = await this.fetchPackageInfo(fullPackageName);

    return Object.keys(packageInfo.versions || {})
      .sort((a, b) => this.compareVersions(b, a)) // Sort descending
      .slice(0, 20); // Return top 20 versions
  }
}

// Export singleton instance
export const versionCheckService = new VersionCheckService();
