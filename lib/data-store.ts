import type {ComponentDataset, VersionInfo} from "../src/types/data";

/**
 * Data Store Interface
 * Abstraction layer for component data storage and retrieval
 */
export interface DataStore {
  /**
   * Save versioned component data
   */
  saveVersion(library: string, version: string, data: ComponentDataset): Promise<void>;

  /**
   * Retrieve specific version of component data
   */
  getVersion(library: string, version: string): Promise<ComponentDataset>;

  /**
   * List all available versions for a library
   */
  listVersions(library: string): Promise<string[]>;

  /**
   * Get version metadata for all libraries
   */
  getVersionInfo(): Promise<Record<string, VersionInfo>>;

  /**
   * Save version metadata
   */
  saveVersionInfo?(metadata: Record<string, VersionInfo>): Promise<void>;
}

/**
 * Cloudflare R2 DataStore Implementation
 * Stores component data in Cloudflare R2 object storage
 */
export class R2DataStore implements DataStore {
  private r2?: R2Bucket;

  constructor(r2Bucket?: R2Bucket) {
    this.r2 = r2Bucket;
  }

  async saveVersion(library: string, version: string, data: ComponentDataset): Promise<void> {
    if (!this.r2) {
      console.log(`[R2DataStore] R2 not available, skipping save of ${library}@${version}`);

      return;
    }

    try {
      const key = `components/${library}/${version}.json`;
      const jsonData = JSON.stringify(data, null, 2);

      await this.r2.put(key, jsonData, {
        httpMetadata: {
          contentType: "application/json",
        },
      });

      console.log(
        `[R2DataStore] Saved ${library}@${version} to R2 (${Object.keys(data).length} components)`,
      );
    } catch (error) {
      console.error(`[R2DataStore] Failed to save ${library}@${version}:`, error);
      throw error;
    }
  }

  async getVersion(library: string, version: string): Promise<ComponentDataset> {
    if (!this.r2) {
      throw new Error(`R2 storage not available. Cannot retrieve ${library}@${version}`);
    }

    try {
      const key = `components/${library}/${version}.json`;
      const object = await this.r2.get(key);

      if (!object) {
        throw new Error(`Version ${library}@${version} not found in storage`);
      }

      const jsonText = await object.text();
      const data = JSON.parse(jsonText) as ComponentDataset;

      console.log(
        `[R2DataStore] Retrieved ${library}@${version} from R2 (${Object.keys(data).length} components)`,
      );

      return data;
    } catch (error) {
      console.error(`[R2DataStore] Failed to retrieve ${library}@${version}:`, error);
      throw error;
    }
  }

  async listVersions(library: string): Promise<string[]> {
    if (!this.r2) {
      console.log(`[R2DataStore] R2 not available, returning empty list for ${library}`);

      return [];
    }

    try {
      const prefix = `components/${library}/`;
      const objects = await this.r2.list({prefix});

      const versions = objects.objects
        .map((obj) => {
          const filename = obj.key.split("/").pop() || "";

          return filename.replace(".json", "");
        })
        .filter((v) => v.length > 0);

      console.log(
        `[R2DataStore] Found ${versions.length} versions for ${library}: ${versions.join(", ")}`,
      );

      return versions.sort();
    } catch (error) {
      console.error(`[R2DataStore] Failed to list versions for ${library}:`, error);

      return [];
    }
  }

  async getVersionInfo(): Promise<Record<string, VersionInfo>> {
    if (!this.r2) {
      console.log(`[R2DataStore] R2 not available, returning empty version info`);

      return {};
    }

    try {
      const key = `metadata/versions.json`;
      const object = await this.r2.get(key);

      if (!object) {
        console.log(`[R2DataStore] Version info not found in R2, returning defaults`);

        return {
          heroui: {current: "v3.0.0-alpha.31", extractDuration: 0, lastExtracted: ""},
        };
      }

      const jsonText = await object.text();
      const data = JSON.parse(jsonText) as Record<string, VersionInfo>;

      console.log(`[R2DataStore] Retrieved version info from R2`);

      return data;
    } catch (error) {
      console.error(`[R2DataStore] Failed to retrieve version info:`, error);

      return {
        heroui: {current: "v3.0.0-alpha.31", extractDuration: 0, lastExtracted: ""},
      };
    }
  }

  async saveVersionInfo(metadata: Record<string, VersionInfo>): Promise<void> {
    if (!this.r2) {
      console.log(`[R2DataStore] R2 not available, skipping version info save`);

      return;
    }

    try {
      const key = `metadata/versions.json`;
      const jsonData = JSON.stringify(metadata, null, 2);

      await this.r2.put(key, jsonData, {
        httpMetadata: {
          contentType: "application/json",
        },
      });

      console.log(`[R2DataStore] Saved version info to R2`);
    } catch (error) {
      console.error(`[R2DataStore] Failed to save version info:`, error);
      throw error;
    }
  }
}

/**
 * Placeholder DataStore Implementation (fallback)
 * Simple implementation with logging for development/testing
 */
export class PlaceholderDataStore implements DataStore {
  async saveVersion(library: string, version: string, data: ComponentDataset): Promise<void> {
    console.log(
      `[PlaceholderDataStore] Saving ${library}@${version} with ${Object.keys(data).length} components`,
    );
  }

  async getVersion(library: string, version: string): Promise<ComponentDataset> {
    console.log(`[PlaceholderDataStore] Retrieving ${library}@${version} from database`);
    throw new Error(`Database storage not implemented yet. Cannot retrieve ${library}@${version}`);
  }

  async listVersions(library: string): Promise<string[]> {
    console.log(`[PlaceholderDataStore] Listing versions for ${library}`);

    return [];
  }

  async getVersionInfo(): Promise<Record<string, VersionInfo>> {
    console.log(`[PlaceholderDataStore] Getting version info from database`);

    return {};
  }
}

/**
 * Create DataStore instance based on environment
 */
function createDataStore(r2Bucket?: R2Bucket): DataStore {
  // In Cloudflare Workers environment with R2 bucket
  if (r2Bucket) {
    return new R2DataStore(r2Bucket);
  }

  // Development/Node.js environment
  return new PlaceholderDataStore();
}

// Export singleton instance (defaults to placeholder for development)
export const dataStore = createDataStore();

// Export factory function for Workers environment
export {createDataStore};
