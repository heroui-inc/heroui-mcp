#!/usr/bin/env node

/**
 * HeroUI GitHub extraction script with R2 upload
 * Fetches latest component documentation from GitHub and uploads to R2
 */

import type {
  ComponentDefinition,
  ComponentExample,
  ComponentParser,
  PropDefinition,
} from "../lib/base-extractor";
import type {ComponentDataset} from "../src/types";

import * as path from "path";

import {BaseGitHubExtractor} from "../lib/base-extractor";
import {R2Uploader} from "../lib/r2-uploader";

interface DemoItem {
  component: unknown;
  file: string;
}

export class HeroUIParser implements ComponentParser {
  private demoRegistry: Record<string, DemoItem> | null = null;

  async fetchDemoRegistry(): Promise<Record<string, DemoItem>> {
    if (this.demoRegistry) return this.demoRegistry;

    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/src/demos/index.ts",
      );
      const content = await response.text();

      // Parse the demos object from the TypeScript file
      const demosMatch = content.match(
        /export const demos:\s*Record<string,\s*DemoItem>\s*=\s*{([\s\S]*?)};/,
      );
      if (!demosMatch) return {};

      const demosContent = demosMatch[1];
      const registry: Record<string, DemoItem> = {};

      // Parse each demo entry
      const demoPattern = /"([^"]+)":\s*{[^}]*file:\s*"([^"]+)"/g;
      let match;
      while ((match = demoPattern.exec(demosContent)) !== null) {
        registry[match[1]] = {
          component: undefined,
          file: match[2],
        };
      }

      this.demoRegistry = registry;

      return registry;
    } catch (error) {
      console.warn("Failed to fetch demo registry:", error);

      return {};
    }
  }

  async fetchDemoContent(filePath: string): Promise<string | null> {
    try {
      const url = `https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3/apps/docs/src/demos/${filePath}`;
      const response = await fetch(url);
      if (!response.ok) return null;

      return await response.text();
    } catch (error) {
      console.warn(`Failed to fetch demo content for ${filePath}:`, error);

      return null;
    }
  }

  async parseContent(content: string, filePath: string): Promise<ComponentDefinition | null> {
    const lines = content.split("\n");

    // Extract frontmatter
    const frontmatter = this.extractFrontmatter(lines);
    const componentName = frontmatter.title || this.getComponentName(path.basename(filePath));
    const description = frontmatter.description || "";

    // Extract import statement
    const importStatement = this.extractImportStatement(lines);

    // Extract props tables
    const propsData = this.extractPropsData(lines, componentName);

    if (!propsData.props || Object.keys(propsData.props).length === 0) {
      return null;
    }

    // Extract examples
    const examples = await this.extractExamples(lines);

    return {
      description,
      examples,
      importStatement,
      name: componentName,
      props: propsData.props,
      subComponents: propsData.subComponents,
    };
  }

  private extractFrontmatter(lines: string[]): Record<string, string> {
    const frontmatter: Record<string, string> = {};
    let inFrontmatter = false;

    for (const line of lines) {
      if (line === "---") {
        if (inFrontmatter) break;
        inFrontmatter = true;
        continue;
      }

      if (inFrontmatter && line.includes(":")) {
        const [key, ...valueParts] = line.split(":");
        const value = valueParts
          .join(":")
          .trim()
          .replace(/^["']|["']$/g, "");
        frontmatter[key.trim()] = value;
      }
    }

    return frontmatter;
  }

  private getComponentName(filename: string): string {
    return filename.replace(".mdx", "").replace(".md", "");
  }

  private extractImportStatement(lines: string[]): string {
    for (const line of lines) {
      if (line.includes("import") && line.includes("@heroui/react")) {
        return line.trim();
      }
    }

    return `import {Component} from "@heroui/react";`;
  }

  private extractPropsData(
    lines: string[],
    componentName: string,
  ): {
    props: Record<string, PropDefinition>;
    subComponents?: Record<string, {name: string; props: Record<string, PropDefinition>}>;
  } {
    const result: {
      props: Record<string, PropDefinition>;
      subComponents?: Record<string, {name: string; props: Record<string, PropDefinition>}>;
    } = {props: {}};

    let currentComponent = componentName;
    let inPropsTable = false;
    let tableLines: string[] = [];
    let inApiSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for API Reference section
      if (line === "## API Reference" || line === "## API") {
        inApiSection = true;
        continue;
      }

      // Check for component props sections within API section
      if (inApiSection && line.startsWith("### ")) {
        const match = line.match(/### ([\w.]+)\s*Props/i);
        if (match) {
          const fullComponentName = match[1];

          if (fullComponentName.includes(".")) {
            // Handle sub-components like Accordion.Item
            const parts = fullComponentName.split(".");
            const subComponentName = parts[1];
            if (!result.subComponents) result.subComponents = {};
            result.subComponents[subComponentName] = {
              name: subComponentName,
              props: {},
            };
            currentComponent = subComponentName;
          } else if (fullComponentName.toLowerCase() === componentName.toLowerCase()) {
            // Main component props
            currentComponent = componentName;
          } else {
            // Might be a related component, treat as main component
            currentComponent = componentName;
          }
        }
      }

      // Start of table - check for various header formats
      if (
        line.startsWith("| Prop") ||
        line.startsWith("| Attribute") ||
        line.startsWith("| Property") ||
        line.startsWith("| Name")
      ) {
        inPropsTable = true;
        tableLines = [];
        continue;
      }

      // Skip separator line
      if (inPropsTable && line.includes("|---")) {
        continue;
      }

      // End of table
      if (inPropsTable && (!line.startsWith("|") || line.trim() === "")) {
        const targetProps =
          currentComponent === componentName
            ? result.props
            : result.subComponents?.[currentComponent]?.props || result.props;

        this.parsePropsTable(tableLines, targetProps);
        inPropsTable = false;
        tableLines = [];
      }

      // Collect table lines
      if (inPropsTable && line.startsWith("|")) {
        tableLines.push(line);
      }
    }

    // Parse any remaining table lines
    if (tableLines.length > 0) {
      const targetProps =
        currentComponent === componentName
          ? result.props
          : result.subComponents?.[currentComponent]?.props || result.props;

      this.parsePropsTable(tableLines, targetProps);
    }

    return result;
  }

  private parsePropsTable(lines: string[], targetProps: Record<string, PropDefinition>): void {
    for (const line of lines) {
      // First, check if the line contains backticks with pipe characters (union types)
      // We need to handle these specially to avoid splitting them
      const backtickPattern = /`([^`]+)`/g;

      // Extract all backtick contents and replace with placeholders
      let match;
      let index = 0;
      const matches: Array<{original: string; placeholder: string; content: string}> = [];

      while ((match = backtickPattern.exec(line)) !== null) {
        const placeholder = `__BACKTICK_${index}__`;
        matches.push({
          original: match[0],
          placeholder,
          content: match[1],
        });
        index++;
      }

      // Replace all matches in the line
      let processedLine = line;
      for (const m of matches) {
        processedLine = processedLine.replace(m.original, m.placeholder);
      }

      // Now split by pipe
      const parts = processedLine
        .split("|")
        .map((p) => p.trim())
        .filter(Boolean);

      if (parts.length >= 3) {
        // Restore backtick contents
        for (let i = 0; i < parts.length; i++) {
          for (const m of matches) {
            parts[i] = parts[i].replace(m.placeholder, m.content);
          }
        }

        // Clean prop name
        const name = parts[0].trim();

        // Skip if name is empty or looks like a header
        if (!name || name.toLowerCase() === "prop" || name.toLowerCase() === "attribute") {
          continue;
        }

        // Get type - preserve union types with escaped pipes
        const type = parts[1]?.trim() || "any";

        // v3 format: Prop | Type | Default | Description
        let defaultValue = "";
        let description = "";

        if (parts.length === 4) {
          // Format: Prop | Type | Default | Description
          defaultValue = parts[2]?.trim() || "";
          // Remove dash for empty defaults
          if (defaultValue === "-") defaultValue = "";
          description = parts[3]?.trim() || "";
        } else if (parts.length === 3) {
          // Format might be: Prop | Type | Description (no default)
          description = parts[2]?.trim() || "";
        }

        targetProps[name] = {
          name,
          type: type.replace(/\\/g, ""), // Remove escape characters from the type
          description,
          ...(defaultValue &&
            defaultValue !== "" &&
            defaultValue !== "-" && {default: defaultValue}),
        };
      }
    }
  }

  private async extractExamples(lines: string[]): Promise<ComponentExample[]> {
    const examples: ComponentExample[] = [];
    const demoRegistry = await this.fetchDemoRegistry();

    // Find all ComponentPreview tags
    const componentPreviewPattern = /<ComponentPreview\s+name="([^"]+)"/g;
    const fullContent = lines.join("\n");
    let match;

    while ((match = componentPreviewPattern.exec(fullContent)) !== null) {
      const demoName = match[1];
      const demoItem = demoRegistry[demoName];

      if (demoItem && demoItem.file) {
        const content = await this.fetchDemoContent(demoItem.file);
        if (content) {
          examples.push({
            name: demoName,
            content: content,
          });
        }
      }
    }

    return examples;
  }
}

class HeroUIExtractor extends BaseGitHubExtractor {
  constructor(token?: string) {
    const parser = new HeroUIParser();
    super(
      {
        owner: "heroui-inc",
        repo: "heroui",
        branch: "v3",
        docsPath: "apps/docs/content/docs/components",
        outputLibraryName: "heroui",
      },
      parser,
      token,
    );
  }

  // Override to get version from the correct package.json location in monorepo
  async extract(): Promise<{data: ComponentDataset; version: string}> {
    // Get the version from packages/react/package.json instead of root
    try {
      const packageJson = await this.github.fetchFile(
        this.config.owner,
        this.config.repo,
        "packages/react/package.json",
        this.config.branch,
      );
      const parsed = JSON.parse(packageJson);
      const correctVersion = parsed.version;

      // Temporarily override getPackageVersion
      const originalGetVersion = this.github.getPackageVersion.bind(this.github);
      this.github.getPackageVersion = async () => correctVersion;

      // Run the extraction with the correct version
      const result = await super.extract();

      // Restore original method
      this.github.getPackageVersion = originalGetVersion;

      return result;
    } catch (error) {
      console.warn(
        "Could not fetch version from packages/react/package.json, falling back to root",
      );

      return super.extract();
    }
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting HeroUI component extraction for R2...");

  // Check for required environment variables
  const r2Config = {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    bucketName: process.env.R2_BUCKET_NAME || "heroui-mcp-data",
  };

  if (!r2Config.accountId || !r2Config.accessKeyId || !r2Config.secretAccessKey) {
    console.error("❌ Missing required R2 credentials in environment variables");
    console.error("   Required: CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
    process.exit(1);
  }

  const forceExtract = process.argv.includes("--force");
  const specificVersion = process.argv.find((arg) => arg.startsWith("--version="))?.split("=")[1];

  try {
    const extractor = new HeroUIExtractor(process.env.GITHUB_TOKEN);
    const r2Uploader = new R2Uploader(r2Config);

    // Get current metadata from R2
    const metadata = ((await r2Uploader.getVersionMetadata()) as any) || {};

    // Extract components
    const startTime = Date.now();
    const result = await extractor.extract();
    const extractDuration = Date.now() - startTime;

    if (!result.data || Object.keys(result.data).length === 0) {
      console.error("❌ No components extracted");
      process.exit(1);
    }

    const version = specificVersion || result.version;
    const versionWithPrefix = version.startsWith("v") ? version : `v${version}`;

    // Check if version already exists (unless forced)
    if (!forceExtract) {
      const exists = await r2Uploader.versionExists("heroui", versionWithPrefix);
      if (exists) {
        console.log(
          `ℹ️  Version ${versionWithPrefix} already exists in R2. Use --force to overwrite.`,
        );

        return;
      }
    }

    console.log(
      `📦 Extracted ${Object.keys(result.data).length} components for version ${versionWithPrefix}`,
    );

    // Upload versioned data
    await r2Uploader.uploadComponentData("heroui", versionWithPrefix, result.data);

    // Upload as latest
    await r2Uploader.uploadLatestVersion("heroui", result.data);

    // Update metadata
    metadata.heroui = {
      current: versionWithPrefix,
      lastExtracted: new Date().toISOString(),
      extractDuration,
    };
    await r2Uploader.updateVersionMetadata(metadata);

    console.log(`✅ Successfully uploaded HeroUI data to R2 (version: ${versionWithPrefix})`);
    console.log(`⏱️  Extraction took ${(extractDuration / 1000).toFixed(2)} seconds`);
  } catch (error) {
    console.error("❌ Extraction failed:", error);
    process.exit(1);
  }
}

// Handle --help
if (process.argv.includes("--help")) {
  console.log(`Usage: extract-heroui-r2 [--force] [--version=VERSION]

Extracts HeroUI component documentation from GitHub and uploads to R2

Options:
  --force           Force re-extraction even if version exists
  --version=VERSION Extract specific version

Environment variables:
  GITHUB_TOKEN              GitHub personal access token (optional, for rate limits)
  CLOUDFLARE_ACCOUNT_ID     Cloudflare account ID (required)
  R2_ACCESS_KEY_ID          R2 access key ID (required)
  R2_SECRET_ACCESS_KEY      R2 secret access key (required)
  R2_BUCKET_NAME            R2 bucket name (default: heroui-mcp-data)
`);
  process.exit(0);
}

main().catch(console.error);
