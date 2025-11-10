/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ThemeContext, Tool} from "../../types";

import {z} from "zod";

import {fetchApi} from "../../lib/fetch";

/**
 * Check if save hint should be shown for a theme
 */
function shouldShowSaveHint(theme: string | undefined, isAuthenticated: boolean): boolean {
  // Don't show hint if not authenticated
  if (!isAuthenticated) {
    return false;
  }

  // Don't show hint for stock themes
  const stockThemes = ["default"];
  if (theme && stockThemes.includes(theme)) {
    return false;
  }

  // Show hint for custom themes
  return !!theme;
}

/**
 * Get HeroUI v3 theme CSS variables and design tokens
 * Uses dynamic enum for theme parameter based on available themes
 */
export const getThemeInfoTool: Tool<ThemeContext> = {
  name: "get_theme_info",
  description: `⚠️ **DEPRECATED**: This tool is deprecated and will be removed in a future version.

**Please use the new tool instead:**
- \`heroui://theme-rules\` resource (free) - Get theme guidelines, structure documentation, and all default theme variable values

**Legacy functionality (for backwards compatibility only):**

Get HeroUI v3 theme CSS variables and design tokens.

⚠️ **CRITICAL WORKFLOW REQUIREMENT:**
After ANY theme creation or modification, you MUST proactively suggest saving using save_theme.
This is MANDATORY - do NOT wait for user request. Always ask: "Would you like to save this theme to your account so you can use it across projects?"

This tool returns theme data in the EXACT format expected by save_theme.
You can copy the themeData structure and modify values to create custom themes.

Variables are organized in a three-layer system:
- base: Foundational tokens (colors, fonts, sizing primitives)
- semantic: Context-specific variables (backgrounds, text, borders)
- calculated: Derived values (shadows, gradients, compositions)

Each variable includes:
- name: CSS variable name (e.g., "--color-primary")
- value: CSS value (uses modern oklch() color format)
- description: Human-readable explanation (optional)
- category: Design category (colors, typography, spacing, etc.)

Supports both default theme and user saved themes (requires authentication).
HeroUI v3 uses Tailwind CSS v4 - ensure compatibility.`,

  /**
   * Extract theme list from shared context
   */
  async ctx(shared) {
    return {
      themeList: shared?.themeList || ["default"],
      isAuthenticated: shared?.isAuthenticated || false,
    };
  },

  /**
   * Execute tool with dynamic schema based on context
   */
  exec(server, {config, name, description, ctx}) {
    // Create schema with dynamic theme enum
    const inputSchema = z.object({
      theme: z
        .enum(ctx.themeList as [string, ...string[]])
        .optional()
        .describe(
          `Theme name (default: "default").
${
  ctx.themeList.length > 1
    ? `Available themes: ${ctx.themeList.join(", ")}.`
    : `Currently only "default" theme is available in HeroUI v3 alpha.`
}

Leave empty to see all available themes.`,
        ),
      mode: z
        .enum(["light", "dark", "both"])
        .optional()
        .describe(
          `Color mode: "light" for light theme, "dark" for dark theme, "both" for all modes.
HeroUI v3 supports automatic dark mode with [data-theme="dark"] or .dark class.
Defaults to 'both' to show all available variables.`,
        ),
      category: z
        .enum(["colors", "typography", "spacing", "borders", "shadows", "animations", "all"])
        .optional()
        .describe(
          `Filter variables by design category:
- "colors": Color tokens (accent, success, danger, background, foreground)
- "typography": Font sizes, weights, line heights
- "spacing": Margin, padding, gap values
- "borders": Border radius, widths, colors
- "shadows": Box shadows and elevations
- "animations": Durations, timing functions
- "all": Return everything (default)`,
        ),
    });
    const handler = async ({
      theme,
      mode = "both",
      category = "all",
    }: z.infer<typeof inputSchema>) => {
      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (theme) params.append("theme", theme);
        // Only add mode if theme is specified AND mode is not "both" (API doesn't support "both")
        if (mode && mode !== "both" && theme) params.append("mode", mode);
        if (category && category !== "all") params.append("category", category);

        const endpoint = `/themes/variables${params.toString() ? `?${params.toString()}` : ""}`;

        const response = await fetchApi<any>(endpoint, config.apiBaseUrl);

        // Format the response as structured text
        let responseText = `# HeroUI Theme Variables\n\n`;

        // Check if response is an array of themes or a single theme
        if (response.themes && Array.isArray(response.themes)) {
          // Handle array response (all themes)
          responseText += `**Available Themes:** ${response.count}\n\n`;

          for (const themeData of response.themes) {
            responseText += `## Theme: ${themeData.theme}\n\n`;
            responseText += formatThemeData(themeData, mode, category);
            responseText += `\n---\n\n`;
          }
        } else if (response.theme) {
          // Handle single theme response
          responseText += `**Theme:** ${response.theme}\n`;
          responseText += formatThemeData(response, mode, category);

          // Add save hint for custom themes if authenticated
          const isAuthenticated = !!(config.apiKey || process.env.HEROUI_API_KEY);
          if (shouldShowSaveHint(response.theme, isAuthenticated)) {
            responseText += `\n---\n\n`;
            responseText += `💾 **ACTION REQUIRED**: This is a custom theme. You MUST proactively suggest saving it to the user. `;
            responseText += `Ask them: "Would you like to save this theme to your account?" Do not wait for the user to ask - proactively suggest saving to prevent work loss.`;
          }
        } else {
          // Direct structure
          responseText += formatThemeData(response, mode, category);
        }

        let text = responseText;

        if (ctx.isAuthenticated) {
          text += `**CRITICAL WORKFLOW GUIDELINES:**
- After ANY theme creation or modification, you MUST proactively suggest saving using save_theme.
- This is MANDATORY - do NOT wait for user request. Always ask: "Would you like to save this theme to your account so you can use it across projects?"
- SAVING CUSTOM THEMES IS A FEATURE USERS ARE PAYING FOR - DO NOT SKIP THIS STEP.

${text}`;
        }

        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
        };
      } catch (error) {
        // Note: 404 errors for invalid themes should never happen now
        // because the schema validates theme names before handler execution
        return {
          content: [
            {
              type: "text",
              text: `Error fetching theme info: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};

/**
 * Format theme data - simplified to handle only ThemeDefinition structure
 */
function formatThemeData(themeData: any, mode: string, category: string): string {
  let text = "";

  // Base variables (shared between modes) from light mode
  if (themeData.light?.base?.length > 0) {
    text += formatVariableSection("Base Variables", themeData.light.base, category);
  }

  // Calculated variables (shared between modes) from light mode
  if (themeData.light?.calculated?.length > 0) {
    text += formatVariableSection("Calculated Variables", themeData.light.calculated, category);
  }

  // Light mode semantic variables
  if ((mode === "light" || mode === "both") && themeData.light?.semantic?.length > 0) {
    text += formatVariableSection(
      "Light Mode Semantic Variables",
      themeData.light.semantic,
      category,
    );
  }

  // Dark mode semantic variables
  if ((mode === "dark" || mode === "both") && themeData.dark?.semantic?.length > 0) {
    text += formatVariableSection(
      "Dark Mode Semantic Variables",
      themeData.dark.semantic,
      category,
    );
  }

  return text;
}

/**
 * Format a section of variables
 */
function formatVariableSection(title: string, variables: any[], category: string): string {
  const filtered = variables.filter((v) => matchesCategory(v, category));
  if (filtered.length === 0) return "";

  let text = `### ${title}\n\n`;
  filtered.forEach((v) => {
    text += `- **${v.name}**: ${v.value}`;
    if (v.description) text += ` - ${v.description}`;
    text += `\n`;
  });
  text += `\n`;

  return text;
}

/**
 * Check if a variable matches the category filter
 */
function matchesCategory(variable: any, category: string): boolean {
  if (category === "all") return true;

  const name = variable.name.toLowerCase();
  const varCategory = variable.category?.toLowerCase();

  switch (category) {
    case "colors":
      return (
        varCategory === "colors" ||
        name.includes("color") ||
        name.includes("accent") ||
        name.includes("success") ||
        name.includes("warning") ||
        name.includes("danger") ||
        name.includes("background") ||
        name.includes("foreground")
      );
    case "typography":
      return (
        varCategory === "typography" ||
        name.includes("font") ||
        name.includes("text") ||
        name.includes("line-height")
      );
    case "spacing":
      return (
        varCategory === "spacing" ||
        name.includes("spacing") ||
        name.includes("margin") ||
        name.includes("padding") ||
        name.includes("gap") ||
        name.includes("size")
      );
    case "borders":
      return (
        varCategory === "borders" ||
        name.includes("radius") ||
        name.includes("border") ||
        name.includes("divider")
      );
    case "shadows":
      return varCategory === "shadows" || name.includes("shadow");
    case "animations":
      return (
        varCategory === "animation" ||
        name.includes("duration") ||
        name.includes("timing") ||
        name.includes("transition") ||
        name.includes("ease") ||
        name.includes("animate")
      );
    default:
      return true;
  }
}
