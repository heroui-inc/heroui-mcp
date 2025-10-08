/**
 * Parser for HeroUI Native component markdown documentation
 */

import * as path from "path";

export interface PropDefinition {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface ComponentExample {
  name: string;
  code: string;
}

export interface NativeComponentDefinition {
  name: string;
  description: string;
  importStatement: string;
  anatomy?: string;
  props: Record<string, PropDefinition>;
  subComponents?: Record<
    string,
    {
      name: string;
      props: Record<string, PropDefinition>;
    }
  >;
  examples?: ComponentExample[];
}

interface ExampleItem {
  file: string;
}

export class NativeParser {
  private static readonly GITHUB_RAW_BASE_URL =
    "https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/alpha";
  private exampleRegistry: Record<string, ExampleItem> | null = null;

  /**
   * Parse a markdown file and extract component definition
   */
  async parseContent(content: string, filePath: string): Promise<NativeComponentDefinition | null> {
    try {
      const componentName = this.extractComponentName(content, filePath);
      const description = this.extractDescription(content);
      const importStatement = this.extractImportStatement(content);
      const anatomy = this.extractAnatomy(content);
      const props = this.extractProps(content, componentName);
      const subComponents = this.extractSubComponents(content, componentName);
      const examples = await this.extractExamples(componentName);

      return {
        name: componentName,
        description,
        importStatement,
        anatomy,
        props,
        subComponents,
        examples,
      };
    } catch (error) {
      console.error(`Failed to parse ${filePath}:`, error);

      return null;
    }
  }

  /**
   * Fetch example registry from GitHub API
   */
  async fetchExampleRegistry(): Promise<Record<string, ExampleItem>> {
    if (this.exampleRegistry) return this.exampleRegistry;

    try {
      const response = await fetch(
        "https://api.github.com/repos/heroui-inc/heroui-native/contents/example/src/app/(home)/components?ref=alpha",
      );
      const files = (await response.json()) as Array<{
        type: string;
        name: string;
      }>;

      const registry: Record<string, ExampleItem> = {};

      for (const file of files) {
        if (file.type === "file" && file.name.endsWith(".tsx")) {
          const componentName = file.name.replace(".tsx", "");
          registry[componentName] = {
            file: file.name,
          };
        }
      }

      this.exampleRegistry = registry;

      return registry;
    } catch (error) {
      console.warn("Failed to fetch example registry:", error);

      return {};
    }
  }

  /**
   * Fetch example content from GitHub
   */
  async fetchExampleContent(filePath: string): Promise<string | null> {
    try {
      const url = `${NativeParser.GITHUB_RAW_BASE_URL}/example/src/app/(home)/components/${filePath}`;
      const response = await fetch(url);
      if (!response.ok) return null;

      return await response.text();
    } catch (error) {
      console.warn(`Failed to fetch example content for ${filePath}:`, error);

      return null;
    }
  }

