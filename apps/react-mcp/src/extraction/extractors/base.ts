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

  async run(): Promise<void> {
    const startTime = Date.now();
    console.log(`🚀 Starting ${this.getStorageKey()} extraction...`);

    try {
      const githubVersion = await this.getVersionFromGitHub();
      const versionWithPrefix = githubVersion.startsWith("v") ? githubVersion : `v${githubVersion}`;

      console.log(`📍 Version: ${versionWithPrefix}`);

      const storageType = this.getStorageType();

      console.log("🔄 Starting extraction from GitHub...");
      const {data} = await this.extract();

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
          const response = await fetch("https://v3.heroui.com/react/llms.txt");
          if (response.ok) {
            const content = await response.text();
            const {parseAllDocsFromLlmsTxt} = await import("../utils/llms-parser");
            const docUrls = parseAllDocsFromLlmsTxt(content);

            // Group by category
            const categoriesMap = new Map<
              string,
              Array<{title: string; path: string; description: string}>
            >();
            for (const docUrl of docUrls) {
              const category = docUrl.category || "General";
              if (!categoriesMap.has(category)) {
                categoriesMap.set(category, []);
              }
              const categoryDocs = categoriesMap.get(category)!;
              categoryDocs.push({
                title: docUrl.title,
                path: docUrl.url,
                description: docUrl.description || "",
              });
            }

            // Convert map to array format
            const categories = Array.from(categoriesMap.entries()).map(([name, docs]) => ({
              name,
              docs,
            }));

            await this.r2.uploadDocsPaths(categories);
            console.log(`✅ Uploaded docs paths to R2`);

            // Create and upload ctx.json with all initialization data
            console.log("🔄 Creating ctx.json...");
            const componentDataset = data as Record<string, {name: string}>;
            const componentList = Object.keys(componentDataset).sort();

            // Get themes (try to read from theme.json, fallback to default)
            let themes = ["default"];
            try {
              const themeData = await this.r2.readData<{themes: Record<string, unknown>}>(
                "react/latest/theme.json",
              );
              if (themeData && themeData.themes) {
                themes = Object.keys(themeData.themes);
              }
            } catch {
              // Use default themes if theme.json doesn't exist
            }

            // Get version
            const version = versionWithPrefix;

            // Create ctx data
            const ctxData = {
              components: componentList,
              themes,
              docs: {
                paths: categories.flatMap((cat) => cat.docs.map((doc) => doc.path)),
                categories,
              },
              version,
              timestamp: Date.now(),
            };

            await this.r2.uploadContext(ctxData);
            console.log(`✅ Uploaded ctx.json to R2`);
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
