#!/usr/bin/env node

/**
 * HeroUI Native GitHub extraction script with R2 upload
 * Fetches latest component documentation from GitHub and uploads to R2
 */

import type {
  ComponentDefinition,
  ComponentExample,
  ComponentParser,
  PropDefinition,
} from "../lib/base-extractor";

import {BaseGitHubExtractor} from "../lib/base-extractor";
import {R2Uploader} from "../lib/r2-uploader";

class HeroUINativeParser implements ComponentParser {
  parseContent(content: string): ComponentDefinition | null {
    const lines = content.split("\n");

    // Extract component name from H1
    const componentName = this.extractComponentName(lines);

    if (!componentName) {
      return null;
    }

    // Extract description
    const description = this.extractDescription(lines);

    // Extract import statement
    const importStatement = this.extractImportStatement(lines, componentName);

    // Extract props
    const props = this.extractProps(lines);

    if (Object.keys(props).length === 0) {
      return null;
    }

    return {
      description,
      examples: this.extractExamples(lines) as unknown as ComponentExample[],
      importStatement,
      name: componentName,
      props,
    };
  }

  private extractComponentName(lines: string[]): string | null {
    for (const line of lines) {
      if (line.startsWith("# ")) {
        return line.replace("# ", "").trim();
      }
    }

    return null;
  }

  private extractDescription(lines: string[]): string {
    const descLines: string[] = [];
    let foundH1 = false;
    let foundNextSection = false;

    for (const line of lines) {
      if (line.startsWith("# ")) {
        foundH1 = true;
        continue;
      }

      if (foundH1 && !foundNextSection) {
        if (line.startsWith("## ")) {
          foundNextSection = true;
          break;
        }
        if (line.trim()) {
          descLines.push(line);
        }
      }
    }

    return descLines.join(" ").trim();
  }

  private extractImportStatement(lines: string[], componentName: string): string {
    for (const line of lines) {
      if (line.includes("import") && line.includes("heroui-native")) {
        return line.trim();
      }
    }

    return `import {${componentName}} from 'heroui-native';`;
  }

  private extractProps(lines: string[]): Record<string, PropDefinition> {
    const props: Record<string, PropDefinition> = {};
    let inApiSection = false;
    let inTable = false;
    let tableLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for API Reference section
      if (line === "## API Reference" || line === "## Props" || line === "## Properties") {
        inApiSection = true;
        continue;
      }

      // End API section if we hit another major section (## )
      if (
        inApiSection &&
        line.startsWith("## ") &&
        !line.includes("API") &&
        !line.includes("Props")
      ) {
        inApiSection = false;
        inTable = false;
      }

      if (inApiSection) {
        // Start of table - check for various formats (prop, Prop, Name)
        if (line.startsWith("| prop") || line.startsWith("| Prop") || line.startsWith("| Name")) {
          inTable = true;
          tableLines = [];
          continue;
        }

        // Skip separator line
        if ((inTable && line.includes("|---")) || line.includes("| ---")) {
          continue;
        }

        // Table content
        if (inTable && line.startsWith("|")) {
          tableLines.push(line);
        }

        // End of table - when we hit a non-table line or a header
        if (
          inTable &&
          (!line.startsWith("|") || line.startsWith("###") || line.startsWith("####"))
        ) {
          this.parseTableLines(tableLines, props);
          inTable = false;
          tableLines = [];
        }
      }
    }

    // Process remaining table lines
    if (tableLines.length > 0) {
      this.parseTableLines(tableLines, props);
    }

    return props;
  }

  private parseTableLines(lines: string[], props: Record<string, PropDefinition>): void {
    for (const line of lines) {
      const parts = line
        .split("|")
        .map((p) => p.trim())
        .filter(Boolean);

      if (parts.length >= 3) {
        // Clean prop name - remove backticks
        const name = parts[0].replace(/[`'"]/g, "").trim();

        // Skip if name is empty or looks like a header
        if (
          !name ||
          name.toLowerCase() === "prop" ||
          name.includes("---") ||
          name.includes("...")
        ) {
          continue;
        }

        // Clean type - remove backticks and quotes
        const type = parts[1]?.replace(/[`'"]/g, "").trim() || "any";

        // Format: prop | type | default | description
        let defaultValue = "";
        let description = "";

        if (parts.length === 4) {
          // Standard format: prop | type | default | description
          defaultValue = parts[2]?.replace(/[`'"]/g, "").trim() || "";
          description = parts[3]?.trim() || "";
        } else if (parts.length === 3) {
          // Might be: prop | type | description (no default)
          // Check if third column looks like a default value (short, code-like)
          const thirdCol = parts[2]?.trim() || "";
          if (thirdCol.length < 20 && (thirdCol === "-" || thirdCol.includes("`"))) {
            defaultValue = thirdCol.replace(/[`'"]/g, "").trim();
          } else {
            description = thirdCol;
          }
        }

        // Clean up default value
        if (defaultValue === "-" || defaultValue === "undefined") {
          defaultValue = "";
        }

        props[name] = {
          name,
          type,
          description,
          ...(defaultValue && defaultValue !== "" && {default: defaultValue}),
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
          if (["jsx", "tsx", "javascript", "typescript", "js", "ts"].includes(codeBlockLang)) {
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

class HeroUINativeExtractor extends BaseGitHubExtractor {
  constructor(token?: string) {
    super(
      {
        owner: "heroui-inc",
        repo: "heroui-native",
        branch: "alpha",
        docsPath: "src/components",
        outputLibraryName: "native",
      },
      new HeroUINativeParser(),
      token,
    );
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting HeroUI Native component extraction for R2...");

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
  const versionArg = process.argv.find((arg) => arg.startsWith("--version="))?.split("=")[1];
  // Filter out invalid version values like "true" or "false"
  const specificVersion =
    versionArg && versionArg !== "true" && versionArg !== "false" ? versionArg : undefined;

  try {
    const extractor = new HeroUINativeExtractor(process.env.GITHUB_TOKEN);
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
      const exists = await r2Uploader.versionExists("native", versionWithPrefix);
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
    await r2Uploader.uploadComponentData("native", versionWithPrefix, result.data);

    // Upload as latest
    await r2Uploader.uploadLatestVersion("native", result.data);

    // Update metadata
    metadata.native = {
      current: versionWithPrefix,
      lastExtracted: new Date().toISOString(),
      extractDuration,
    };
    await r2Uploader.updateVersionMetadata(metadata);

    console.log(
      `✅ Successfully uploaded HeroUI Native data to R2 (version: ${versionWithPrefix})`,
    );
    console.log(`⏱️  Extraction took ${(extractDuration / 1000).toFixed(2)} seconds`);
  } catch (error) {
    console.error("❌ Extraction failed:", error);
    process.exit(1);
  }
}

// Handle --help
if (process.argv.includes("--help")) {
  console.log(`Usage: extract-native-r2 [--force] [--version=VERSION]

Extracts HeroUI Native component documentation from GitHub and uploads to R2

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
