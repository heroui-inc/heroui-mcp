/**
 * Component extractor for HeroUI React components
 * Self-contained with all component extraction logic
 */

import type {ComponentDataset} from "../../shared/types/data";
import type {GitHubClient} from "../services/github-client";

import {SimpleGitHubClient} from "../services/github-client";
import {parseLlmsTxt} from "../utils/llms-parser";
import {findComponentFilePath} from "../utils/url-to-path";

import {BaseExtractor} from "./base";
import {HeroUIParser} from "./heroui-parser";

// Component-specific types
export interface ComponentSourceLinks {
  source?: string;
  styles?: string;
  [key: string]: string | undefined | boolean;
}

export interface ComponentDefinition {
  name: string;
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
    console.log("🔍 Extracting heroui-react from llms.txt...");
    console.log("📍 Repository: heroui-inc/heroui@v3");

    // Step 1: Fetch llms.txt
    const llmsResponse = await fetch("https://v3.heroui.com/react/llms.txt");
    if (!llmsResponse.ok) {
      throw new Error(`Failed to fetch llms.txt: ${llmsResponse.status}`);
    }
    const llmsContent = await llmsResponse.text();

    // Step 2: Parse component URLs
    const componentUrls = parseLlmsTxt(llmsContent);
    console.log(`📄 Found ${componentUrls.length} components in llms.txt`);

    // Step 3: Convert URLs to file paths and fetch
    const components: Record<string, ComponentDefinition> = {};
    const CONCURRENCY = process.env.GITHUB_TOKEN ? 10 : 3;
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const DELAY_MS = process.env.GITHUB_TOKEN ? 50 : 200;

    const processComponent = async (componentUrl: {
      title: string;
      url: string;
      description?: string;
      category?: string;
    }): Promise<void> => {
      try {
        // Extract component name from URL
        const componentName = componentUrl.url.split("/").pop() || componentUrl.title;

        // Find the actual file path (handles category folders)
        const filePath = await findComponentFilePath(this.github, componentUrl.url, componentName);

        if (!filePath) {
          console.log(`   ⚠️  File not found for ${componentName}`);

          return;
        }

        console.log(`   Processing ${componentName}...`);

        // Fetch and parse the file
        const content = await this.github.fetchFile("heroui-inc", "heroui", filePath, "v3");
        const component = await this.parser.parseContent(content, filePath);

        if (component && component.name) {
          components[component.name] = component;
        } else {
          console.log(`      ⚠️  (component name not found)`);
        }
      } catch (error) {
        console.log(`      ❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };

    // Process components in batches
    for (let i = 0; i < componentUrls.length; i += CONCURRENCY) {
      const batch = componentUrls.slice(i, i + CONCURRENCY);
      await Promise.allSettled(batch.map(processComponent));

      if (i + CONCURRENCY < componentUrls.length) {
        await delay(DELAY_MS);
      }
    }

    return {
      data: components as ComponentDataset,
    };
  }
}
