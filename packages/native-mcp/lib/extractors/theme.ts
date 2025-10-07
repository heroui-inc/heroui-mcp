/**
 * Theme extractor for HeroUI Native theme system
 */

import type {GitHubClient} from "../github-client";
import type {NativeThemeDefinition} from "./theme-parser";

import {SimpleGitHubClient} from "../github-client";

import {BaseExtractor} from "./base";
import {ThemeParser} from "./theme-parser";

export type {NativeThemeDefinition};

/**
 * Theme extractor - extracts Native theme documentation from GitHub
 */
export class ThemeExtractor extends BaseExtractor {
  private github: GitHubClient;
  private parser: ThemeParser;

  constructor() {
    super();
    this.github = new SimpleGitHubClient(process.env.GITHUB_TOKEN);
    this.parser = new ThemeParser();
  }

  getStorageKey(): string {
    return "heroui-native-theme";
  }

  getStorageType(): "components" | "theme" {
    return "theme";
  }

  async extract(): Promise<{data: NativeThemeDefinition}> {
    console.log("🎨 Extracting heroui-native theme from GitHub...");
    console.log("📍 Repository: heroui-inc/heroui-native@alpha");

    const themePath = "src/providers/theme/theme.md";

    try {
      console.log(`   Fetching theme documentation from ${themePath}...`);

      const content = await this.github.fetchFile(
        "heroui-inc",
        "heroui-native",
        themePath,
        "alpha",
      );
      const theme = this.parser.parseContent(content);

      console.log("✓ Theme extracted successfully");
      console.log(`   - ${theme.colors.semantic.length} semantic colors`);
      console.log(`   - ${theme.colors.status.length} status colors`);
      console.log(`   - ${theme.colors.surface.length} surface levels`);
      console.log(`   - ${theme.utilities.borderRadius.values.length} border radius utilities`);
      console.log(`   - ${theme.configuration.examples.length} configuration examples`);

      return {
        data: theme,
      };
    } catch (error) {
      throw new Error(`Failed to extract theme: ${error}`);
    }
  }
}
