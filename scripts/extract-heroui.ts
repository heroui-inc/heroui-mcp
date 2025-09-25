#!/usr/bin/env node

/**
 * HeroUI GitHub extraction script
 * Fetches latest component documentation from GitHub and extracts component data
 */

import type {
  ComponentDefinition,
  ComponentParser,
  ExtractionConfig,
  PropDefinition,
} from "../src/services/base-extractor.js";

import * as path from "path";

import {BaseGitHubExtractor} from "../src/services/base-extractor.js";

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

  /**
   * Extract frontmatter from MDX file
   */
  private extractFrontmatter(lines: string[]): Record<string, string> {
    const frontmatter: Record<string, string> = {};
    let inFrontmatter = false;

    for (const line of lines) {
      if (line.trim() === "---") {
        if (!inFrontmatter) {
          inFrontmatter = true;
        } else {
          break;
        }
      } else if (inFrontmatter) {
        const match = line.match(/^(\w+):\s*(.+)$/);

        if (match) {
          frontmatter[match[1]] = match[2].trim();
        }
      }
    }

    return frontmatter;
  }

  /**
   * Extract import statement from documentation
   */
  private extractImportStatement(lines: string[]): string {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("## Import")) {
        // Look for the code block after the import section
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          if (lines[j].includes("import {") && lines[j].includes("@heroui")) {
            return lines[j].trim();
          }
        }
      }
    }

    return "";
  }

  /**
   * Extract props data from documentation
   */
  private extractPropsData(
    lines: string[],
    componentName: string,
  ): {
    props: Record<string, PropDefinition>;
    subComponents?: Record<string, {name: string; props: Record<string, PropDefinition>}>;
  } {
    const result: {
      props: Record<string, PropDefinition>;
      subComponents: Record<string, {name: string; props: Record<string, PropDefinition>}>;
    } = {
      props: {},
      subComponents: {},
    };

    let currentSection = "";
    let inPropsTable = false;
    let tableLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect props section headers
      if (line.match(/^###\s+(.+?)\s+Props$/)) {
        // If we were in a table, process it first
        if (inPropsTable && tableLines.length > 0) {
          const props = this.parsePropsTable(tableLines);

          this.assignPropsToSection(result, currentSection, componentName, props);
          tableLines = [];
        }

        const sectionMatch = line.match(/^###\s+(.+?)\s+Props$/);

        if (sectionMatch) {
          currentSection = sectionMatch[1];
          inPropsTable = false;
          tableLines = [];
        }
      }

      // Start of props table
      if (currentSection && line.match(/^\|\s*:?[-]+:?\s*(\|\s*:?[-]+:?\s*)*\|$/)) {
        inPropsTable = true;
        continue;
      }

      // Collect table lines
      if (inPropsTable && line.startsWith("|")) {
        tableLines.push(line);
      }

      // End of table (empty line or non-table content)
      if (inPropsTable && !line.startsWith("|")) {
        if (tableLines.length > 0) {
          const props = this.parsePropsTable(tableLines);

          this.assignPropsToSection(result, currentSection, componentName, props);

          inPropsTable = false;
          tableLines = [];
          currentSection = "";
        }
      }
    }

    // Handle any remaining table lines
    if (inPropsTable && tableLines.length > 0) {
      const props = this.parsePropsTable(tableLines);

      this.assignPropsToSection(result, currentSection, componentName, props);
    }

    return result;
  }

  /**
   * Helper method to assign props to the correct section
   */
  private assignPropsToSection(
    result: any,
    currentSection: string,
    componentName: string,
    props: Record<string, PropDefinition>,
  ): void {
    // Determine if this is the main component or a sub-component
    if (
      currentSection === componentName ||
      currentSection.toLowerCase() === componentName.toLowerCase() ||
      currentSection === `${componentName} Props`
    ) {
      result.props = props;
    } else {
      // It's a sub-component (e.g., Accordion.Item)
      let subComponentName = currentSection;

      // Remove component name prefix if present
      if (currentSection.startsWith(`${componentName}.`)) {
        subComponentName = currentSection.substring(componentName.length + 1);
      }

      result.subComponents[subComponentName] = {
        name: currentSection,
        props: props,
      };
    }
  }

  /**
   * Parse a markdown table row, handling escaped pipe characters correctly
   */
  private parseMarkdownTableRow(line: string): string[] {
    const parts: string[] = [];
    let currentPart = "";
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === "\\" && i + 1 < line.length && line[i + 1] === "|") {
        // Escaped pipe - add the literal pipe character
        currentPart += "|";
        i += 2; // Skip both the backslash and the pipe
      } else if (char === "|") {
        // Regular pipe - split here
        parts.push(currentPart.trim());
        currentPart = "";
        i++;
      } else {
        currentPart += char;
        i++;
      }
    }

    // Add the last part if there's content
    if (currentPart.trim()) {
      parts.push(currentPart.trim());
    }

    // Filter out empty parts
    return parts.filter((p) => p);
  }

  /**
   * Parse props table from markdown table lines
   */
  private parsePropsTable(tableLines: string[]): Record<string, PropDefinition> {
    const props: Record<string, PropDefinition> = {};

    for (const line of tableLines) {
      const parts = this.parseMarkdownTableRow(line);

      if (parts.length >= 4) {
        const [name, type, defaultValue, description] = parts;

        // Clean up the prop name (remove backticks)
        const cleanName = name.replace(/`/g, "");
        const cleanType = type.replace(/`/g, "");
        const cleanDefault = defaultValue.replace(/`/g, "");

        const propDef: PropDefinition = {
          description: description,
          name: cleanName,
          type: cleanType,
        };

        // Add default value if it exists (not '-' or empty)
        if (cleanDefault && cleanDefault !== "-" && cleanDefault !== "") {
          propDef.default = this.parseDefaultValue(cleanDefault);
        }

        props[cleanName] = propDef;
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

  /**
   * Extract code examples from documentation
   */
  private extractExamples(lines: string[]): string[] {
    const examples: string[] = [];
    let inCodeBlock = false;
    let codeLines: string[] = [];
    let codeType = "";

    for (const line of lines) {
      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeType = line.substring(3).trim();
          codeLines = [];
        } else {
          if ((codeType === "tsx" || codeType === "jsx") && codeLines.length > 0) {
            examples.push(codeLines.join("\n"));
          }
          inCodeBlock = false;
          codeType = "";
        }
      } else if (inCodeBlock) {
        codeLines.push(line);
      }
    }

    return examples;
  }

  /**
   * Get component name from file name
   */
  private getComponentName(fileName: string): string {
    const baseName = path.basename(fileName, ".mdx");

    // Convert kebab-case to PascalCase
    return baseName
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
  }
}

class HeroUIExtractor extends BaseGitHubExtractor {
  constructor(token?: string) {
    const config: ExtractionConfig = {
      branch: "v3",
      docsPath: "apps/docs/content/docs/components",
      outputLibraryName: "heroui",
      owner: "heroui-inc",
      repo: "heroui",
    };

    const parser = new HeroUIParser();

    super(config, parser, token);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  // Show help if requested
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: extract-heroui [--help]");
    console.log("");
    console.log("Extracts HeroUI component documentation from GitHub");
    console.log("");
    console.log("Environment variables:");
    console.log("  GITHUB_TOKEN  Optional GitHub token for higher rate limits");
    console.log("");
    console.log("Examples:");
    console.log("  pnpm run extract:heroui");
    console.log("  GITHUB_TOKEN=ghp_xxx pnpm run extract:heroui");
    process.exit(0);
  }

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.log("ℹ️  No GITHUB_TOKEN found. Using unauthenticated requests (60/hour limit)");
    console.log("   Set GITHUB_TOKEN environment variable for higher limits (5000/hour)");
  }

  const extractor = new HeroUIExtractor(token);

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
