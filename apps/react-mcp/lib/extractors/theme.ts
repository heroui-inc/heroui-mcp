/**
 * Theme extractor for HeroUI theme system
 */

import type {
  AnimationPreset,
  AnimationTiming,
  CSSVariable,
  GuideContent,
  ThemeDefinition,
  ThemeSystem,
  ThemeVariables,
} from "../../src/types/theme";

import {BaseExtractor} from "./base";

export class ThemeExtractor extends BaseExtractor {
  getStorageKey(): string {
    return "heroui-theme";
  }

  getStorageType(): "components" | "theme" {
    return "theme";
  }

  async extract(): Promise<{data: ThemeSystem}> {
    console.log("🎨 Extracting HeroUI theme system...");

    // Get version from GitHub (same source as components)
    const version = await this.getVersionFromGitHub();
    console.log(`  Version: ${version}`);

    // Fetch shared theme variables
    console.log("  Fetching shared variables...");
    const sharedUrl = `${this.githubBase}/packages/styles/themes/shared/theme.css`;
    const sharedResponse = await fetch(sharedUrl);
    const sharedCSS = await sharedResponse.text();
    const sharedVariables = this.parseCSSVariables(sharedCSS);

    // Extract animations
    const animations = this.extractAnimations(sharedCSS);
    console.log(`  ✓ Found ${sharedVariables.length} shared variables`);
    console.log(`  ✓ Found ${animations.timings.length} timing functions`);
    console.log(`  ✓ Found ${animations.presets.length} animation presets`);

    // Extract themes
    const themes: Record<string, ThemeDefinition> = {};
    const themeNames = ["default"]; // Add more as they become available

    for (const themeName of themeNames) {
      const theme = await this.extractTheme(themeName);
      if (theme) {
        themes[themeName] = theme;
      }
    }

    // Fetch documentation guides
    console.log("  Fetching documentation guides...");
    const guides: ThemeSystem["guides"] = {
      theming: await this.fetchGuide("handbook/theming.mdx"),
      colors: await this.fetchGuide("handbook/colors.mdx"),
      styling: await this.fetchGuide("handbook/styling.mdx"),
      animation: await this.fetchGuide("handbook/animation.mdx"),
      composition: await this.fetchGuide("handbook/composition.mdx"),
      designPrinciples: await this.fetchGuide("design-principles.mdx"),
      quickStart: await this.fetchGuide("quick-start.mdx"),
    };

    const guideCount = Object.values(guides).filter(Boolean).length;
    console.log(`  ✓ Fetched ${guideCount} documentation guides`);

    return {
      data: {
        version,
        themes,
        sharedVariables,
        animations,
        guides,
      },
    };
  }

  /**
   * Parse CSS file and extract variables
   */
  private parseCSSVariables(cssContent: string, category?: string): CSSVariable[] {
    const variables: CSSVariable[] = [];

    // Match CSS custom properties
    const varRegex = /--([\w-]+):\s*([^;]+);/g;
    let match;

    while ((match = varRegex.exec(cssContent)) !== null) {
      const [, name, value] = match;

      // Try to extract comment as description
      const commentRegex = new RegExp(`\\/\\*\\s*([^*]+)\\s*\\*\\/\\s*--${name}`, "g");
      const commentMatch = commentRegex.exec(cssContent);

      variables.push({
        name: `--${name}`,
        value: value.trim(),
        description: commentMatch ? commentMatch[1].trim() : undefined,
        category: category || this.categorizeVariable(name),
      });
    }

    return variables;
  }

  /**
   * Categorize variable based on its name
   */
  private categorizeVariable(name: string): string {
    if (
      name.includes("color") ||
      name.includes("accent") ||
      name.includes("success") ||
      name.includes("warning") ||
      name.includes("danger") ||
      name.includes("background") ||
      name.includes("foreground")
    ) {
      return "colors";
    }
    if (name.includes("radius")) return "radius";
    if (name.includes("ease") || name.includes("animate")) return "animation";
    if (name.includes("shadow")) return "shadows";
    if (name.includes("surface")) return "surfaces";
    if (name.includes("border") || name.includes("divider")) return "borders";

    return "misc";
  }

