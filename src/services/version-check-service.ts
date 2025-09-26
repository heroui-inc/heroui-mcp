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
  latestVersion: z.string(),
  recommendation: z.string(),
  updateAvailable: z.boolean(),
});

export type VersionComparison = z.infer<typeof versionComparisonSchema>;

export class VersionCheckService {
  private readonly npmRegistryUrl = "https://registry.npmjs.org";
  private cache: Map<string, {data: any; timestamp: number}> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Get package information from npm registry
   */
  private async fetchPackageInfo(packageName: string): Promise<any> {
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

    // Split into parts
    const parts1 = clean1.split(/[-+]/)[0].split(".");
    const parts2 = clean2.split(/[-+]/)[0].split(".");

    // Compare major.minor.patch
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parseInt(parts1[i] || "0", 10);
      const num2 = parseInt(parts2[i] || "0", 10);

      if (num1 < num2) return -1;
      if (num1 > num2) return 1;
    }

    // If base versions are equal, compare prereleases
    const pre1 = clean1.includes("-");
    const pre2 = clean2.includes("-");

    if (pre1 && !pre2) return -1; // prerelease is less than release
    if (!pre1 && pre2) return 1; // release is greater than prerelease

    // If both are prereleases, do string comparison of the full version
    if (pre1 && pre2) {
      return clean1.localeCompare(clean2);
    }

    return 0;
  }

  /**
   * Check version status for HeroUI packages
   */
  async checkHeroUIVersion(currentVersion?: string): Promise<VersionComparison> {
    const packageInfo = await this.fetchPackageInfo("@heroui/react");

    // If no current version provided, assume user wants to check latest
    if (!currentVersion) {
      return {
        allVersions: Object.keys(packageInfo.versions || {})
          .reverse()
          .slice(0, 10),
        currentVersion: "unknown",
        isLatest: false,
        isPrerelease: false,
        latestVersion: packageInfo["dist-tags"].latest,
        recommendation: "Install HeroUI using: npm install @heroui/react",
        updateAvailable: true,
      };
    }

    const latest = packageInfo["dist-tags"].latest;
    const comparison = this.compareVersions(currentVersion, latest);
    const isLatest = comparison >= 0;
    const isPrerelease = this.isPrerelease(currentVersion);

    let recommendation = "";

    if (isLatest && !isPrerelease) {
      recommendation = "You are using the latest stable version of HeroUI.";
    } else if (isLatest && isPrerelease) {
      recommendation = `You are using a prerelease version (${currentVersion}). Consider switching to the stable version ${latest} for production use.`;
    } else {
      recommendation = `Update available! You can update from ${currentVersion} to ${latest} using: npm update @heroui/react`;
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
   * Check version status for HeroUI Native packages
   */
  async checkHeroUINativeVersion(currentVersion?: string): Promise<VersionComparison> {
    const packageInfo = await this.fetchPackageInfo("heroui-native");

    if (!currentVersion) {
      return {
        allVersions: Object.keys(packageInfo.versions || {})
          .reverse()
          .slice(0, 10),
        currentVersion: "unknown",
        isLatest: false,
        isPrerelease: false,
        latestVersion: packageInfo["dist-tags"].latest,
        recommendation: "Install HeroUI Native using: npm install heroui-native",
        updateAvailable: true,
      };
    }

    const latest = packageInfo["dist-tags"].latest;
    const comparison = this.compareVersions(currentVersion, latest);
    const isLatest = comparison >= 0;
    const isPrerelease = this.isPrerelease(currentVersion);

    let recommendation = "";

    if (isLatest && !isPrerelease) {
      recommendation = "You are using the latest stable version of HeroUI Native.";
    } else if (isLatest && isPrerelease) {
      recommendation = `You are using a prerelease version (${currentVersion}). Consider switching to the stable version ${latest} for production use.`;
    } else {
      recommendation = `Update available! You can update from ${currentVersion} to ${latest} using: npm update heroui-native`;
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
        latestVersion: packageInfo["dist-tags"].latest,
        recommendation: "Install HeroUI MCP using: npm install -g @heroui/mcp",
        updateAvailable: true,
      };
    }

    const latest = packageInfo["dist-tags"].latest;
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
