/* eslint-disable import/order */
/**
 * Legacy Component Service Adapter
 * Bridges old service interface to new service implementation
 * This allows legacy routes to work with the new service structure
 */

import "../../lib/domparser-polyfill";

import type {
  LegacyComponentData,
  LegacyComponentDataset,
  VersionInfo,
} from "../../../shared/types/data";
import type {ObjectStore} from "../../lib/object-store";

import {createObjectStore} from "../../lib/object-store";

// Note: ErrorCode, ErrorMessages, MCPError not used in this adapter

/**
 * Legacy Component Service Adapter
 * Provides old service interface methods for legacy routes
 */
class LegacyComponentServiceAdapter {
  private store: ObjectStore;
  private cache: Map<string, {data: unknown; timestamp: number}> = new Map();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  constructor(store: ObjectStore) {
    this.store = store;
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
      const bodyString = await this.store.get(key);

      if (bodyString === null) {
        return null;
      }

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
  async getVersionInfo(): Promise<Record<string, VersionInfo>> {
    try {
      const data = await this.getFromR2<Record<string, VersionInfo>>("react/versions.json");

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
      const keys = await this.store.list({prefix: `react/components/`, delimiter: "/"});

      if (keys.length === 0) {
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

      for (const key of keys) {
        if (key.endsWith(".json")) {
          const match = key.match(/react\/components\/([^/]+)\.json$/);
          if (match && match[1] !== "latest") {
            versions.add(match[1]);
          }
        }
      }

      // Also check version info metadata
      const versionInfo = await this.getVersionInfo();
      const libraryInfo = versionInfo[library];

      if (libraryInfo?.current) {
        versions.add(libraryInfo.current);
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
    legacyComponentService = new LegacyComponentServiceAdapter(createObjectStore(env));
  }

  return legacyComponentService;
};
