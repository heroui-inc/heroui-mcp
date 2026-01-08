/**
 * Component extractor for HeroUI React components
 * Self-contained with all component extraction logic
 */

import type {ComponentDataset} from "../../shared/types/data";
import type {GitHubClient} from "../services/github-client";

import {SimpleGitHubClient} from "../services/github-client";

import {BaseExtractor} from "./base";
import {HeroUIParser} from "./heroui-parser";

// Component-specific types
export interface PropDefinition {
  name: string;
  type: string;
  default?: unknown;
  description: string;
}

export interface ComponentExample {
  name: string;
  content: string;
}

export interface CssClass {
  name: string;
  description: string;
}

export interface ComponentSourceLinks {
  source?: string;
  styles?: string;
  [key: string]: string | undefined | boolean;
}

export interface ComponentDefinition {
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
  cssClasses?: CssClass[];
  links?: ComponentSourceLinks;
}

export interface ComponentParser {
  parseContent(
    content: string,
    filePath: string,
  ): ComponentDefinition | null | Promise<ComponentDefinition | null>;
}

/**
 * Component extractor - extracts component documentation from GitHub
 */
export class ComponentExtractor extends BaseExtractor {
  private github: GitHubClient;
  private parser: ComponentParser;

  constructor() {
    super();
    this.github = new SimpleGitHubClient(process.env.GITHUB_TOKEN);
    this.parser = new HeroUIParser();
  }

  getStorageKey(): string {
    return "heroui-react";
  }

  getStorageType(): "components" | "theme" {
    return "components";
  }

  async extract(): Promise<{data: ComponentDataset}> {
    console.log("🔍 Extracting heroui-react from GitHub...");
    console.log("📍 Repository: heroui-inc/heroui@v3");

    // Get documentation files
    const docFiles = await this.github.getDocsFiles(
      "heroui-inc",
      "heroui",
      "apps/docs/content/docs/react/components",
      "v3",
    );

    console.log(`📄 Found ${docFiles.length} documentation files`);

    // Extract components
    const components: Record<string, ComponentDefinition> = {};

    // Process components in parallel with concurrency limit
    const CONCURRENCY = process.env.GITHUB_TOKEN ? 10 : 3;
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const DELAY_MS = process.env.GITHUB_TOKEN ? 50 : 200;

    const processFile = async (filePath: string): Promise<void> => {
      try {
        console.log(`   Processing ${filePath}...`);

        const content = await this.github.fetchFile("heroui-inc", "heroui", filePath, "v3");
        const component = await this.parser.parseContent(content, filePath);

        const hasMainProps = component && Object.keys(component.props).length > 0;
        const hasSubComponentProps =
          component?.subComponents && Object.keys(component.subComponents).length > 0;

        if (component && (hasMainProps || hasSubComponentProps)) {
          components[component.name] = component;

          if (hasMainProps && hasSubComponentProps) {
            console.log(
              `      ✓ ${component.name} (${Object.keys(component.props).length} props + ${Object.keys(component.subComponents || {}).length} sub-components)`,
            );
          } else if (hasMainProps) {
            console.log(`      ✓ ${component.name} (${Object.keys(component.props).length} props)`);
          } else if (hasSubComponentProps) {
            console.log(
              `      ✓ ${component.name} (${Object.keys(component.subComponents || {}).length} sub-components only)`,
            );
          }

          if (component.subComponents) {
            for (const [subName, subComp] of Object.entries(component.subComponents)) {
              console.log(
                `        ✓ ${component.name}.${subName} (${Object.keys(subComp.props).length} props)`,
              );
            }
          }
        } else {
          console.log("      ⚠️  (no props found)");
        }
      } catch (error) {
        console.log(`      ❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };

    // Process files in batches with concurrency limit
    for (let i = 0; i < docFiles.length; i += CONCURRENCY) {
      const batch = docFiles.slice(i, i + CONCURRENCY);
      await Promise.allSettled(batch.map(processFile));

      // Small delay between batches to avoid rate limiting
      if (i + CONCURRENCY < docFiles.length) {
        await delay(DELAY_MS);
      }
    }

    return {
      data: components as ComponentDataset,
    };
  }
}
