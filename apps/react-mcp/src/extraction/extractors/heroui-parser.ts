/**
 * HeroUI component documentation parser
 */

import type {ComponentDefinition, ComponentParser, ComponentSourceLinks} from "./components";

import * as path from "path";

export class HeroUIParser implements ComponentParser {
  async parseContent(content: string, filePath: string): Promise<ComponentDefinition | null> {
    const lines = content.split("\n");

    // Extract frontmatter
    const frontmatter = this.extractFrontmatter(lines);
    const componentName = frontmatter.title || this.getComponentName(path.basename(filePath));

    // Extract source links from frontmatter
    const links = this.extractSourceLinks(frontmatter);

    console.log(`   ✓ ${componentName}${links ? " (with links)" : ""}`);

    return {
      name: componentName,
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
}
