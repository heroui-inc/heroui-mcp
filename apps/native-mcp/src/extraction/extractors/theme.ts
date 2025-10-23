/**
 * Theme extractor for HeroUI Native theme system
 * Extracts default theme from colors.ts and custom themes from example/src/themes/
 */

import type {Theme, ThemeSystem} from "@shared/types/theme";

import {BaseExtractor} from "./base";
import {ThemeParser} from "./theme-parser";

/**
 * Theme extractor - extracts Native themes from GitHub
 */
export class ThemeExtractor extends BaseExtractor {
  private parser: ThemeParser;

  constructor() {
    super();
    this.parser = new ThemeParser();
  }

  getStorageKey(): string {
    return "heroui-native-theme";
  }

  getStorageType(): "components" | "theme" {
    return "theme";
  }

  async extract(): Promise<{data: ThemeSystem}> {
    console.log("🎨 Extracting HeroUI Native theme system...");
    console.log("📍 Repository: heroui-inc/heroui-native@alpha");

    // Step 1: Get version from package.json
    const version = await this.getVersionFromGitHub();
    console.log(`   Version: ${version}`);

    const themes: Record<string, Theme> = {};

    // Step 2: Extract default theme from colors.ts
    console.log("   Fetching default theme from colors.ts...");
    const defaultTheme = await this.extractDefaultTheme();
    themes["default"] = defaultTheme;
    console.log(`   ✓ Extracted default theme (${defaultTheme.light.colors.length} colors)`);

    // Step 3: Extract custom themes from example/src/themes/
    console.log("   Fetching custom themes from example/src/themes/...");
    const customThemes = await this.extractCustomThemes();
    Object.assign(themes, customThemes);
    console.log(`   ✓ Extracted ${Object.keys(customThemes).length} custom themes`);

    // Step 4: Build theme system
    const themeSystem = this.parser.buildThemeSystem(version, themes);

    // Log summary
    console.log("✓ Theme extraction complete");
    console.log(`   Total themes: ${Object.keys(themes).length}`);
    for (const [name, theme] of Object.entries(themes)) {
      console.log(
        `   - ${name}: ${theme.light.colors.length} light colors, ${theme.dark.colors.length} dark colors`,
      );
    }

    return {
      data: themeSystem,
    };
  }

  /**
   * Extract default theme from colors.ts
   */
  private async extractDefaultTheme(): Promise<Theme> {
    const url = `${this.githubBase}/src/providers/theme/colors.ts`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch colors.ts: ${response.status}`);
    }

    const content = await response.text();
    const {light, dark} = this.parser.parseColorSource(content);

    return {
      name: "default",
      light: {colors: light},
      dark: {colors: dark},
      borderRadius: {
        DEFAULT: "8",
        panel: "16",
        "panel-inner": "12",
      },
      opacity: {
        disabled: 0.5,
      },
    };
  }

  /**
   * Extract custom themes from example/src/themes/
   */
  private async extractCustomThemes(): Promise<Record<string, Theme>> {
    const allThemes: Record<string, Theme> = {};

    try {
      // List files in example/src/themes/
      const themeFiles = await this.listThemeFiles();

      // Extract each theme file
      for (const file of themeFiles) {
        try {
          const url = `${this.githubBase}/example/src/themes/${file}`;
          const response = await fetch(url);
          console.log(`   ✓ Found ${file}: ${response.status}`);

          if (!response.ok) {
            console.warn(`   ⚠ Failed to fetch ${file}: ${response.status}`);
            continue;
          }

          const content = await response.text();
          const themes = this.parser.parseThemeFile(content);
          console.log(`   ✓ Parsed ${file}: ${Object.keys(themes).length} themes`);

          Object.assign(allThemes, themes);
        } catch (error) {
          console.warn(`   ⚠ Error parsing ${file}:`, error);
        }
      }
    } catch {
      console.warn("   ⚠ Failed to list theme files, skipping custom themes");
    }

    return allThemes;
  }

  /**
   * List all .ts files in example/src/themes/
   */
  private async listThemeFiles(): Promise<string[]> {
    const apiUrl = `https://api.github.com/repos/heroui-inc/heroui-native/contents/example/src/themes?ref=alpha`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to list theme files: ${response.status}`);
    }

    const files = (await response.json()) as Array<{name: string; type: string}>;

    return files.filter((f) => f.type === "file" && f.name.endsWith(".ts")).map((f) => f.name);
  }
}
