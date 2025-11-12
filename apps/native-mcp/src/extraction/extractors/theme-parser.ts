/**
 * Parser for HeroUI Native theme TypeScript source
 */

import type {ColorToken, Theme, ThemeSystem} from "@shared/types/theme";

export class ThemeParser {
  /**
   * Parse CSS variables from variables.css (beta format)
   */
  parseCssVariables(cssContent: string): {light: ColorToken[]; dark: ColorToken[]} {
    // First, extract primitive colors that are referenced by var()
    const primitives = this.extractPrimitiveColors(cssContent);

    // Then parse variants, resolving var() references
    const lightColors = this.parseCssVariant(cssContent, "light", primitives);
    const darkColors = this.parseCssVariant(cssContent, "dark", primitives);

    return {light: lightColors, dark: darkColors};
  }

  /**
   * Extract primitive colors from @theme block
   */
  private extractPrimitiveColors(cssContent: string): Record<string, string> {
    const primitives: Record<string, string> = {};

    // Match @theme { ... } block
    const themeBlockMatch = cssContent.match(/@theme\s*\{([\s\S]*?)\}(?=\s*@layer|$)/i);
    if (!themeBlockMatch) {
      return primitives;
    }

    const themeContent = themeBlockMatch[1];
    const cssVarRegex = /--([\w-]+):\s*([^;]+);/g;
    let varMatch;

    while ((varMatch = cssVarRegex.exec(themeContent)) !== null) {
      const [, name, value] = varMatch;
      const cleanValue = value.trim().replace(/\s+/g, " "); // Normalize whitespace

      // Only extract primitive color variables
      if (["white", "black", "snow", "eclipse"].includes(name)) {
        primitives[name] = cleanValue;
      }
    }

    return primitives;
  }

  /**
   * Resolve var() references to actual values
   */
  private resolveVarReference(value: string, primitives: Record<string, string>): string | null {
    const varMatch = value.match(/var\(--([\w-]+)\)/);
    if (!varMatch) {
      return null;
    }

    const varName = varMatch[1];

    return primitives[varName] || null;
  }

  /**
   * Parse a specific variant (@variant light or @variant dark) from CSS
   */
  private parseCssVariant(
    cssContent: string,
    variant: "light" | "dark",
    primitives: Record<string, string>,
  ): ColorToken[] {
    // Match @variant light { ... } or @variant dark { ... }
    const variantRegex = new RegExp(
      `@variant\\s+${variant}\\s*\\{([\\s\\S]*?)\\}(?=\\s*@variant|\\s*\\})`,
      "i",
    );
    const match = cssContent.match(variantRegex);

    if (!match) {
      return [];
    }

    const variantContent = match[1];

    // First pass: extract all variables into a map
    const variables: Record<string, string> = {};
    const cssVarRegex = /--([\w-]+):\s*([^;]+?)(?=\s*;)/gs;
    let varMatch;

    while ((varMatch = cssVarRegex.exec(variantContent)) !== null) {
      const [, name, value] = varMatch;
      const cleanValue = value.trim().replace(/\s+/g, " ");
      variables[name] = cleanValue;
    }

    // Second pass: resolve var() references and build color tokens
    const colors: ColorToken[] = [];
    const colorNames = [
      "background",
      "foreground",
      "surface",
      "surface-foreground",
      "overlay",
      "overlay-foreground",
      "muted",
      "default",
      "default-foreground",
      "accent",
      "accent-foreground",
      "success",
      "success-foreground",
      "warning",
      "warning-foreground",
      "danger",
      "danger-foreground",
      "segment",
      "segment-foreground",
      "border",
      "divider",
      "link",
      "field-background",
      "field-foreground",
      "field-placeholder",
      "field-border",
    ];

    for (const [name, value] of Object.entries(variables)) {
      const cleanName = name.replace(/^color-/, ""); // Remove 'color-' prefix if present

      // Only include known color properties
      if (!colorNames.includes(cleanName) && !colorNames.some((cn) => cleanName.startsWith(cn))) {
        continue;
      }

      // Resolve var() references (first try primitives, then variant variables)
      let resolvedValue = value;
      if (value.startsWith("var(")) {
        const varRef = this.resolveVarReference(value, primitives);
        if (varRef) {
          resolvedValue = varRef;
        } else {
          // Try to resolve from variant variables
          const variantVarRef = this.resolveVarReference(value, variables);
          if (variantVarRef) {
            resolvedValue = variantVarRef;
          }
        }
      }

      colors.push({
        name: cleanName,
        value: resolvedValue,
        category: this.categorizeColor(cleanName),
      });
    }

    return colors;
  }

  /**
   * Parse colors.ts TypeScript source for default theme
   */
  parseColorSource(tsContent: string): {light: ColorToken[]; dark: ColorToken[]} {
    const lightColors = this.parseColorObject(tsContent, "light");
    const darkColors = this.parseColorObject(tsContent, "dark");

    return {light: lightColors, dark: darkColors};
  }

  /**
   * Parse color object from TypeScript source
   * Handles two patterns (for alpha format compatibility):
   * 1. Default theme: light: { background: 'hsl(...)', ... }
   * 2. Nested colors: light: { colors: { background: 'hsl(...)', ... } }
   */
  private parseColorObject(content: string, mode: "light" | "dark"): ColorToken[] {
    const colors: ColorToken[] = [];

    // Try Pattern 1: mode: { colors: { ... } } (nested structure)
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
