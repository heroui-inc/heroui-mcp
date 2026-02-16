/**
 * Parser for HeroUI Native component markdown documentation
 * Simplified to only extract name and links from frontmatter
 */

import * as path from "path";

import {HEROUI_NATIVE_TARGET_BRANCH} from "../constants";

export interface NativeComponentDefinition {
  name: string;
  links?: {
    source?: string;
    styles?: string;
  };
}

export class NativeParser {
  private readonly githubRef: string;

  constructor(ref: string = HEROUI_NATIVE_TARGET_BRANCH) {
    this.githubRef = ref;
  }

  /**
   * Parse a markdown file and extract component definition
   * Only extracts name and links from frontmatter
   */
  async parseContent(content: string, filePath: string): Promise<NativeComponentDefinition | null> {
    try {
      const componentName = this.extractComponentName(content, filePath);
      const links = this.extractLinks(content);

      return {
        name: componentName,
        links,
      };
    } catch (error) {
      console.error(`Failed to parse ${filePath}:`, error);

      return null;
    }
  }

  private extractComponentName(content: string, filePath: string): string {
    // Try to get from frontmatter title
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const titleMatch = frontmatterMatch[1].match(/^title:\s*(.+)$/m);
      if (titleMatch) {
        return titleMatch[1].trim();
      }
    }

    // Try to get from H1 heading
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      return h1Match[1].trim();
    }

    // Fallback to filename
    const filename = path.basename(filePath, ".md");

    return filename
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  }

  private extractLinks(content: string): {source?: string; styles?: string} | undefined {
    const links: {source?: string; styles?: string} = {};

    // Try to get from frontmatter
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];

      // Look for links section
      const linksMatch = frontmatter.match(/^links:\s*\n([\s\S]*?)(?=\n\w|\n---|$)/m);
      if (linksMatch) {
        const linksContent = linksMatch[1];
        const sourceMatch = linksContent.match(/^\s*source:\s*(.+)$/m);
        const stylesMatch = linksContent.match(/^\s*styles:\s*(.+)$/m);

        if (sourceMatch) {
          links.source = sourceMatch[1].trim().replace(/^["']|["']$/g, "");
        }
        if (stylesMatch) {
          links.styles = stylesMatch[1].trim().replace(/^["']|["']$/g, "");
        }
      }
    }

    return Object.keys(links).length > 0 ? links : undefined;
  }
}
