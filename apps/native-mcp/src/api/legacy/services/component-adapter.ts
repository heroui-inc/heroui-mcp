/* eslint-disable import/order */
/**
 * Legacy Component Service Adapter for Native MCP
 * Bridges old service interface to new service implementation
 * This allows legacy routes to work with the old service structure
 */

import "../../lib/domparser-polyfill";

import type {ComponentData, ComponentDataset, VersionInfo} from "@shared/types/data";

import {GetObjectCommand, ListObjectsV2Command, S3Client} from "@aws-sdk/client-s3";

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
   * List components (legacy interface)
   */
  async listComponents(version?: string): Promise<string[]> {
    try {
      const versionToUse = version || "latest";
      const key =
        versionToUse === "latest"
          ? "native/latest/components.json"
          : `native/components/${versionToUse}.json`;
      const data = await this.getFromR2<ComponentDataset>(key);

      if (!data) {
        throw new Error(`No data found for version ${versionToUse}`);
      }

      return Object.keys(data).sort();
    } catch (error) {
      console.error(`Error listing components:`, error);
      throw error;
    }
  }

  /**
   * List all available examples from component data (legacy interface)
   */
  async listExamples(version?: string): Promise<string[]> {
    try {
      const versionToUse = version || "latest";
      const key =
        versionToUse === "latest"
          ? "native/latest/components.json"
          : `native/components/${versionToUse}.json`;
      const data = await this.getFromR2<ComponentDataset>(key);

      if (!data) {
        return [];
      }

      // Extract all unique example names from all components
      const exampleNames = new Set<string>();
      for (const component of Object.values(data)) {
        if (component.examples && Array.isArray(component.examples)) {
          for (const example of component.examples) {
            if (example.name) {
              exampleNames.add(example.name);
            }
          }
        }
      }

      return Array.from(exampleNames).sort();
    } catch (error) {
      console.error(`Error listing examples:`, error);

      return [];
    }
  }

  /**
   * Get component data for multiple components (legacy interface)
   */
  async getComponents(
    componentNames: string[],
    version?: string,
  ): Promise<Array<{component: string; data: ComponentData | null; error?: string}>> {
    try {
      const versionToUse = version || "latest";
      const key =
        versionToUse === "latest"
          ? "native/latest/components.json"
          : `native/components/${versionToUse}.json`;
      const dataset = await this.getFromR2<ComponentDataset>(key);

      if (!dataset) {
        return componentNames.map((name) => ({
          component: name,
          data: null,
          error: `No data found for version ${versionToUse}`,
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
      console.error(`Error getting components:`, error);

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
  async getVersionInfo(): Promise<Record<string, VersionInfo>> {
    try {
      const data = await this.getFromR2<Record<string, VersionInfo>>("native/versions.json");

      return data || {};
    } catch (error) {
      console.error("Error getting version info:", error);

      return {};
    }
  }

  /**
   * Get the latest version (legacy interface)
   */
  async getLatestVersion(packageName: string = "heroui-native"): Promise<string | null> {
    try {
      const versionInfo = await this.getVersionInfo();

      return versionInfo[packageName]?.current || null;
    } catch (error) {
      console.error(`Error getting latest version for ${packageName}:`, error);

      return null;
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
