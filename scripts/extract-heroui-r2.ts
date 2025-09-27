#!/usr/bin/env node

/**
 * HeroUI GitHub extraction script with R2 upload
 * Fetches latest component documentation from GitHub and uploads to R2
 */

import type {
  ComponentDefinition,
  ComponentParser,
  ExtractionConfig,
  PropDefinition,
} from "../lib/base-extractor.js";

import * as path from "path";

import {BaseGitHubExtractor} from "../lib/base-extractor.js";
import {R2Uploader} from "../lib/r2-uploader.js";

class HeroUIParser implements ComponentParser {
  parseContent(content: string, filePath: string): ComponentDefinition | null {
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

    return {
      description,
      examples: this.extractExamples(lines),
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

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for component props sections
      if (line.startsWith("### ") && line.toLowerCase().includes("props")) {
        const match = line.match(/### ([\w]+) Props/i);
        if (match) {
          currentComponent = match[1];
          if (currentComponent !== componentName) {
            if (!result.subComponents) result.subComponents = {};
            result.subComponents[currentComponent] = {
              name: currentComponent,
              props: {},
            };
          }
        }
      }

      // Start of table
      if (line.startsWith("| Attribute") || line.startsWith("| Property")) {
        inPropsTable = true;
        tableLines = [];
        continue;
      }

      // End of table
      if (inPropsTable && (!line.startsWith("|") || line.trim() === "")) {
        this.parsePropsTable(
          tableLines,
          currentComponent === componentName
            ? result.props
            : result.subComponents?.[currentComponent]?.props || {},
        );
        inPropsTable = false;
        tableLines = [];
      }

      // Collect table lines
      if (inPropsTable && line.startsWith("|") && !line.includes("---")) {
        tableLines.push(line);
      }
    }

    return result;
  }

  private parsePropsTable(lines: string[], targetProps: Record<string, PropDefinition>): void {
    for (const line of lines) {
      const parts = line
        .split("|")
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length >= 3) {
        const name = parts[0].replace(/`/g, "");
        const type = parts[1].replace(/`/g, "");
        const description = parts[2] || "";
        const defaultValue = parts[3]?.replace(/`/g, "").replace("-", "").trim();

        targetProps[name] = {
          name,
          type,
          description,
          ...(defaultValue && {default: defaultValue}),
        };
      }
    }
  }

  private extractExamples(lines: string[]): string[] {
    const examples: string[] = [];
    let inCodeBlock = false;
    let currentExample = "";
    let codeBlockLang = "";

    for (const line of lines) {
      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = line.replace("```", "").trim();
        } else {
          if (["jsx", "tsx", "javascript", "typescript"].includes(codeBlockLang)) {
            examples.push(currentExample.trim());
          }
          inCodeBlock = false;
          currentExample = "";
          codeBlockLang = "";
        }
      } else if (inCodeBlock) {
        currentExample += line + "\n";
      }
    }

    return examples;
  }
}

class HeroUIExtractor extends BaseGitHubExtractor {
  constructor(token?: string) {
    super(
      {
        owner: "heroui-inc",
        repo: "heroui",
        branch: "main",
        docsPath: "apps/docs/content/docs/components",
        outputLibraryName: "heroui",
      },
      new HeroUIParser(),
      token,
    );
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
