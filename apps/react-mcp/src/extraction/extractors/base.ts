/**
 * Base extractor with shared logic for all extraction types
 */

import {R2Uploader} from "../services/r2-uploader";

export abstract class BaseExtractor {
  protected r2: R2Uploader;
  protected githubBase = "https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3";

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
   * Get version from GitHub package.json - single source of truth
   */
  protected async getVersionFromGitHub(): Promise<string> {
    try {
      const url = `${this.githubBase}/packages/react/package.json`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch package.json: ${response.status}`);
      }
      const packageJson = (await response.json()) as {version: string};

      return packageJson.version;
    } catch (error) {
      console.error("Failed to fetch version from GitHub, using fallback");

      throw error;
    }
  }

  /**
   * Extract data from source
   */
  abstract extract(): Promise<{data: any}>;

  /**
   * Get the storage key for this extraction type
   */
  abstract getStorageKey(): string;

  /**
   * Get the storage type for R2 uploads
   */
  abstract getStorageType(): "components" | "theme";

  /**
   * Run the extraction and upload process
   */
  async run(force: boolean = false, specificVersion?: string): Promise<void> {
    const startTime = Date.now();
    console.log(`🚀 Starting ${this.getStorageKey()} extraction...`);

    try {
      // Get version from GitHub first (or use specific version if provided)
      const githubVersion = specificVersion || (await this.getVersionFromGitHub());
      const versionWithPrefix = githubVersion.startsWith("v") ? githubVersion : `v${githubVersion}`;

      console.log(`📍 Target version: ${versionWithPrefix}`);

      const storageType = this.getStorageType();

      // Check if version exists in R2 (unless forced)
      if (!force) {
        console.log("🔍 Checking if version exists in R2...");
        const exists = await this.r2.versionExists(storageType, versionWithPrefix);
        if (exists) {
          console.log(
            `ℹ️  Version ${versionWithPrefix} already exists in R2. Use --force to overwrite.`,
          );

          return;
        }
        console.log("✓ Version not found in R2, proceeding with extraction");
      } else {
        console.log("⚠️  Force flag detected, skipping version check");
      }

      // Extract data from GitHub
      console.log("🔄 Starting extraction from GitHub...");
      const {data} = await this.extract();

      if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
        console.error("❌ No data extracted");
        process.exit(1);
      }

      // Log extraction results
      if (storageType === "components" && typeof data === "object") {
        console.log(
          `📦 Extracted ${Object.keys(data).length} components for version ${versionWithPrefix}`,
        );
      } else if (storageType === "theme") {
        console.log(`📦 Extracted theme system for version ${versionWithPrefix}`);
      }

      // Upload versioned data
      if (storageType === "components") {
        await this.r2.uploadComponentData(versionWithPrefix, data);
      } else {
        await this.r2.uploadThemeData(versionWithPrefix, data);
      }

      // Upload as latest
      await this.r2.uploadLatestVersion(storageType, data);

      // Update metadata
      const metadata = ((await this.r2.getVersionMetadata()) as any) || {};
      const extractDuration = Date.now() - startTime;
      const storageKey = this.getStorageKey();

      metadata[storageKey] = {
        current: versionWithPrefix,
        lastExtracted: new Date().toISOString(),
        extractDuration,
      };
      await this.r2.updateVersionMetadata(metadata);

      console.log(
        `✅ Successfully uploaded ${storageKey} data to R2 (version: ${versionWithPrefix})`,
      );
      console.log(`⏱️  Extraction took ${(extractDuration / 1000).toFixed(2)} seconds`);
    } catch (error) {
      console.error("❌ Extraction failed:", error);
      process.exit(1);
    }
  }
}
