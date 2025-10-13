/**
 * HeroUI component documentation parser
 */

import type {
  ComponentDefinition,
  ComponentExample,
  ComponentParser,
  ComponentSourceLinks,
  CssClass,
  PropDefinition,
} from "./components";

import * as path from "path";

interface DemoItem {
  component: unknown;
  file: string;
}

export class HeroUIParser implements ComponentParser {
  private static readonly GITHUB_RAW_BASE_URL =
    "https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3";
  private demoRegistry: Record<string, DemoItem> | null = null;

  async fetchDemoRegistry(): Promise<Record<string, DemoItem>> {
    if (this.demoRegistry) return this.demoRegistry;

    try {
      const response = await fetch(
        `${HeroUIParser.GITHUB_RAW_BASE_URL}/apps/docs/src/demos/index.ts`,
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
      const url = `${HeroUIParser.GITHUB_RAW_BASE_URL}/apps/docs/src/demos/${filePath}`;
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

    // Extract anatomy
    const anatomy = this.extractAnatomy(lines);

    // Extract examples
    const examples = await this.extractExamples(lines);

    // Extract CSS classes
    const cssClasses = this.extractCssClasses(lines);

    // Extract source links from frontmatter
    const links = this.extractSourceLinks(frontmatter);

    return {
      description,
      anatomy,
      examples,
      importStatement,
      name: componentName,
      props: propsData.props,
      subComponents: propsData.subComponents,
      cssClasses,
      links,
    };
  }

  private extractFrontmatter(lines: string[]): Record<string, any> {
    const frontmatter: Record<string, any> = {};
    let inFrontmatter = false;
    let currentIndent = 0;
    let currentObject: any = frontmatter;
    let objectStack: any[] = [];
    let keyStack: string[] = [];

    for (const line of lines) {
      if (line === "---") {
        if (inFrontmatter) break;
        inFrontmatter = true;
        continue;
      }

      if (inFrontmatter) {
        const indent = line.search(/\S/);
        if (indent === -1) continue; // Skip empty lines

        if (line.includes(":")) {
          const colonIndex = line.indexOf(":");
          const key = line.substring(indent, colonIndex).trim();
          const valueStr = line.substring(colonIndex + 1).trim();

          if (valueStr === "" || valueStr === null) {
            // This is a nested object
            const newObject: Record<string, any> = {};

            if (indent === 0) {
              frontmatter[key] = newObject;
              currentObject = newObject;
              objectStack = [frontmatter];
              keyStack = [key];
            } else {
              currentObject[key] = newObject;
              objectStack.push(currentObject);
              keyStack.push(key);
              currentObject = newObject;
            }
            currentIndent = indent;
          } else {
            // This is a key-value pair
            const value = valueStr.replace(/^["']|["']$/g, "");

            if (indent === 0) {
              frontmatter[key] = value;
            } else {
              // Nested value
              while (objectStack.length > 0 && indent <= currentIndent) {
                currentObject = objectStack.pop();
                keyStack.pop();
                currentIndent -= 2;
              }
              currentObject[key] = value === "true" ? true : value === "false" ? false : value;
            }
          }
        }
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

  private extractAnatomy(lines: string[]): string | undefined {
    let inAnatomySection = false;
    let inCodeBlock = false;
    const anatomyCodeLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for Anatomy section header
      if (line === "### Anatomy" || line === "## Anatomy") {
        inAnatomySection = true;
        continue;
      }

      // If we're in the anatomy section
      if (inAnatomySection) {
        // Check for end of anatomy section (next heading)
        if (line.startsWith("#") && !line.startsWith("###") && !line.startsWith("## Anatomy")) {
          break;
        }

        // Handle code blocks
        if (line.startsWith("```")) {
          if (!inCodeBlock) {
            inCodeBlock = true;
            // Skip the opening ```tsx or ```jsx line
            continue;
          } else {
            // End of code block, we're done
            inCodeBlock = false;
            break;
          }
        }

        // Collect only the code content (skip descriptive text)
        if (inCodeBlock) {
          anatomyCodeLines.push(line);
        }
      }
    }

    // Return the anatomy code if we found it
    if (anatomyCodeLines.length > 0) {
      return anatomyCodeLines.join("\n").trim();
    }

    return undefined;
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
              name: fullComponentName,
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

      // Skip separator line (more robust check)
      if (inPropsTable && /^\s*\|?\s*[-\s|]+\s*\|?\s*$/.test(line)) {
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
      // Skip separator lines (containing only dashes, pipes, and spaces)
      if (/^\s*\|?\s*[-\s|]+\s*\|?\s*$/.test(line)) {
        continue;
      }

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

        // Skip if name is empty, looks like a header, or is just dashes
        if (
          !name ||
          name.toLowerCase() === "prop" ||
          name.toLowerCase() === "attribute" ||
          name.toLowerCase() === "property" ||
          name.toLowerCase() === "name" ||
          /^-+$/.test(name)
        ) {
          continue;
        }

        // Get type - preserve union types with escaped pipes
        const type = parts[1]?.trim() || "any";

        // Skip if type is just dashes
        if (/^-+$/.test(type)) {
          continue;
        }

        // v3 format: Prop | Type | Default | Description
        let defaultValue = "";
        let description = "";

        if (parts.length === 4) {
          // Format: Prop | Type | Default | Description
          defaultValue = parts[2]?.trim() || "";
          // Remove dash for empty defaults
          if (defaultValue === "-" || /^-+$/.test(defaultValue)) defaultValue = "";
          description = parts[3]?.trim() || "";
          // Skip if description is just dashes
          if (/^-+$/.test(description)) description = "";
        } else if (parts.length === 3) {
          // Format might be: Prop | Type | Description (no default)
          const thirdPart = parts[2]?.trim() || "";
          // Check if third part looks like a description or default value
          if (!thirdPart.includes(" ") && thirdPart !== "-" && !thirdPart.match(/^-+$/)) {
            // Likely a default value
            defaultValue = thirdPart;
          } else {
            // Likely a description
            description = thirdPart;
            if (/^-+$/.test(description)) description = "";
          }
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

  private extractSourceLinks(frontmatter: Record<string, any>): ComponentSourceLinks | undefined {
    const links: ComponentSourceLinks = {};

    // Check if links object exists in frontmatter
    if (frontmatter.links && typeof frontmatter.links === "object") {
      const linksObj = frontmatter.links;
      if (linksObj.source) links.source = linksObj.source;
      if (linksObj.styles) links.styles = linksObj.styles;
    }

    return Object.keys(links).length > 0 ? links : undefined;
  }

  private extractCssClasses(lines: string[]): CssClass[] | undefined {
    const cssClasses: CssClass[] = [];
    let inCssSection = false;
    let inBaseClasses = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for CSS Classes section (case insensitive and flexible)
      // But skip if it's about "Passing Tailwind CSS classes"
      if (
        line.toLowerCase().includes("css classes") &&
        !line.toLowerCase().includes("passing") &&
        !line.toLowerCase().includes("tailwind") &&
        line.startsWith("#")
      ) {
        inCssSection = true;
        continue;
      }

      // Check for Base Classes subsection
      if (inCssSection && line.toLowerCase().includes("base classes") && line.startsWith("#")) {
        inBaseClasses = true;
        continue;
      }

      // Stop if we hit another section
      if (
        inCssSection &&
        line.startsWith("#") &&
        !line.toLowerCase().includes("base classes") &&
        !line.toLowerCase().includes("css classes")
      ) {
        break;
      }

      // Extract CSS class entries (looking for bullet points with class names)
      if (inBaseClasses && line.startsWith("- ")) {
        // Parse lines like: - `.kbd` - Base keyboard key styles with background, border, and spacing
        const classMatch = line.match(/^-\s*`\.([^`]+)`\s*-\s*(.*)$/);
        if (classMatch) {
          cssClasses.push({
            name: `.${classMatch[1]}`,
            description: classMatch[2].trim(),
          });
        }
      }
    }

    return cssClasses.length > 0 ? cssClasses : undefined;
  }
}
