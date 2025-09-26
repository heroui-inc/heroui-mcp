// Type definitions
export interface ComponentProp {
  name: string;
  type: string;
  description?: string;
  default?: unknown;
  required?: boolean;
}

export interface ComponentData {
  name: string;
  description?: string;
  importStatement?: string;
  props: Record<string, ComponentProp>;
}

export interface ComponentDataset {
  [componentName: string]: ComponentData;
}

export interface VersionInfo {
  current: string;
  lastExtracted: string;
  extractDuration: number;
}

// Conditional import based on environment
let dataStore: any;

// Check if running in Cloudflare Workers environment
if (typeof globalThis !== 'undefined' && 'R2Bucket' in globalThis) {
  // Dynamic import for Cloudflare environment
  const module = await import("./data-store.js");
  dataStore = module.dataStore;
} else {
  // Use file-based store for Node.js environment
  const module = await import("./data-store-file.js");
  dataStore = module.dataStore;
}

// Simplified static imports for latest data (Workers-compatible)
const LATEST_IMPORTS = {
  heroui: () => import("../../data/latest/heroui.json"),
  native: () => import("../../data/latest/native.json"),
} as const;

/**
 * Component Data Service
 * Provides lazy-loading access to component data without memory pre-loading
 */
export class ComponentDataService {
  private versionCache: Record<string, VersionInfo> | null = null;
  private dataStore: DataStore;

  constructor(dataStoreInstance?: DataStore) {
    this.dataStore = dataStoreInstance || dataStore;
  }

  /**
   * Get version information for libraries
   */
  private async getVersionInfo(): Promise<Record<string, VersionInfo>> {
    if (!this.versionCache) {
      try {
        const versions = await import("../../data/versions.json");

        this.versionCache = versions.default;
      } catch (error) {
        throw new Error(`Failed to load version info: ${String(error)}`);
      }
    }

    return this.versionCache;
  }

  /**
   * Resolve version to specific version or latest
   */
  private async resolveVersion(library: string, version?: string): Promise<string> {
    if (version && version !== "latest") {
      const versionInfo = await this.getVersionInfo();
      const libraryInfo = versionInfo[library];

      if (!libraryInfo) {
        throw new Error(`Library "${library}" not found`);
      }

      // If version is the current version, return 'latest'
      if (versionInfo[library].current === version) {
        return "latest";
      }

      return version;
    }

    // Default to 'latest'
    return "latest";
  }

  /**
   * Import component dataset for a library/version combination
   */
  private async importComponentData(library: string, version: string): Promise<ComponentDataset> {
    // For latest version, use static imports
    if (version === "latest") {
      if (library in LATEST_IMPORTS) {
        try {
          const module = await LATEST_IMPORTS[library as keyof typeof LATEST_IMPORTS]();

          return module.default;
        } catch (error) {
          throw new Error(`Failed to import latest data for ${library}: ${error}`);
        }
      }
    }

    // For specific versions, delegate to database
    try {
      return await this.dataStore.getVersion(library, version);
    } catch (error) {
      throw new Error(`Data not available for ${library}@${version}. ${error}`);
    }
  }

  /**
   * Get a specific component's data
   */
  async getComponent(library: string, name: string, version?: string): Promise<ComponentData> {
    const resolvedVersion = await this.resolveVersion(library, version);
    const dataset = await this.importComponentData(library, resolvedVersion);

    const component = dataset[name];

    if (!component) {
      throw new Error(`Component "${name}" not found in ${library}@${resolvedVersion}`);
    }

    return component;
  }

  /**
   * List all components for a library
   */
  async listComponents(library: string, version?: string): Promise<string[]> {
    const resolvedVersion = await this.resolveVersion(library, version);
    const dataset = await this.importComponentData(library, resolvedVersion);

    return Object.keys(dataset).sort();
  }

  /**
   * Check if a component exists
   */
  async hasComponent(library: string, name: string, version?: string): Promise<boolean> {
    try {
      await this.getComponent(library, name, version);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get component usage example
   */
  async getComponentExample(library: string, name: string, version?: string): Promise<string> {
    const component = await this.getComponent(library, name, version);
    const packageName = library === "heroui" ? "@heroui/react" : "@heroui/native";

    return `\`\`\`tsx
import { ${component.name} } from '${packageName}';

function Example() {
  return (
    <${component.name}>
      Example content
    </${component.name}>
  );
}
\`\`\``;
  }

  /**
   * Save component data to external storage (placeholder for future database integration)
   */
  async saveComponentData(library: string, version: string, data: ComponentDataset): Promise<void> {
    await this.dataStore.saveVersion(library, version, data);
  }
}

// Export a singleton instance
export const componentDataService = new ComponentDataService();
