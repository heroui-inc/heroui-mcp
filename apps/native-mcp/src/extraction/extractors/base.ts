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
      console.error("Failed to fetch version from GitHub, using fallback");

      throw error;
    }
  }

  /**
   * Extract data from source
   */
  abstract extract(ref?: string): Promise<{data: any}>;

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

      console.log("🔄 Starting extraction from GitHub...");
      const {data} = await this.extract(this.githubRef);

      if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
        console.error("❌ No data extracted");
        process.exit(1);
      }

      if (storageType === "components" && typeof data === "object") {
        console.log(`📦 Extracted ${Object.keys(data).length} components`);
      } else if (storageType === "theme") {
        console.log(`📦 Extracted theme system`);
      }

      await this.r2.uploadLatestVersion(storageType, data);

      if (storageType === "components") {
        try {
          console.log("🔄 Fetching docs paths from llms.txt...");
          const response = await fetch("https://v3.heroui.com/native/llms.txt");
          if (response.ok) {
            const content = await response.text();
            const categories: any[] = [];
            let currentCategory: any = null;

            const lines = content.split("\n");
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine || trimmedLine === "# Docs") continue;

              if (trimmedLine.startsWith("## ")) {
                const categoryName = trimmedLine.substring(3).trim();
                currentCategory = {
                  name: categoryName,
                  docs: [],
                };
                categories.push(currentCategory);
              } else if (trimmedLine.startsWith("- ") && currentCategory) {
                const match = trimmedLine.match(/^- \[([^\]]+)\]\(([^)]+)\)(?:\s*:\s*(.+))?$/);
                if (match) {
                  const [, title, path, description = ""] = match;
                  if (path.startsWith("/docs/native/")) {
                    currentCategory.docs.push({
                      title,
                      path,
                      description,
                    });
                  }
                }
              }
            }

            await this.r2.uploadDocsPaths(categories);
            console.log(`✅ Uploaded docs paths to R2`);
          }
        } catch (error) {
          console.warn("⚠️  Failed to fetch/upload docs paths:", error);
        }
      }

      const metadata = ((await this.r2.getVersionMetadata()) as any) || {};
      const extractDuration = Date.now() - startTime;
      const storageKey = this.getStorageKey();

      metadata[storageKey] = {
        current: versionWithPrefix,
        lastExtracted: new Date().toISOString(),
        extractDuration,
      };
      await this.r2.updateVersionMetadata(metadata);

      console.log(`✅ Successfully uploaded ${storageKey} data to R2`);
      console.log(`⏱️  Extraction took ${(extractDuration / 1000).toFixed(2)} seconds`);
    } catch (error) {
      console.error("❌ Extraction failed:", error);
      process.exit(1);
    }
  }
}
