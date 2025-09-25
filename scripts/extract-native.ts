#!/usr/bin/env node

/**
 * HeroUI Native GitHub extraction script
 * Fetches latest component documentation from GitHub and extracts component data
 */

import type {
  ComponentDefinition,
  ComponentParser,
  ExtractionConfig,
  PropDefinition,
} from "../src/services/base-extractor.js";

import {BaseGitHubExtractor} from "../src/services/base-extractor.js";

class HeroUINativeParser implements ComponentParser {
  parseContent(content: string): ComponentDefinition | null {
    const lines = content.split("\n");

    // Extract component name from H1
    const componentName = this.extractComponentName(lines);

    if (!componentName) return null;

    // Extract description
    const description = this.extractDescription(lines);

    // Extract import statement
    const importStatement = this.extractImportStatement(lines);

    // Extract props data
    const propsData = this.extractPropsData(lines, componentName);

    return {
      description,
      importStatement,
      name: componentName,
      props: propsData.props,
      subComponents:
        Object.keys(propsData.subComponents).length > 0 ? propsData.subComponents : undefined,
    };
  }

  private extractComponentName(lines: string[]): string {
    for (const line of lines) {
      if (line.startsWith("# ")) {
        return line.substring(2).trim();
      }
    }

    return "";
  }

  private extractDescription(lines: string[]): string {
    let foundH1 = false;

    for (const line of lines) {
      if (line.startsWith("# ")) {
        foundH1 = true;
        continue;
      }
      if (foundH1 && line.trim() && !line.startsWith("#")) {
        return line.trim();
      }
      if (foundH1 && line.startsWith("##")) {
        break;
      }
    }

    return "";
  }

  private extractImportStatement(lines: string[]): string {
    let inImportSection = false;
    let inCodeBlock = false;

    for (const line of lines) {
      if (line.includes("## Imports")) {
        inImportSection = true;
        continue;
      }

      if (inImportSection) {
        if (line.startsWith("```")) {
          if (!inCodeBlock) {
            inCodeBlock = true;
          } else {
            break;
          }
        } else if (inCodeBlock && line.includes("import") && line.includes("heroui-native")) {
          return line.trim();
        }
      }

      if (inImportSection && line.startsWith("##") && !line.includes("Imports")) {
        break;
      }
    }

    return "";
  }

  private extractPropsData(
    lines: string[],
    componentName: string,
  ): {
    props: Record<string, PropDefinition>;
    subComponents: Record<string, {name: string; props: Record<string, PropDefinition>}>;
  } {
    const result: {
      props: Record<string, PropDefinition>;
      subComponents: Record<string, {name: string; props: Record<string, PropDefinition>}>;
    } = {
      props: {},
      subComponents: {},
    };

    let inApiSection = false;
    let currentComponent = "";
    let inTable = false;
    let tableLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for API Reference section
      if (line === "## API Reference") {
        inApiSection = true;
        continue;
      }

      if (!inApiSection) continue;

      // Check for component sections (### headers)
      if (line.startsWith("### ")) {
        // Process any existing table
        if (inTable && tableLines.length > 0) {
          const props = this.parsePropsTable(tableLines);

          this.assignPropsToComponent(result, currentComponent, componentName, props);
          tableLines = [];
          inTable = false;
        }

        currentComponent = line.substring(4).trim();
        continue;
      }

      // Check for table start
      if (line.includes("| prop") && line.includes("| type") && line.includes("| description")) {
        inTable = true;
        continue;
      }

      // Skip table separator
      if (inTable && line.match(/^\|\s*:?[-]+:?\s*(\|\s*:?[-]+:?\s*)*\|$/)) {
        continue;
      }

      // Collect table rows
      if (inTable && line.startsWith("|")) {
        tableLines.push(line);
      }

      // End of table
      if (inTable && !line.startsWith("|")) {
        if (tableLines.length > 0) {
          const props = this.parsePropsTable(tableLines);

          this.assignPropsToComponent(result, currentComponent, componentName, props);
          tableLines = [];
          inTable = false;
          currentComponent = "";
        }
      }

      // End of API section
      if (inApiSection && line.startsWith("## ") && !line.includes("API Reference")) {
        break;
      }
    }

    // Process any remaining table
    if (inTable && tableLines.length > 0) {
      const props = this.parsePropsTable(tableLines);

      this.assignPropsToComponent(result, currentComponent, componentName, props);
    }

