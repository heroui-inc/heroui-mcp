/**
 * Theme extractor for HeroUI Native theme system
 * Extracts default theme from variables.css (beta) or colors.ts (alpha)
 */

import type {Theme, ThemeSystem} from "@shared/types/theme";

import {BaseExtractor} from "./base";
import {ThemeParser} from "./theme-parser";

/**
 * Theme extractor - extracts default Native theme from GitHub
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

  async extract(ref: string = "beta"): Promise<{data: ThemeSystem}> {
    console.log("🎨 Extracting HeroUI Native theme system...");
    console.log(`📍 Repository: heroui-inc/heroui-native@${ref}`);

    // Get version from package.json
    const version = await this.getVersionFromGitHub(ref);
    console.log(`   Version: ${version}`);

    // Extract default theme only
    console.log("   Fetching default theme...");
    const defaultTheme = await this.extractDefaultTheme();
    console.log(
      `   ✓ Extracted default theme (${defaultTheme.light.colors.length} light colors, ${defaultTheme.dark.colors.length} dark colors)`,
    );

    // Build theme system with only default theme
    const themes: Record<string, Theme> = {
      default: defaultTheme,
    };
    const themeSystem = this.parser.buildThemeSystem(version, themes);

    console.log("✓ Theme extraction complete");

    return {
      data: themeSystem,
    };
  }

  /**
   * Extract default theme from colors.ts (alpha) or variables.css (beta)
   */
  private async extractDefaultTheme(): Promise<Theme> {
    // Try beta format first: src/styles/variables.css
    try {
      const cssUrl = `${this.githubBase}/src/styles/variables.css`;
      const cssResponse = await fetch(cssUrl);

      if (cssResponse.ok) {
        const cssContent = await cssResponse.text();
        const {light, dark} = this.parser.parseCssVariables(cssContent);

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
    } catch {
      // Fall through to try alpha format
    }

    // Fallback to alpha format: src/providers/theme/colors.ts
    const url = `${this.githubBase}/src/providers/theme/colors.ts`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch theme source: ${response.status}`);
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
}
