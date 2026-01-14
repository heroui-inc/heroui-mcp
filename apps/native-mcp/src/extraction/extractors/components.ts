/**
 * Component extractor for HeroUI Native components
 */

import type {NativeComponentDefinition} from "./native-parser";

import {parseAllDocsFromLlmsTxt, parseLlmsTxt} from "../utils/llms-parser";

import {BaseExtractor} from "./base";
import {NativeParser} from "./native-parser";

export type {NativeComponentDefinition};
export type NativeComponentDataset = Record<string, NativeComponentDefinition>;

/**
 * Component extractor - extracts HeroUI Native component documentation from v3.heroui.com
 */
export class ComponentExtractor extends BaseExtractor {
  private parser: NativeParser;

  constructor() {
    super();
    this.parser = new NativeParser("beta");
  }

  getStorageKey(): string {
    return "heroui-native";
  }

  getStorageType(): "components" | "theme" {
    return "components";
  }

  async extract(ref: string = "beta"): Promise<{
    data: NativeComponentDataset;
    docsPaths?: {
      paths: string[];
      categories: Array<{
        name: string;
        docs: Array<{title: string; path: string; description: string}>;
      }>;
    };
  }> {
    console.log("🔍 Extracting HeroUI Native from llms.txt...");
    console.log(`📍 Fetching docs from v3.heroui.com`);

    // Update parser with the correct ref
    this.parser = new NativeParser(ref);

    // Step 1: Fetch llms.txt
    const llmsResponse = await fetch("https://v3.heroui.com/native/llms.txt");
    if (!llmsResponse.ok) {
      throw new Error(`Failed to fetch llms.txt: ${llmsResponse.status}`);
    }
    const llmsContent = await llmsResponse.text();

    // Step 2: Parse component URLs
    const componentUrls = parseLlmsTxt(llmsContent);
    console.log(`📄 Found ${componentUrls.length} components in llms.txt`);

    // Step 3: Fetch component docs from v3.heroui.com
    const components: NativeComponentDataset = {};
    const CONCURRENCY = 10; // Fetch from v3.heroui.com (no GitHub rate limits)
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const DELAY_MS = 50; // Small delay between batches

    const processComponent = async (componentUrl: {
      title: string;
      url: string;
      description?: string;
      category?: string;
    }): Promise<void> => {
      try {
        // Extract component name from URL
        const componentName = componentUrl.url.split("/").pop() || componentUrl.title;

        console.log(`   Processing ${componentName}...`);

        // Fetch component docs directly from v3.heroui.com
        const docUrl = `https://v3.heroui.com${componentUrl.url}.mdx`;
        const response = await fetch(docUrl);

        if (!response.ok) {
          console.log(`   ⚠️  File not found for ${componentName} at ${docUrl}`);

          return;
        }

        const content = await response.text();
        const component = await this.parser.parseContent(content, docUrl);

        if (component && component.name) {
          components[component.name] = component;
          if (component.links) {
            console.log(`      ✓ ${component.name} (links found)`);
          } else {
            console.log(`      ✓ ${component.name}`);
          }
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

    // Extract docs paths from llms.txt
    console.log("🔄 Extracting docs paths from llms.txt...");
    const docUrls = parseAllDocsFromLlmsTxt(llmsContent);

    // Group by category
    const categoriesMap = new Map<
      string,
      Array<{title: string; path: string; description: string}>
    >();
    for (const docUrl of docUrls) {
      const category = docUrl.category || "General";
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, []);
      }
      const categoryDocs = categoriesMap.get(category)!;
      categoryDocs.push({
        title: docUrl.title,
        path: docUrl.url,
        description: docUrl.description || "",
      });
    }

    // Convert map to array format
    const categories = Array.from(categoriesMap.entries()).map(([name, docs]) => ({
      name,
      docs,
    }));

    return {
      data: components,
      docsPaths: {
        paths: docUrls.map((doc) => doc.url),
        categories,
      },
    };
  }
}
