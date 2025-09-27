/* eslint-disable import/order */
/**
 * Component Data Service - R2 Storage Implementation
 * Provides access to component data stored in Cloudflare R2
 */

// Import polyfills first - must be before AWS SDK imports
import "../lib/domparser-polyfill";

import type {ComponentData, ComponentDataset, VersionInfo} from "../types";

import {GetObjectCommand, ListObjectsV2Command, S3Client} from "@aws-sdk/client-s3";

import {ErrorCode, ErrorMessages, MCPError} from "../lib/error-handler";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint?: string;
}

/**
 * Component Data Service - R2 Implementation
 * Fetches component data from R2 bucket
 */
export class ComponentDataServiceR2 {
  private s3Client: S3Client;
  private bucketName: string;
  private cache: Map<string, {data: unknown; timestamp: number}> = new Map();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  constructor(config: R2Config) {
    const endpoint = config.endpoint || `https://${config.accountId}.r2.cloudflarestorage.com`;

    this.s3Client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    this.bucketName = config.bucketName;
  }

  /**
   * Get data from R2 with caching
   */
  private async getFromR2<T>(key: string): Promise<T | null> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        console.warn(`Key not found in R2: ${key}`);

        return null;
      }

      const text = await response.Body.transformToString();

      // Check if we got valid JSON
      if (!text || text.trim() === "") {
        throw new MCPError(
          ErrorMessages[ErrorCode.DATA_NOT_AVAILABLE]({
            details: `Empty data for key: ${key}`,
            key,
          }),
        );
      }

      let data: T;
      try {
        data = JSON.parse(text) as T;
      } catch (parseError) {
        throw new MCPError(
          ErrorMessages[ErrorCode.MALFORMED_JSON]({
            error: `Invalid JSON in R2 object: ${key}`,
            key,
          }),
        );
      }

      // Update cache
      this.cache.set(key, {data, timestamp: Date.now()});

      return data;
    } catch (error) {
      // If it's already an MCPError, throw it
      if (error instanceof MCPError) {
        throw error;
      }

      // Check for specific AWS SDK errors
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("NoSuchKey") || errorMessage.includes("404")) {
        console.warn(`Key not found in R2: ${key}`);

        return null;
      }

      if (errorMessage.includes("AccessDenied") || errorMessage.includes("403")) {
        throw new MCPError(
          ErrorMessages[ErrorCode.R2_CONNECTION_ERROR]({
            error: "Access denied to R2 bucket. Please check credentials.",
            key,
          }),
        );
      }

      if (errorMessage.includes("NoSuchBucket")) {
        throw new MCPError(
          ErrorMessages[ErrorCode.R2_CONNECTION_ERROR]({
            error: `R2 bucket '${this.bucketName}' does not exist`,
            bucket: this.bucketName,
          }),
        );
      }

      // Generic R2 error
      console.error(`Error fetching from R2: ${key}`, error);
      throw new MCPError(
        ErrorMessages[ErrorCode.R2_CONNECTION_ERROR]({
          error: errorMessage,
          key,
        }),
      );
    }
  }

  /**
   * List all available components for a library
   */
  async listComponents(library: string, version?: string): Promise<string[]> {
    try {
      const versionToUse = version || "latest";
      const key =
        versionToUse === "latest" ? `latest/${library}.json` : `${library}/${versionToUse}.json`;
      const data = await this.getFromR2<ComponentDataset>(key);

      if (!data) {
        throw new Error(`No data found for ${library}@${versionToUse}`);
      }

      return Object.keys(data).sort();
    } catch (error) {
      console.error(`Error listing components for ${library}:`, error);
      throw error;
    }
  }

  /**
   * Get component data for a specific component
   */
  async getComponent(
    library: string,
    componentName: string,
    version?: string,
  ): Promise<ComponentData | null> {
    try {
      const versionToUse = version || "latest";
      const key =
        versionToUse === "latest" ? `latest/${library}.json` : `${library}/${versionToUse}.json`;
      const data = await this.getFromR2<ComponentDataset>(key);

      if (!data) {
        return null;
      }

      // Case-insensitive search
      const component = Object.keys(data).find(
        (key) => key.toLowerCase() === componentName.toLowerCase(),
      );

      return component ? data[component] : null;
    } catch (error) {
      console.error(`Error getting component ${componentName} from ${library}:`, error);

      return null;
    }
  }

  /**
   * Get all components for a library
   */
  async getAllComponents(library: string, version?: string): Promise<ComponentDataset | null> {
    try {
      const versionToUse = version || "latest";
      const key =
        versionToUse === "latest" ? `latest/${library}.json` : `${library}/${versionToUse}.json`;
      const data = await this.getFromR2<ComponentDataset>(key);

      return data;
    } catch (error) {
      console.error(`Error getting all components for ${library}:`, error);

      return null;
    }
  }

  /**
   * Get version information
   */
  async getVersionInfo(): Promise<Record<string, VersionInfo>> {
    try {
      const data = await this.getFromR2<Record<string, VersionInfo>>("versions.json");

      return data || {};
    } catch (error) {
      console.error("Error getting version info:", error);

      return {};
    }
  }

  /**
   * List available versions for a library
   */
  async listVersions(library: string): Promise<string[]> {
    try {
      // List all objects in the library directory to get actual versions
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: `${library}/`,
        Delimiter: "/",
      });

      const response = await this.s3Client.send(command);

      if (!response.Contents || response.Contents.length === 0) {
        // Fallback to metadata if no version files found
        const versionInfo = await this.getVersionInfo();
        const libraryInfo = versionInfo[library];

        if (libraryInfo && libraryInfo.current) {
          return [libraryInfo.current, "latest"];
        }

        return ["latest"];
      }

      // Extract version numbers from file keys
      const versions = response.Contents.map((obj) => obj.Key || "")
        .filter((key) => key.endsWith(".json"))
        .map((key) => {
          // Extract version from path like "heroui/v3.0.0-alpha.31.json"
          const match = key.match(new RegExp(`^${library}/(.+)\\.json$`));

          return match ? match[1] : null;
        })
        .filter((v): v is string => v !== null)
        .sort((a, b) => {
          // Sort versions properly (newest first)
          // Handle semantic versioning with alpha/beta tags
          return this.compareVersions(b, a);
        });

      // Return the latest version first
      if (versions.length > 0) {
        return [versions[0], "latest"];
      }

      return ["latest"];
    } catch (error) {
      console.error(`Error listing versions for ${library}:`, error);

      return ["latest"];
    }
  }

  /**
   * Compare semantic versions including pre-release tags
   */
  private compareVersions(a: string, b: string): number {
    // Remove 'v' prefix if present
    const cleanA = a.replace(/^v/, "");
    const cleanB = b.replace(/^v/, "");

    // Parse semantic version parts
    const parseVersion = (v: string) => {
      const match = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-(alpha|beta|rc)\.(\d+))?/);
      if (!match) return {major: 0, minor: 0, patch: 0, prerelease: "", prereleaseNum: 0};

      return {
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
        patch: parseInt(match[3], 10),
        prerelease: match[4] || "",
        prereleaseNum: parseInt(match[5] || "0", 10),
      };
    };

    const vA = parseVersion(cleanA);
    const vB = parseVersion(cleanB);

    // Compare major.minor.patch
    if (vA.major !== vB.major) return vA.major - vB.major;
    if (vA.minor !== vB.minor) return vA.minor - vB.minor;
    if (vA.patch !== vB.patch) return vA.patch - vB.patch;

    // If one is stable and other is prerelease, stable wins
    if (!vA.prerelease && vB.prerelease) return 1;
    if (vA.prerelease && !vB.prerelease) return -1;

    // Both are prerelease, compare type (alpha < beta < rc)
    if (vA.prerelease && vB.prerelease) {
      const order = {alpha: 0, beta: 1, rc: 2};
      const orderA = order[vA.prerelease as keyof typeof order] ?? 0;
      const orderB = order[vB.prerelease as keyof typeof order] ?? 0;

      if (orderA !== orderB) return orderA - orderB;

      // Same prerelease type, compare numbers
      return vA.prereleaseNum - vB.prereleaseNum;
    }

    return 0;
  }

  /**
   * Check version status
   */
  async checkVersion(
    pkg: "heroui" | "native" | "mcp",
    currentVersion?: string,
  ): Promise<{message: string}> {
    try {
      const versionInfo = await this.getVersionInfo();
      const packageInfo = versionInfo[pkg];

      if (!packageInfo) {
        return {message: `Unable to get version information for ${pkg}`};
      }

      const latestVersion = packageInfo.current;

      if (!currentVersion) {
        return {message: `Latest ${pkg} version: ${latestVersion}`};
      }

      if (currentVersion === latestVersion) {
        return {message: `✓ You're using the latest version of ${pkg} (${latestVersion})`};
      } else {
        return {message: `Update available for ${pkg}: ${currentVersion} → ${latestVersion}`};
      }
    } catch (error) {
      console.error(`Error checking version for ${pkg}:`, error);

      return {message: `Error checking version for ${pkg}`};
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton factory
export function createComponentDataService(config: R2Config): ComponentDataServiceR2 {
  return new ComponentDataServiceR2(config);
}