    return result;
  }

  private parsePropsTable(tableLines: string[]): Record<string, PropDefinition> {
    const props: Record<string, PropDefinition> = {};

    for (const line of tableLines) {
      const parts = line
        .split("|")
        .map((p) => p.trim())
        .filter((p) => p);

      // Skip separator lines (lines with only dashes)
      if (parts.length > 0 && parts[0].match(/^-+$/)) {
        continue;
      }

      // Native docs can have either 3 or 4 columns
      // 3 columns: prop | type | description (e.g., Button)
      // 4 columns: prop | type | default | description (e.g., Accordion)

      if (parts.length === 4) {
        // 4-column format with default value
        const [name, type, defaultValue, description] = parts;

        // Clean up backticks
        const cleanName = name.replace(/`/g, "");
        const cleanType = type.replace(/`/g, "");
        const cleanDefault = defaultValue.replace(/`/g, "");
        const cleanDescription = description ? description.replace(/`/g, "") : "";

        const propDef: PropDefinition = {
          description: cleanDescription,
          name: cleanName,
          type: cleanType,
        };

        // Add default value if it exists (not '-' or empty)
        if (cleanDefault && cleanDefault !== "-" && cleanDefault !== "") {
          propDef.default = this.parseDefaultValue(cleanDefault);
        }

        props[cleanName] = propDef;
      } else if (parts.length === 3) {
        // 3-column format without default value
        const [name, type, description] = parts;

        // Clean up backticks
        const cleanName = name.replace(/`/g, "");
        const cleanType = type.replace(/`/g, "");
        const cleanDescription = description ? description.replace(/`/g, "") : "";

        props[cleanName] = {
          description: cleanDescription,
          name: cleanName,
          type: cleanType,
        };
      }
    }

    return props;
  }

  private parseDefaultValue(value: string): any {
    // Handle boolean values
    if (value === "true") return true;
    if (value === "false") return false;

    // Handle null/undefined
    if (value === "null") return null;
    if (value === "undefined") return undefined;

    // Handle numbers
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return parseFloat(value);
    }

    // Handle arrays (basic)
    if (value.startsWith("[") && value.endsWith("]")) {
      try {
        return JSON.parse(value);
      } catch {
        return value; // Return as string if not valid JSON
      }
    }

    // Handle objects (basic)
    if (value.startsWith("{") && value.endsWith("}")) {
      try {
        return JSON.parse(value);
      } catch {
        return value; // Return as string if not valid JSON
      }
    }

    // Remove quotes if present and return as string
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      return value.slice(1, -1);
    }

    return value;
  }

  private assignPropsToComponent(
    result: any,
    currentComponent: string,
    mainComponentName: string,
    props: Record<string, PropDefinition>,
  ): void {
    if (currentComponent === mainComponentName) {
      // Main component props
      result.props = props;
    } else if (currentComponent.startsWith(`${mainComponentName}.`)) {
      // Sub-component props
      const subComponentName = currentComponent.substring(mainComponentName.length + 1);

      result.subComponents[subComponentName] = {
        name: currentComponent,
        props: props,
      };
    } else if (currentComponent) {
      // Could be a type definition or other section, store as sub-component
      result.subComponents[currentComponent] = {
        name: currentComponent,
        props: props,
      };
    }
  }
}

class HeroUINativeExtractor extends BaseGitHubExtractor {
  constructor(token?: string) {
    const config: ExtractionConfig = {
      branch: "alpha",
      docsPath: "src/components",
      outputLibraryName: "native",
      owner: "heroui-inc",
      repo: "heroui-native",
    };

    const parser = new HeroUINativeParser();

    super(config, parser, token);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  // Show help if requested
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: extract-native [--help]");
    console.log("");
    console.log("Extracts HeroUI Native component documentation from GitHub");
    console.log("");
    console.log("Environment variables:");
    console.log("  GITHUB_TOKEN  Optional GitHub token for higher rate limits");
    console.log("");
    console.log("Examples:");
    console.log("  pnpm run extract:native");
    console.log("  GITHUB_TOKEN=ghp_xxx pnpm run extract:native");
    process.exit(0);
  }

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.log("ℹ️  No GITHUB_TOKEN found. Using unauthenticated requests (60/hour limit)");
    console.log("   Set GITHUB_TOKEN environment variable for higher limits (5000/hour)");
  }

  const extractor = new HeroUINativeExtractor(token);

  try {
    await extractor.extract();
    process.exit(0);
  } catch (error) {
    console.error("❌ Extraction failed:", error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
