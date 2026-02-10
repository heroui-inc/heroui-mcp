/**
 * Base extractor with shared logic for all extraction types
 */

import {R2Uploader} from "../services/r2-uploader";

export abstract class BaseExtractor {
  protected r2: R2Uploader;
  protected githubBase = "https://raw.githubusercontent.com/heroui-inc/heroui-native/beta";
  protected githubRef = "beta";

  constructor() {
    // Validate environment variables
    const requiredVars = ["CLOUDFLARE_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"];
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    }

    this.r2 = new R2Uploader({
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucketName: process.env.R2_BUCKET_NAME!,
    });
  }

  /**
   * Set the GitHub ref to use for extraction
   */
  protected setGitHubRef(ref: string): void {
    this.githubRef = ref;
    this.githubBase = `https://raw.githubusercontent.com/heroui-inc/heroui-native/${ref}`;
  }

  /**
   * Get version from GitHub package.json - single source of truth
   */
  protected async getVersionFromGitHub(ref?: string): Promise<string> {
    try {
      const refToUse = ref || this.githubRef;
      const url = `https://raw.githubusercontent.com/heroui-inc/heroui-native/${refToUse}/package.json`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch package.json: ${response.status}`);
      }
      const packageJson = (await response.json()) as {version: string};

      return packageJson.version;
    } catch (error) {
      console.error("Failed to fetch version from GitHub");

      throw error;
    }
  }

  /**
   * Extract data from source
   */
  abstract extract(ref?: string): Promise<{
    data: any;
    docsPaths?: {
      paths: string[];
      categories: Array<{
        name: string;
        docs: Array<{title: string; path: string; description: string}>;
      }>;
    };
  }>;

  /**
   * Get the storage key for this extraction type
   */
  abstract getStorageKey(): string;

  /**
   * Get the storage type for R2 uploads
   */
  abstract getStorageType(): "components" | "theme";

  async run(): Promise<void> {
    const startTime = Date.now();
    console.log(`🚀 Starting ${this.getStorageKey()} extraction...`);

    try {
      const githubVersion = await this.getVersionFromGitHub();
      const versionWithPrefix = githubVersion.startsWith("v") ? githubVersion : `v${githubVersion}`;

      console.log(`📍 Version: ${versionWithPrefix}`);
      console.log(`📍 Using GitHub ref: ${this.githubRef}`);

      const storageType = this.getStorageType();

      console.log("🔄 Starting extraction...");
      const extractResult = await this.extract(this.githubRef);
      const {data, docsPaths} = extractResult;

      if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
        console.error("❌ No data extracted");
        process.exit(1);
      }

      if (storageType === "components" && typeof data === "object") {
        console.log(`📦 Extracted ${Object.keys(data).length} components`);
        // Skip uploading components.json - component list is in ctx.json
      } else if (storageType === "theme") {
        console.log(`📦 Extracted theme system`);
        // Upload theme.json (still needed for theme system data)
        await this.r2.uploadLatestVersion(storageType, data);
      }

      // Handle ctx.json creation for components
      if (storageType === "components" && docsPaths) {
        try {
          const {categories, paths} = docsPaths;

          // Create and upload ctx.json with all initialization data
          console.log("🔄 Creating ctx.json...");
          const componentDataset = data as Record<string, {name: string}>;
          const componentList = Object.keys(componentDataset).sort();

          // Create ctx data
          const ctxData = {
            components: componentList,
            docs: {
              paths,
              categories,
            },
            version: versionWithPrefix,
            timestamp: Date.now(),
          };

          await this.r2.uploadContext(ctxData);
          console.log(`✅ Uploaded ctx.json to R2`);
        } catch (error) {
          console.warn("⚠️  Failed to upload ctx.json:", error);
        }
      }

      const extractDuration = Date.now() - startTime;
      const storageKey = this.getStorageKey();

      console.log(`✅ Successfully uploaded ${storageKey} data to R2`);
      console.log(`⏱️  Extraction took ${(extractDuration / 1000).toFixed(2)} seconds`);
    } catch (error) {
      console.error("❌ Extraction failed:", error);
      process.exit(1);
    }
  }
}
