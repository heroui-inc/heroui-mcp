import type {ThemeContext, Tool} from "../types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

/**
 * Tool to get user saved themes
 * Premium tool - requires authentication
 */
export const getThemeTool: Tool<ThemeContext> = {
  name: "get_theme",
  description: `Get a user saved theme by name.

⚠️ **PREMIUM TOOL**: Requires authentication via HEROUI_API_KEY.

Retrieves themes you've saved using save_theme.
Returns theme data in the exact format expected by save_theme.

Use this tool to:
- View your saved themes
- Copy theme structure for modification
- Retrieve theme variables for use in projects

After viewing, you can modify and save again using save_theme.

**Note**: This tool only works with user saved themes. For default theme values and guidelines, use \`get_theme_rules\` (free).`,

  /**
   * Extract theme list from shared context
   * Filter out "default" theme - this tool only works with user saved themes
   */
  async ctx(shared) {
    const allThemes = shared?.themeList || [];
    // Filter out "default" - only return user saved themes
    const userSavedThemes = allThemes.filter((theme) => theme !== "default");

    return {
      themeList: userSavedThemes.length > 0 ? userSavedThemes : [],
      isAuthenticated: shared?.isAuthenticated || false,
    };
  },

  /**
   * Execute tool with dynamic schema based on context
   */
  exec(server, {config, name, description, ctx}) {
    // If no user saved themes, create a schema that will show an error
    if (ctx.themeList.length === 0) {
      const inputSchema = z.object({
        theme: z
          .string()
          .describe(
            `No saved themes found. Use \`save_theme\` to save a theme first, then use \`list_themes\` to see available themes.`,
          ),
      });

      const handler = async () => {
        return {
          content: [
            {
              type: "text",
              text: `❌ No saved themes found.

**To use this tool:**
1. Create a theme using the default values from \`get_theme_rules\` (free)
2. Save it using \`save_theme\` (premium)
3. Then use \`get_theme\` to retrieve your saved theme

**Note**: This tool only works with user saved themes. For default theme values and guidelines, use \`get_theme_rules\` (free).`,
            },
          ],
        };
      };

      server.tool(name, description, inputSchema.shape, handler as any);

      return;
    }

    // Create schema with dynamic theme enum (only user saved themes)
    const inputSchema = z.object({
      theme: z.enum(ctx.themeList as [string, ...string[]]).describe(
        `Theme name (must be a user saved theme).
Available themes: ${ctx.themeList.join(", ")}.

Use \`list_themes\` to see all available themes.
For default theme values, use \`get_theme_rules\` (free).`,
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
        params.append("theme", theme);
        // Only add mode if mode is not "both" (API doesn't support "both")
        if (mode && mode !== "both") params.append("mode", mode);
        if (category && category !== "all") params.append("category", category);

        const endpoint = `/themes/variables?${params.toString()}`;

        const response = await fetchApi<{
          theme: string;
          mode?: string;
          variables?: {
            base: Array<{
              name: string;
              value: string;
              description?: string;
              category?: string;
            }>;
            semantic: Array<{
              name: string;
              value: string;
              description?: string;
              category?: string;
            }>;
            calculated: Array<{
              name: string;
              value: string;
              description?: string;
              category?: string;
            }>;
          };
          light?: {
            base: Array<{
              name: string;
              value: string;
              description?: string;
              category?: string;
            }>;
            semantic: Array<{
              name: string;
              value: string;
              description?: string;
              category?: string;
            }>;
            calculated: Array<{
              name: string;
              value: string;
              description?: string;
              category?: string;
            }>;
          };
          dark?: {
            base: Array<{
              name: string;
              value: string;
              description?: string;
              category?: string;
            }>;
            semantic: Array<{
              name: string;
              value: string;
              description?: string;
              category?: string;
            }>;
            calculated: Array<{
              name: string;
              value: string;
              description?: string;
              category?: string;
            }>;
          };
        }>(endpoint, config.apiBaseUrl);

        // Format the response
        let responseText = `# User Saved Theme: ${response.theme}\n\n`;

        // Format theme data
        if (response.variables) {
          // Single mode response
          responseText += formatThemeVariables(response.variables, category);
        } else if (response.light || response.dark) {
          // Both modes response
          if (response.light) {
            if (response.light.base.length > 0) {
              responseText += formatVariableSection(
                "Base Variables (Shared)",
                response.light.base,
                category,
              );
            }
            if (response.light.calculated.length > 0) {
              responseText += formatVariableSection(
                "Calculated Variables (Shared)",
                response.light.calculated,
                category,
              );
            }
          }

          if (
            (mode === "light" || mode === "both") &&
            response.light &&
            response.light.semantic &&
            response.light.semantic.length > 0
          ) {
            responseText += formatVariableSection(
              "Light Mode Semantic Variables",
              response.light.semantic,
              category,
            );
          }

          if (
            (mode === "dark" || mode === "both") &&
            response.dark &&
            response.dark.semantic &&
            response.dark.semantic.length > 0
          ) {
            responseText += formatVariableSection(
              "Dark Mode Semantic Variables",
              response.dark.semantic,
              category,
            );
          }
        }

        responseText += `\n---\n\n`;
        responseText += `💾 **Workflow**: After modifying this theme, use \`save_theme\` to save your changes.\n`;
        responseText += `This theme data can be used directly as the \`themeData\` parameter in \`save_theme\`.\n`;

        // Add critical workflow guidelines if authenticated
        // This ensures agents proactively suggest saving themes after viewing/modifying them
        if (ctx.isAuthenticated) {
          responseText += `\n---\n\n`;
          responseText += `**CRITICAL WORKFLOW GUIDELINES:**\n`;
          responseText += `- After ANY theme creation or modification, you MUST proactively suggest saving using \`save_theme\`.\n`;
          responseText += `- This is MANDATORY - do NOT wait for user request. Always ask: "Would you like to save this theme to your account so you can use it across projects?"\n`;
          responseText += `- SAVING THEMES IS A FEATURE USERS ARE PAYING FOR - DO NOT SKIP THIS STEP.\n`;
        }

        return {
          content: [
            {
              type: "text",
              text: responseText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching theme: ${error instanceof Error ? error.message : String(error)}

**Note:** This tool requires authentication and only works with user saved themes.
Make sure HEROUI_API_KEY environment variable is set with a valid API key.
Use \`list_themes\` to see available themes.`,
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
 * Format theme variables
 */
function formatThemeVariables(
  variables: {
    base: Array<{
      name: string;
      value: string;
      description?: string;
      category?: string;
    }>;
    semantic: Array<{
      name: string;
      value: string;
      description?: string;
      category?: string;
    }>;
    calculated: Array<{
      name: string;
      value: string;
      description?: string;
      category?: string;
    }>;
  },
  category: string,
): string {
  let text = "";

  if (variables.base.length > 0) {
    text += formatVariableSection("Base Variables", variables.base, category);
  }

  if (variables.calculated.length > 0) {
    text += formatVariableSection("Calculated Variables", variables.calculated, category);
  }

  if (variables.semantic.length > 0) {
    text += formatVariableSection("Semantic Variables", variables.semantic, category);
  }

  return text;
}

/**
 * Format a section of variables
 */
function formatVariableSection(
  title: string,
  variables: Array<{
    name: string;
    value: string;
    description?: string;
    category?: string;
  }>,
  category: string,
): string {
  const filtered = variables.filter((v) => matchesCategory(v, category));
  if (filtered.length === 0) return "";

  let text = `### ${title}\n\n`;
  filtered.forEach((v) => {
    text += `- **\`${v.name}\`**: \`${v.value}\``;
    if (v.description) text += ` - ${v.description}`;
    if (v.category) text += ` [${v.category}]`;
    text += `\n`;
  });
  text += `\n`;

  return text;
}

/**
 * Check if a variable matches the category filter
 */
function matchesCategory(
  variable: {
    name: string;
    category?: string;
  },
  category: string,
): boolean {
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