  /**
   * Extract variables from a theme mode (light or dark)
   */
  private extractThemeMode(cssContent: string, selector: string): ThemeVariables {
    // Handle @layer wrapper and find the content within the selector
    let content = "";

    // Escape the selector for use in regex
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Pattern 1: @layer base { .dark, [data-theme="dark"] { ... } }
    // Handle comma-separated selectors
    const layerRegex = new RegExp(
      `@layer\\s+\\w+\\s*\\{[^}]*${escapedSelector}[^{]*\\{([^}]+(?:\\{[^}]+\\}[^}]+)*)\\}`,
      "gs",
    );
    let match = layerRegex.exec(cssContent);

    if (match) {
      content = match[1];
    } else {
      // Pattern 2: Direct selector without @layer
      const directRegex = new RegExp(`${escapedSelector}[^{]*\\{([^}]+)\\}`, "gs");
      match = directRegex.exec(cssContent);
      if (match) {
        content = match[1];
      }
    }

    if (!content) {
      // Try to extract all content within @layer if selector is :root
      if (selector === ":root") {
        const layerContentRegex = /@layer\s+\w+\s*\{([\s\S]*?)\}\s*(?:@layer|$)/;
        const layerMatch = layerContentRegex.exec(cssContent);
        if (layerMatch) {
          const layerContent = layerMatch[1];
          const rootRegex = /:root\s*\{([\s\S]*?)\}\s*(?:\.|\[|$)/;
          const rootMatch = rootRegex.exec(layerContent);
          if (rootMatch) {
            content = rootMatch[1];
          }
        }
      }
    }

    if (!content) {
      return {base: [], semantic: [], calculated: []};
    }

    const variables = this.parseCSSVariables(content);

    // Categorize variables
    const base = variables.filter(
      (v) =>
        ["--white", "--black", "--snow", "--eclipse"].some((base) => v.name.startsWith(base)) ||
        v.name.includes("spacing") ||
        v.name.includes("font"),
    );

    const calculated = variables.filter(
      (v) => v.value.includes("calc(") || v.value.includes("color-mix("),
    );

    const semantic = variables.filter((v) => !base.includes(v) && !calculated.includes(v));

    return {base, semantic, calculated};
  }

  /**
   * Extract animation timings
   */
  private extractAnimations(cssContent: string): {
    timings: AnimationTiming[];
    presets: AnimationPreset[];
  } {
    const timings: AnimationTiming[] = [];
    const presets: AnimationPreset[] = [];

    // Extract ease functions
    const easeRegex = /--(ease-[\w-]+):\s*([^;]+);/g;
    let match;

    while ((match = easeRegex.exec(cssContent)) !== null) {
      const [, name, value] = match;
      timings.push({
        name: `--${name}`,
        value: value.trim(),
        description: this.getEaseDescription(name),
      });
    }

    // Extract animation presets
    const animateRegex = /--(animate-[\w-]+):\s*([^;]+);/g;

    while ((match = animateRegex.exec(cssContent)) !== null) {
      const [, name, value] = match;
      presets.push({
        name: `--${name}`,
        value: value.trim(),
        description: this.getAnimationDescription(name),
      });
    }

    return {timings, presets};
  }

  private getEaseDescription(name: string): string {
    const descriptions: Record<string, string> = {
      "ease-smooth": "Standard CSS ease transition",
      "ease-in-quad": "Smooth acceleration (quadratic)",
      "ease-in-cubic": "Moderate acceleration (cubic)",
      "ease-in-quart": "Quick acceleration (quartic)",
      "ease-in-quint": "Fast acceleration (quintic)",
      "ease-in-expo": "Very fast acceleration (exponential)",
      "ease-in-circ": "Circular acceleration",
      "ease-out-quad": "Smooth deceleration (quadratic)",
      "ease-out-cubic": "Moderate deceleration (cubic)",
      "ease-out-quart": "Quick deceleration (quartic)",
      "ease-out-quint": "Fast deceleration (quintic)",
      "ease-out-expo": "Very fast deceleration (exponential)",
      "ease-out-circ": "Circular deceleration",
      "ease-in-out-quad": "Smooth acceleration and deceleration (quadratic)",
      "ease-in-out-cubic": "Moderate acceleration and deceleration (cubic)",
      "ease-in-out-quart": "Quick acceleration and deceleration (quartic)",
      "ease-in-out-quint": "Fast acceleration and deceleration (quintic)",
      "ease-in-out-expo": "Very fast acceleration and deceleration (exponential)",
      "ease-in-out-circ": "Circular acceleration and deceleration",
    };

    return descriptions[name] || "Custom easing function";
  }

  private getAnimationDescription(name: string): string {
    const descriptions: Record<string, string> = {
      "animate-spin-fast": "Fast spinning animation",
      "animate-skeleton": "Skeleton loading animation",
    };

    return descriptions[name] || "Custom animation";
  }

  /**
   * Fetch and parse MDX documentation
   */
  private async fetchGuide(filename: string): Promise<GuideContent | undefined> {
    try {
      const url = `${this.githubBase}/apps/docs/content/docs/${filename}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`Failed to fetch guide: ${filename}`);

        return undefined;
      }

      const content = await response.text();

      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      let title = "";
      let description = "";

      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const titleMatch = frontmatter.match(/title:\s*(.+)/);
        const descMatch = frontmatter.match(/description:\s*(.+)/);

        title = titleMatch ? titleMatch[1].trim() : "";
        description = descMatch ? descMatch[1].trim() : "";
      }

      // Remove frontmatter from content
      const markdownContent = content.replace(/^---\n[\s\S]*?\n---\n/, "");

      return {
        title,
        description,
        content: markdownContent,
        examples: this.extractExamples(markdownContent),
      };
    } catch (error) {
      console.warn(`Error fetching guide ${filename}:`, error);

      return undefined;
    }
  }

  /**
   * Extract code examples from markdown
   */
  private extractExamples(
    markdown: string,
  ): Array<{title: string; language: string; code: string}> {
    const examples: Array<{title: string; language: string; code: string}> = [];

    // Match code blocks with optional title
    const codeBlockRegex = /```(\w+)(?:\s+(.+))?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      const [, language, title, code] = match;
      examples.push({
        title: title || `${language} example`,
        language,
        code: code.trim(),
      });
    }

    return examples;
  }

  /**
   * Extract a complete theme definition
   */
  private async extractTheme(themeName: string): Promise<ThemeDefinition | null> {
    try {
      console.log(`  Extracting ${themeName} theme...`);

      // Fetch theme variables CSS
      const variablesUrl = `${this.githubBase}/packages/styles/themes/${themeName}/variables.css`;
      const variablesResponse = await fetch(variablesUrl);

      if (!variablesResponse.ok) {
        console.warn(`    Theme ${themeName} not found`);

        return null;
      }

      const variablesCSS = await variablesResponse.text();

      // Extract light and dark mode variables
      // For default theme, use simple selectors
      const lightVars = this.extractThemeMode(variablesCSS, ":root");
      const darkVars = this.extractThemeMode(variablesCSS, ".dark");

      // Fetch component overrides (may be empty)
      let componentCSS = "";
      try {
        const componentsUrl = `${this.githubBase}/packages/styles/themes/${themeName}/components/index.css`;
        const componentsResponse = await fetch(componentsUrl);
        if (componentsResponse.ok) {
          componentCSS = await componentsResponse.text();
        }
      } catch {
        // Component overrides are optional
      }

      console.log(`    ✓ Extracted ${themeName} theme`);

      // Create optimized structure by extracting common variables
      // Base variables are typically the same in both modes (primitives, spacing, typography)
      const commonBase = lightVars.base; // Base variables from light mode (shared)
      const commonCalculated = lightVars.calculated; // Calculated variables are typically shared

      return {
        name: themeName,
        light: lightVars,
        dark: darkVars,
        components: componentCSS || undefined,
        // Also include optimized structure
        optimized: {
          name: themeName,
          common: {
            base: commonBase,
            calculated: commonCalculated,
          },
          light: {
            semantic: lightVars.semantic,
          },
          dark: {
            semantic: darkVars.semantic,
          },
          components: componentCSS || undefined,
        },
      } as ThemeDefinition & {optimized: any};
    } catch (error) {
      console.error(`    Failed to extract ${themeName} theme:`, error);

      return null;
    }
  }
}