  private extractComponentName(content: string, filePath: string): string {
    // Try to get from H1 heading
    const match = content.match(/^#\s+(.+)$/m);
    if (match) {
      return match[1];
    }

    // Fallback to filename
    const filename = path.basename(filePath, ".md");

    return filename
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  }

  private extractDescription(content: string): string {
    // Get first non-heading paragraph after H1
    const lines = content.split("\n");
    let foundHeading = false;

    for (const line of lines) {
      if (line.startsWith("# ")) {
        foundHeading = true;
        continue;
      }
      if (foundHeading && line.trim() && !line.startsWith("#")) {
        return line.trim();
      }
    }

    return "";
  }

  private extractImportStatement(content: string): string {
    const match = content.match(/```tsx?\nimport\s+{[^}]+}\s+from\s+['"][^'"]+['"];?\n```/);
    if (match) {
      return match[0]
        .replace(/```tsx?\n/, "")
        .replace(/\n```/, "")
        .trim();
    }

    return "";
  }

  private extractAnatomy(content: string): string {
    const anatomySection = content.match(/##\s+Anatomy[\s\S]*?```tsx([\s\S]*?)```/);
    if (anatomySection) {
      return anatomySection[1].trim();
    }

    return "";
  }

  private extractProps(content: string, componentName: string): Record<string, PropDefinition> {
    const props: Record<string, PropDefinition> = {};

    // Find the main component's API Reference section
    const apiPattern = new RegExp(
      `###\\s+${componentName}[\\s\\S]*?\\|[^|]+\\|[^|]+\\|[^|]+\\|[\\s\\S]*?(?=###|$)`,
      "i",
    );
    const apiSection = content.match(apiPattern);

    if (apiSection) {
      // Parse the markdown table
      const tableRows = apiSection[0].split("\n").filter((line) => line.includes("|"));

      // Skip header and separator rows
      for (let i = 2; i < tableRows.length; i++) {
        const row = tableRows[i];

        // More careful parsing - split by | but keep track of positions
        // Remove leading and trailing | if present
        const cleanRow = row.replace(/^\s*\|/, "").replace(/\|\s*$/, "");

        // Split by | but need to be careful about | within backticks
        const cells: string[] = [];
        let currentCell = "";
        let inBackticks = false;

        for (let j = 0; j < cleanRow.length; j++) {
          const char = cleanRow[j];

          if (char === "`") {
            inBackticks = !inBackticks;
            currentCell += char;
          } else if (char === "|" && !inBackticks) {
            cells.push(currentCell.trim());
            currentCell = "";
          } else {
            currentCell += char;
          }
        }
        // Don't forget the last cell
        if (currentCell) {
          cells.push(currentCell.trim());
        }

        // We expect 4 columns: prop, type, default, description
        if (cells.length >= 4) {
          const name = cells[0].replace(/`/g, "");
          const type = cells[1].replace(/`/g, "");
          const defaultValue = cells[2] === "-" ? undefined : cells[2].replace(/`/g, "");
          const description = cells[3];

          // Skip spread props
          if (name.startsWith("...")) continue;

          const propDef: PropDefinition = {
            name,
            type,
            description,
          };

          // Only add default if it exists and is not '-'
          if (defaultValue) {
            propDef.default = defaultValue;
          }

          // Don't include 'required' field as it can't be reliably inferred from markdown

          props[name] = propDef;
        } else if (cells.length === 3) {
          // Fallback for tables with only 3 columns (prop, type, description)
          const name = cells[0].replace(/`/g, "");
          const type = cells[1].replace(/`/g, "");
          const description = cells[2];

          // Skip spread props
          if (name.startsWith("...")) continue;

          props[name] = {
            name,
            type,
            description,
          };
        }
      }
    }

    return props;
  }

  private extractSubComponents(
    content: string,
    componentName: string,
  ):
    | Record<
        string,
        {
          name: string;
          props: Record<string, PropDefinition>;
        }
      >
    | undefined {
    const subComponents: Record<
      string,
      {
        name: string;
        props: Record<string, PropDefinition>;
      }
    > = {};

    // Find all sub-component sections (e.g., Button.StartContent)
    const subComponentPattern = new RegExp(
      `###\\s+${componentName}\\.([\\w]+)[\\s\\S]*?\\|[^|]+\\|[^|]+\\|[^|]+\\|`,
      "gi",
    );
    const matches = content.matchAll(subComponentPattern);

    for (const match of matches) {
      const subName = match[1];
      const fullName = `${componentName}.${subName}`;
      const props = this.extractProps(content, fullName);

      if (Object.keys(props).length > 0) {
        subComponents[subName] = {
          name: fullName,
          props,
        };
      }
    }

    return Object.keys(subComponents).length > 0 ? subComponents : undefined;
  }

  /**
   * Convert component name to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()
      .replace(/^-/, "");
  }

  /**
   * Extract examples from registry with fuzzy matching
   */
  private async extractExamples(componentName: string): Promise<ComponentExample[]> {
    const examples: ComponentExample[] = [];
    const registry = await this.fetchExampleRegistry();
    const kebabName = this.toKebabCase(componentName);

    // Find all matching example files
    const matchingExamples = Object.entries(registry).filter(([exampleName]) => {
      // Exact match
      if (exampleName === kebabName) return true;
      // Starts with component name (e.g., "dialog" matches "dialog-native-modal")
      if (exampleName.startsWith(kebabName + "-")) return true;
      // Component name without common suffixes (e.g., "DropShadowView" -> "drop-shadow", "SkeletonGroup" -> "skeleton")
      const nameWithoutSuffix = kebabName.replace(/-view$|-component$|-element$|-group$/, "");
      if (exampleName === nameWithoutSuffix) return true;

      return false;
    });

    if (matchingExamples.length === 0) {
      console.warn(
        `⚠️  No example files found for component "${componentName}" (tried: ${kebabName})`,
      );

      return examples;
    }

    // Fetch all matching examples
    for (const [exampleName, exampleItem] of matchingExamples) {
      const exampleContent = await this.fetchExampleContent(exampleItem.file);
      if (exampleContent) {
        examples.push({
          name: exampleName,
          code: exampleContent,
        });
      }
    }

    if (examples.length > 0) {
      console.log(
        `      ✓ Found ${examples.length} example(s): ${examples.map((e) => e.name).join(", ")}`,
      );
    }

    return examples;
  }
}
