/**
 * Component extractor for HeroUI Native components
 */

import type {NativeComponentDefinition} from "./native-parser";
import type {GitHubClient} from "../services/github-client";

import {SimpleGitHubClient} from "../services/github-client";

import {BaseExtractor} from "./base";
import {NativeParser} from "./native-parser";

export type {NativeComponentDefinition};
export type NativeComponentDataset = Record<string, NativeComponentDefinition>;

/**
 * Component extractor - extracts Native component documentation from GitHub
 */
export class ComponentExtractor extends BaseExtractor {
  private github: GitHubClient;
  private parser: NativeParser;

  constructor() {
    super();
    this.github = new SimpleGitHubClient(process.env.GITHUB_TOKEN);
    this.parser = new NativeParser("beta");
  }

  getStorageKey(): string {
    return "heroui-native";
  }

  getStorageType(): "components" | "theme" {
    return "components";
  }

  async extract(ref: string = "beta"): Promise<{data: NativeComponentDataset}> {
    console.log("🔍 Extracting heroui-native from GitHub...");
    console.log(`📍 Repository: heroui-inc/heroui-native@${ref}`);

    // Update parser with the correct ref
    this.parser = new NativeParser(ref);

    // Get component documentation files
    const docFiles = await this.github.getComponentFiles(
      "heroui-inc",
      "heroui-native",
      "src/components",
      ref,
    );

    console.log(`📄 Found ${docFiles.length} documentation files`);

    // Extract components
    const components: NativeComponentDataset = {};

    // Process components in parallel with concurrency limit
    const CONCURRENCY = process.env.GITHUB_TOKEN ? 10 : 3;
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const DELAY_MS = process.env.GITHUB_TOKEN ? 50 : 200;

    const processFile = async (filePath: string): Promise<void> => {
      try {
        console.log(`   Processing ${filePath}...`);

        const content = await this.github.fetchFile("heroui-inc", "heroui-native", filePath, ref);
        const component = await this.parser.parseContent(content, filePath);

        if (component && Object.keys(component.props).length > 0) {
          components[component.name] = component;
          console.log(`      ✓ ${component.name} (${Object.keys(component.props).length} props)`);

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

    console.log(`📄 Found ${Object.keys(components).length} components`);

    return {
      data: components,
    };
  }
}
