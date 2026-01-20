/* eslint-disable import/order */
/**
 * Legacy Component Service Adapter
 * Bridges old service interface to new service implementation
 * This allows legacy routes to work with the new service structure
 */

import "../../lib/domparser-polyfill";

import type {LegacyComponentData, LegacyComponentDataset} from "../../../shared/types/data";

import {GetObjectCommand, ListObjectsV2Command, S3Client} from "@aws-sdk/client-s3";

// Note: ErrorCode, ErrorMessages, MCPError not used in this adapter

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint?: string;
}

/**
 * Legacy Component Service Adapter
 * Provides old service interface methods for legacy routes
 */
class LegacyComponentServiceAdapter {
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
    const cacheKey = `r2:${key}`;
    const cached = this.cache.get(cacheKey);

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
        return null;
      }

      const bodyString = await response.Body.transformToString();
      const data = JSON.parse(bodyString) as T;

      this.cache.set(cacheKey, {data, timestamp: Date.now()});

      return data;
    } catch (error) {
      console.error(`Error fetching ${key} from R2:`, error);

      return null;
    }
  }

  /**
   * List components for a library (legacy interface)
   */
  async listComponents(library: string, version?: string): Promise<string[]> {
    try {
      const versionToUse = version || "latest";
      const key =
        versionToUse === "latest"
          ? `react/latest/components.json`
          : `react/components/${versionToUse}.json`;
      const data = await this.getFromR2<LegacyComponentDataset>(key);

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
   * Get component data for multiple components (legacy interface)
   */
  async getComponents(
    library: string,
    componentNames: string[],
    version?: string,
  ): Promise<Array<{component: string; data: LegacyComponentData | null; error?: string}>> {
    try {
      const versionToUse = version || "latest";
      const key =
        versionToUse === "latest"
          ? `react/latest/components.json`
          : `react/components/${versionToUse}.json`;
      const dataset = await this.getFromR2<LegacyComponentDataset>(key);

      if (!dataset) {
        return componentNames.map((name) => ({
          component: name,
          data: null,
          error: `No data found for ${library}`,
        }));
      }

      return componentNames.map((componentName) => {
        const component = Object.keys(dataset).find(
          (key) => key.toLowerCase() === componentName.toLowerCase(),
        );

        if (!component) {
          return {
            component: componentName,
            data: null,
            error: `Component ${componentName} not found`,
          };
        }

        return {
          component,
          data: dataset[component],
        };
      });
    } catch (error) {
      console.error(`Error getting components from ${library}:`, error);

      return componentNames.map((name) => ({
        component: name,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }

  /**
   * Get version information
   */
  async getVersionInfo(): Promise<Record<string, {current: string; versions: string[]}>> {
    try {
      const data =
        await this.getFromR2<Record<string, {current: string; versions: string[]}>>(
          "react/versions.json",
        );

      return data || {};
    } catch (error) {
      console.error("Error getting version info:", error);

      return {};
    }
  }

  /**
   * Get the latest version for a library (legacy interface)
   */
  async getLatestVersion(library: string): Promise<string | null> {
    try {
      const versionInfo = await this.getVersionInfo();

      return versionInfo[library]?.current || null;
    } catch (error) {
      console.error(`Error getting latest version for ${library}:`, error);

      return null;
    }
  }

  /**
   * List available versions for a library (legacy interface)
   */
  async listVersions(library: string): Promise<string[]> {
    try {
      // List all objects in the react/components directory to get actual versions
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: `react/components/`,
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
      const versions = new Set<string>();

      for (const obj of response.Contents) {
        if (obj.Key && obj.Key.endsWith(".json")) {
          const match = obj.Key.match(/react\/components\/([^/]+)\.json$/);
          if (match && match[1] !== "latest") {
            versions.add(match[1]);
          }
        }
      }

      // Also check version info metadata
      const versionInfo = await this.getVersionInfo();
      const libraryInfo = versionInfo[library];

      if (libraryInfo) {
        libraryInfo.versions.forEach((v) => versions.add(v));
        if (libraryInfo.current) {
          versions.add(libraryInfo.current);
        }
      }

      // Always include "latest"
      versions.add("latest");

      return Array.from(versions).sort().reverse();
    } catch (error) {
      console.error(`Error listing versions for ${library}:`, error);

      // Fallback to version info
      const versionInfo = await this.getVersionInfo();
      const libraryInfo = versionInfo[library];

      if (libraryInfo && libraryInfo.current) {
        return [libraryInfo.current, "latest"];
      }

      return ["latest"];
    }
  }
}

let legacyComponentService: LegacyComponentServiceAdapter | null = null;

export const getLegacyComponentService = async (
  env: Record<string, any>,
): Promise<LegacyComponentServiceAdapter> => {
  if (!legacyComponentService) {
    const r2AccountId = env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
    const r2AccessKeyId = env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
    const r2Bucket = env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME;

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      throw new Error("R2 credentials not configured");
    }

    const r2Endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;

    legacyComponentService = new LegacyComponentServiceAdapter({
      accountId: r2AccountId,
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
      bucketName: r2Bucket,
      endpoint: r2Endpoint,
    });
  }

  return legacyComponentService;
};
