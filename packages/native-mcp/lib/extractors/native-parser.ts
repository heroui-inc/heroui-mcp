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

export class NativeParser {
  /**
   * Parse a markdown file and extract component definition
   */
  parseContent(content: string, filePath: string): NativeComponentDefinition | null {
    try {
      const componentName = this.extractComponentName(content, filePath);
      const description = this.extractDescription(content);
      const importStatement = this.extractImportStatement(content);
      const anatomy = this.extractAnatomy(content);
      const props = this.extractProps(content, componentName);
      const subComponents = this.extractSubComponents(content, componentName);
      const examples = this.extractExamples(content);

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

  private extractExamples(content: string): ComponentExample[] {
    const examples: ComponentExample[] = [];

    // Find example section
    const exampleSection = content.match(/##\s+Example[\s\S]*?```tsx([\s\S]*?)```/);
    if (exampleSection) {
      examples.push({
        name: "main",
        code: exampleSection[1].trim(),
      });
    }

    // Find usage examples
    const usageMatches = content.matchAll(/###\s+([^#\n]+)[\s\S]*?```tsx([\s\S]*?)```/g);
    for (const match of usageMatches) {
      const name = match[1].trim().toLowerCase().replace(/\s+/g, "-");
      if (name !== "example" && !name.includes("import")) {
        examples.push({
          name,
          code: match[2].trim(),
        });
      }
    }

    return examples;
  }
}
