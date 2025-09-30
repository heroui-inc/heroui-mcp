#!/usr/bin/env node

/**
 * HeroUI Theme System extraction script with R2 upload
 * Fetches theme variables, animations, and documentation from GitHub
 */

import type {
  AnimationPreset,
  AnimationTiming,
  CSSVariable,
  GuideContent,
  ThemeDefinition,
  ThemeSystem,
  ThemeVariables,
} from "../src/types/theme";

import {R2Uploader} from "../lib/r2-uploader";

class HeroUIThemeExtractor {
  private static readonly GITHUB_RAW_BASE_URL =
    "https://raw.githubusercontent.com/heroui-inc/heroui/refs/heads/v3";
  private static readonly LIBRARY_NAME = "heroui";

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
      const url = `${HeroUIThemeExtractor.GITHUB_RAW_BASE_URL}/apps/docs/content/docs/${filename}`;
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
      const variablesUrl = `${HeroUIThemeExtractor.GITHUB_RAW_BASE_URL}/packages/styles/themes/${themeName}/variables.css`;
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
        const componentsUrl = `${HeroUIThemeExtractor.GITHUB_RAW_BASE_URL}/packages/styles/themes/${themeName}/components/index.css`;
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

  /**
   * Get the latest version from npm
   */
  private async getLatestVersion(): Promise<string> {
    try {
      // Get all versions and find the latest alpha
      const response = await fetch("https://registry.npmjs.org/@heroui/react");
      const data = (await response.json()) as {versions: Record<string, string>};

      if (data.versions) {
        // Get all version numbers and sort to find latest alpha
        const versions = Object.keys(data.versions);
        const alphaVersions = versions.filter((v) => v.includes("alpha"));

        if (alphaVersions.length > 0) {
          // Sort alphas and get the latest
          alphaVersions.sort((a, b) => {
            const aParts = a.split("-alpha.")[1];
            const bParts = b.split("-alpha.")[1];

            return parseInt(bParts) - parseInt(aParts);
          });

          return alphaVersions[0];
        }
      }

      // Fallback to latest tag if no alpha found
      const latestResponse = await fetch("https://registry.npmjs.org/@heroui/react/latest");
      const latestData = (await latestResponse.json()) as {version: string};

      return latestData.version || "3.0.0-alpha.31";
    } catch (error) {
      console.warn("Failed to fetch latest version from npm, using default alpha version");

      return "3.0.0-alpha.31";
    }
  }

  /**
   * Main extraction method
   */
  async extract(version?: string): Promise<ThemeSystem> {
    console.log("🎨 Extracting HeroUI theme system...");

    // Get version
    const themeVersion = version || (await this.getLatestVersion());
    console.log(`  Version: ${themeVersion}`);

    // Fetch shared theme variables
    console.log("  Fetching shared variables...");
    const sharedUrl = `${HeroUIThemeExtractor.GITHUB_RAW_BASE_URL}/packages/styles/themes/shared/theme.css`;
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
      version: themeVersion,
      themes,
      sharedVariables,
      animations,
      guides,
    };
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting HeroUI theme extraction for R2...");

  // Check for required environment variables
  const r2Config = {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    bucketName: process.env.R2_BUCKET_NAME || "heroui-mcp-data",
  };

  if (!r2Config.accountId || !r2Config.accessKeyId || !r2Config.secretAccessKey) {
    console.error("❌ Missing required R2 credentials in environment variables");
    console.error("   Required: CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
    process.exit(1);
  }

  // Parse command line arguments
  const forceExtract = process.argv.includes("--force");
  const versionArg = process.argv.find((arg) => arg.startsWith("--version="))?.split("=")[1];

  // Filter out invalid version values like "true" or "false"
  const specificVersion =
    versionArg && versionArg !== "true" && versionArg !== "false" ? versionArg : undefined;

  try {
    const extractor = new HeroUIThemeExtractor();
    const r2Uploader = new R2Uploader(r2Config);

    // Check if theme already exists (unless force flag is set)
    if (!forceExtract) {
      // Use versionExists method with "heroui-theme" as library name
      const existingTheme = await r2Uploader.versionExists("heroui-theme", "latest");
      if (existingTheme) {
        console.log("ℹ️  Theme data already exists. Use --force to re-extract.");

        // If a specific version was requested, check if it exists
        if (specificVersion) {
          const versionKey = `v${specificVersion.replace(/^v/, "")}`;
          const versionExists = await r2Uploader.versionExists("heroui-theme", versionKey);
          if (!versionExists) {
            console.log(`  Version ${specificVersion} not found, extracting...`);
          } else {
            console.log(`  Version ${specificVersion} already exists.`);
            process.exit(0);
          }
        } else {
          process.exit(0);
        }
      }
    }

    // Extract theme system
    const startTime = Date.now();
    const themeSystem = await extractor.extract(specificVersion);
    const extractDuration = Date.now() - startTime;

    console.log(`📦 Extracted theme system with ${Object.keys(themeSystem.themes).length} themes`);

    // Upload to R2 with library prefix
    const baseKey = "heroui-theme";

    // Upload latest version
    await r2Uploader.uploadData(`${baseKey}/latest.json`, themeSystem);
    console.log(`  ✓ Uploaded to ${baseKey}/latest.json`);

    // Upload versioned copy
    const versionKey = `${baseKey}/v${themeSystem.version.replace(/^v/, "")}.json`;
    await r2Uploader.uploadData(versionKey, themeSystem);
    console.log(`  ✓ Uploaded to ${versionKey}`);

    // Update metadata
    const currentMetadata = (await r2Uploader.getVersionMetadata()) || {};
    const updatedMetadata = {
      ...currentMetadata,
      "heroui-theme": {
        current: themeSystem.version,
        lastUpdated: new Date().toISOString(),
      },
    };
    await r2Uploader.updateVersionMetadata(updatedMetadata);

    console.log(`✅ Successfully uploaded HeroUI theme system to R2`);
    console.log(`⏱️  Extraction took ${(extractDuration / 1000).toFixed(2)} seconds`);
  } catch (error) {
    console.error("❌ Extraction failed:", error);
    process.exit(1);
  }
}

// Handle --help
if (process.argv.includes("--help")) {
  console.log(`Usage: extract-heroui-theme-r2 [--force] [--version=VERSION]

Extracts HeroUI theme system from GitHub and uploads to R2

Options:
  --force           Force re-extraction even if data exists
  --version=VERSION Extract specific version (default: latest from npm)

Environment variables:
  GITHUB_TOKEN              GitHub personal access token (optional, for rate limits)
  CLOUDFLARE_ACCOUNT_ID     Cloudflare account ID (required)
  R2_ACCESS_KEY_ID          R2 access key ID (required)
  R2_SECRET_ACCESS_KEY      R2 secret access key (required)
  R2_BUCKET_NAME            R2 bucket name (default: heroui-mcp-data)
`);
  process.exit(0);
}

main().catch(console.error);
