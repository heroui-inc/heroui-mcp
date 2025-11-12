/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "../types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

const inputSchema = z.object({
  theme: z
    .string()
    .optional()
    .describe(
      `Theme name (default: "default").
Currently only "default" theme is available in HeroUI v3 beta.
Leave empty to see all available themes.`,
    ),
  mode: z.enum(["light", "dark", "both"]).optional()
    .describe(`Color mode: "light" for light theme, "dark" for dark theme, "both" for all modes.
HeroUI v3 supports automatic dark mode with [data-theme="dark"] or .dark class.
Defaults to 'both' to show all available variables.`),
  category: z
    .enum(["colors", "typography", "spacing", "borders", "shadows", "animations", "all"])
    .optional().describe(`Filter variables by design category:
- "colors": Color tokens (accent, success, danger, background, foreground)
- "typography": Font sizes, weights, line heights
- "spacing": Margin, padding, gap values
- "borders": Border radius, widths, colors
- "shadows": Box shadows and elevations
- "animations": Durations, timing functions
- "all": Return everything (default)`),
});

export const getThemeInfoTool: Tool = {
  name: "get_theme_info",
  description: `Get HeroUI v3 theme CSS variables and design tokens for customization.
Returns organized CSS custom properties that control the entire design system.
Variables follow a three-layer system: primitives → semantic → calculated.
Use for customizing colors, spacing, typography, borders, shadows, animations.
Variables use modern oklch() color format for better color manipulation.
Apply these in your CSS with :root or theme-specific selectors.
Example variables: --color-accent, --radius-md, --font-size-body, --spacing-4.
Category options help filter to specific design aspects.
Mode options (light/dark) show theme-specific values.
IMPORTANT: HeroUI v3 uses Tailwind CSS v4 - ensure compatibility.`,
  exec(server, {config, name, description}) {
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

        try {
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
          } else if (response.common) {
            // Legacy handling for direct structure
            responseText += formatThemeData(response, mode, category);
          } else {
            // Fallback to old structure
            responseText += `**Mode:** ${response.mode || mode}\n\n`;

            if (response.variables?.light && (mode === "light" || mode === "both")) {
              responseText += formatThemeVariables(
                "Light Mode",
                response.variables.light,
                category,
              );
            }

            if (response.variables?.dark && (mode === "dark" || mode === "both")) {
              responseText += formatThemeVariables("Dark Mode", response.variables.dark, category);
            }
          }

          return {
            content: [
              // TODO: Add a explanation message which add context about each category/token purpose
              // e.g
              /*
               * {
               *  type: "text",
               *  text: `[EXPLAIN TOKENS PURPOSE/CATEGORIES/ETC]`
               * },
               */
              {
                type: "text",
                text: responseText,
              },
            ],
          };
        } catch (error: any) {
          if (error.status === 404) {
            // Fetch available themes dynamically
            try {
              const themesResponse = await fetchApi<any>("/themes", config.apiBaseUrl);
              const availableThemes = themesResponse.themes
                ? Object.keys(themesResponse.themes).join(", ")
                : "none";
              throw new Error(`Theme "${theme}" not found. Available themes: ${availableThemes}`);
            } catch (error: any) {
              console.error(error);
              // Fallback if fetching themes fails
              throw new Error(`Theme "${theme}" not found. Unable to fetch available themes.`);
            }
          }
          throw error;
        }
      } catch (error) {
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
 * Format theme data with optimized structure
 */
function formatThemeData(themeData: any, mode: string, category: string): string {
  let text = "";

  // Handle optimized structure (with common variables)
  if (themeData.common) {
    text += `**Structure:** Optimized (common variables extracted)\n\n`;

    // Format common variables
    if (themeData.common.base?.length > 0 || themeData.common.calculated?.length > 0) {
      text += `### Common Variables (Shared)\n\n`;

      if (themeData.common.base?.length > 0 && (category === "all" || category !== "animations")) {
        text += `#### Base Variables\n`;
        themeData.common.base.forEach((v: any) => {
          if (category === "all" || matchesCategory(v, category)) {
            text += `- **${v.name}**: ${v.value}`;
            if (v.description) text += ` - ${v.description}`;
            text += `\n`;
          }
        });
        text += `\n`;
      }

      if (themeData.common.calculated?.length > 0) {
        text += `#### Calculated Variables\n`;
        themeData.common.calculated.forEach((v: any) => {
          if (category === "all" || matchesCategory(v, category)) {
            text += `- **${v.name}**: ${v.value}`;
            if (v.description) text += ` - ${v.description}`;
            text += `\n`;
          }
        });
        text += `\n`;
      }
    }

    // Format mode-specific semantic variables
    if (mode === "light" || mode === "both") {
      if (themeData.light?.semantic?.length > 0) {
        text += `### Light Mode Semantic Variables\n\n`;
        themeData.light.semantic.forEach((v: any) => {
          if (category === "all" || matchesCategory(v, category)) {
            text += `- **${v.name}**: ${v.value}`;
            if (v.description) text += ` - ${v.description}`;
            text += `\n`;
          }
        });
        text += `\n`;
      }
    }

    if (mode === "dark" || mode === "both") {
      if (themeData.dark?.semantic?.length > 0) {
        text += `### Dark Mode Semantic Variables\n\n`;
        themeData.dark.semantic.forEach((v: any) => {
          if (category === "all" || matchesCategory(v, category)) {
            text += `- **${v.name}**: ${v.value}`;
            if (v.description) text += ` - ${v.description}`;
            text += `\n`;
          }
        });
        text += `\n`;
      }
    }
  } else if (themeData.variables) {
    // Handle old structure
    if (themeData.mode) {
      text += `**Mode:** ${themeData.mode}\n\n`;
    }

    if (themeData.variables.base?.length > 0) {
      text += formatThemeVariables("Base Variables", themeData.variables.base, category);
    }
    if (themeData.variables.semantic?.length > 0) {
      text += formatThemeVariables("Semantic Variables", themeData.variables.semantic, category);
    }
    if (themeData.variables.calculated?.length > 0) {
      text += formatThemeVariables(
        "Calculated Variables",
        themeData.variables.calculated,
        category,
      );
    }
  }

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

/**
 * Format theme variables for display (array of variables)
 */
function formatThemeVariables(title: string, variables: any[], category: string): string {
  let text = `### ${title}\n\n`;

  variables.forEach((v: any) => {
    if (category === "all" || matchesCategory(v, category)) {
      text += `- **${v.name}**: ${v.value}`;
      if (v.description) text += ` - ${v.description}`;
      text += `\n`;
    }
  });

  text += `\n`;

  return text;
}
