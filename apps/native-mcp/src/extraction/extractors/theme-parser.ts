/**
 * Parser for HeroUI Native theme TypeScript source
 */

import type {ColorToken, Theme, ThemeSystem} from "@shared/types/theme";

export class ThemeParser {
  /**
   * Parse colors.ts TypeScript source for default theme
   */
  parseColorSource(tsContent: string): {light: ColorToken[]; dark: ColorToken[]} {
    const lightColors = this.parseColorObject(tsContent, "light");
    const darkColors = this.parseColorObject(tsContent, "dark");

    return {light: lightColors, dark: darkColors};
  }

  /**
   * Parse theme file from example/src/themes/*.ts
   */
  parseThemeFile(tsContent: string): Record<string, Theme> {
    const themes: Record<string, Theme> = {};

    // Match exported theme constants: export const themeName: ThemeConfig = { ... }
    const themeExportRegex = /export\s+const\s+(\w+Theme):\s*ThemeConfig\s*=\s*\{([\s\S]*?)\n\};/g;
    let match;

    while ((match = themeExportRegex.exec(tsContent)) !== null) {
      const themeVarName = match[1]; // e.g., 'lavenderDreamTheme'
      const themeContent = match[2];

      try {
        // Parse light and dark colors
        const lightColors = this.parseColorObject(themeContent, "light");
        const darkColors = this.parseColorObject(themeContent, "dark");

        // Extract borderRadius and opacity values
        const borderRadius = this.extractBorderRadius(themeContent);
        const opacity = this.extractOpacity(themeContent);

        // Convert variable name to theme ID: lavenderDreamTheme -> lavender-dream
        const themeId = this.themeVarNameToId(themeVarName);

        themes[themeId] = {
          name: themeId,
          light: {colors: lightColors},
          dark: {colors: darkColors},
          borderRadius,
          opacity,
        };
      } catch (error) {
        console.warn(`Failed to parse theme ${themeVarName}:`, error);
      }
    }

    return themes;
  }

  /**
   * Convert theme variable name to theme ID
   * lavenderDreamTheme -> lavender-dream
   */
  private themeVarNameToId(varName: string): string {
    // Remove 'Theme' suffix and convert camelCase to kebab-case
    const withoutTheme = varName.replace(/Theme$/, "");

    return withoutTheme.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }

  /**
   * Extract borderRadius values from theme content
   */
  private extractBorderRadius(content: string): Theme["borderRadius"] {
    const borderRadiusMatch = content.match(/borderRadius:\s*\{([^}]+)\}/s);
    if (!borderRadiusMatch) {
      return {DEFAULT: "8", panel: "16", "panel-inner": "12"};
    }

    const borderRadiusContent = borderRadiusMatch[1];
    const values: Record<string, string> = {};

    // Match: 'DEFAULT': '18px' or DEFAULT: '18px'
    const valueRegex = /['"]?(\w+(?:-\w+)?)['"]?\s*:\s*['"]([^'"]+)['"]/g;
    let match;

    while ((match = valueRegex.exec(borderRadiusContent)) !== null) {
      const [, key, value] = match;
      values[key] = value.replace(/px$/, ""); // Remove 'px' suffix
    }

    return {
      DEFAULT: values.DEFAULT || "8",
      panel: values.panel || "16",
      "panel-inner": values["panel-inner"] || "12",
    };
  }

  /**
   * Extract opacity values from theme content
   */
  private extractOpacity(content: string): Theme["opacity"] {
    const opacityMatch = content.match(/opacity:\s*\{([^}]+)\}/s);
    if (!opacityMatch) {
      return {disabled: 0.5};
    }

    const opacityContent = opacityMatch[1];
    const disabledMatch = opacityContent.match(/disabled:\s*([\d.]+)/);

    return {
      disabled: disabledMatch ? parseFloat(disabledMatch[1]) : 0.5,
    };
  }

  /**
   * Parse color object from TypeScript source
   * Handles two patterns:
   * 1. Default theme: light: { background: 'hsl(...)', ... }
   * 2. Custom theme: light: { colors: { background: 'hsl(...)', ... } }
   */
  private parseColorObject(content: string, mode: "light" | "dark"): ColorToken[] {
    const colors: ColorToken[] = [];

    // Try Pattern 1: mode: { colors: { ... } } (custom themes)
    let modeRegex = new RegExp(
      `${mode}:\\s*\\{[^}]*colors:\\s*\\{([\\s\\S]*?)\\}[\\s\\S]*?\\}(?:\\s*,|\\s*\\})`,
      "s",
    );
    let match = content.match(modeRegex);

    if (match) {
      // Found nested colors object
      const colorBlock = match[1];

      return this.extractColorsFromBlock(colorBlock);
    }

    // Try Pattern 2: mode: { background: 'hsl(...)', ... } (default theme)
    modeRegex = new RegExp(`${mode}:\\s*\\{([\\s\\S]*?)\\}(?:\\s*,|\\s*\\})`, "s");
    match = content.match(modeRegex);

    if (match) {
      // Direct color properties
      const colorBlock = match[1];

      return this.extractColorsFromBlock(colorBlock);
    }

    return colors;
  }

  /**
   * Extract color tokens from a color block
   */
  private extractColorsFromBlock(colorBlock: string): ColorToken[] {
    const colors: ColorToken[] = [];

    // Extract individual color definitions: colorName: 'hsl(...)'
    // Handle both quoted strings and comments
    const colorRegex = /(\w+):\s*['"]([^'"]+)['"]/g;
    let colorMatch;

    while ((colorMatch = colorRegex.exec(colorBlock)) !== null) {
      const [, name, value] = colorMatch;

      // Skip non-color properties
      if (["borderRadius", "opacity", "DEFAULT", "panel"].includes(name)) continue;

      colors.push({
        name,
        value: value.replace(/^hsl\(/, "").replace(/\)$/, ""), // Remove hsl() wrapper if present
        category: this.categorizeColor(name),
      });
    }

    return colors;
  }

  /**
   * Categorize color based on name
   */
  private categorizeColor(name: string): ColorToken["category"] {
    if (["background", "foreground", "panel", "muted"].includes(name)) {
      return "base";
    }

    if (["success", "warning", "danger"].includes(name)) {
      return "status";
    }

    if (name.startsWith("surface")) {
      return "surface";
    }

    if (["border", "divider", "link"].includes(name)) {
      return "utility";
    }

    return "semantic";
  }

  /**
   * Build complete theme system from parsed data
   */
  buildThemeSystem(version: string, themes: Record<string, Theme>): ThemeSystem {
    return {
      version,
      themes,
    };
  }
}
