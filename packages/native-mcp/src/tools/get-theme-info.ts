/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ThemeContext, Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

export const getThemeInfoTool: Tool<ThemeContext> = {
  name: "get_theme_info",
  description: `Get HeroUI Native theme colors and design tokens.
Returns theme colors in HSL format for light and dark modes.
Custom themes (if any) are example implementations for reference only - they demonstrate how to create custom themes but are not included in the package.
Use this tool to understand theme structure and color token organization.`,

  async ctx() {
    try {
      const data = await fetchApi<{themes: string[]}>("/themes");

      return {
        themeList: data.themes || ["default"],
      };
    } catch (error) {
      console.error("Failed to fetch theme list:", error);

      return {
        themeList: ["default"],
      };
    }
  },

  exec(server, {config, name, description, ctx}) {
    // Create input schema with dynamic theme enum
    const inputSchema = z.object({
      theme: z
        .enum(ctx.themeList as [string, ...string[]])
        .optional()
        .describe(
          `Theme name. Defaults to "default".
${ctx.themeList.length > 1 ? `Additional themes available: ${ctx.themeList.filter((t) => t !== "default").join(", ")} (example implementations for reference only).` : ""}
Leave empty to use default theme.`,
        ),
      mode: z
        .enum(["light", "dark", "both"])
        .optional()
        .describe(
          `Color mode: "light", "dark", or "both" (default).
Returns color tokens for the specified mode(s).`,
        ),
    });

    const handler = async ({theme = "default", mode = "both"}: z.infer<typeof inputSchema>) => {
      try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append("theme", theme);
        if (mode !== "both") params.append("mode", mode);

        const endpoint = `/themes/variables?${params.toString()}`;
        const response = await fetchApi<any>(endpoint, config.apiBaseUrl);

        // Format the response as structured text
        let responseText = `# HeroUI Native Theme\n\n`;
        responseText += `**Theme:** ${response.theme}\n`;
        responseText += `**Version:** ${response.version || "unknown"}\n`;

        // Add note for custom themes
        if (response.theme !== "default") {
          responseText += `\n> **Note:** This is an example theme for reference only. It is not included in the @heroui-native/core package. Use it as inspiration for creating your own custom themes.\n`;
        }

        responseText += `\n`;

        // Format colors by mode
        if (mode === "light" || mode === "both") {
          if (response.light?.colors || response.colors) {
            const colors = response.light?.colors || response.colors;
            responseText += `## Light Mode Colors\n\n`;

            // Group by category
            const grouped = groupByCategory(colors);
            for (const [category, tokens] of Object.entries(grouped)) {
              responseText += `### ${capitalize(category)}\n`;
              tokens.forEach((c: any) => {
                responseText += `- **${c.name}**: \`${c.value}\` (HSL)\n`;
              });
              responseText += `\n`;
            }
          }
        }

        if (mode === "dark" || mode === "both") {
          if (response.dark?.colors || response.colors) {
            const colors = response.dark?.colors || response.colors;
            responseText += `## Dark Mode Colors\n\n`;

            // Group by category
            const grouped = groupByCategory(colors);
            for (const [category, tokens] of Object.entries(grouped)) {
              responseText += `### ${capitalize(category)}\n`;
              tokens.forEach((c: any) => {
                responseText += `- **${c.name}**: \`${c.value}\` (HSL)\n`;
              });
              responseText += `\n`;
            }
          }
        }

        // Add utilities if both modes returned
        if (mode === "both" && response.borderRadius) {
          responseText += `## Border Radius\n`;
          Object.entries(response.borderRadius).forEach(([key, value]) => {
            responseText += `- **${key}**: \`${value}\`\n`;
          });
          responseText += `\n`;

          responseText += `## Opacity\n`;
          responseText += `- **disabled**: \`${response.opacity?.disabled || 0.5}\`\n`;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: responseText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Unable to get theme information. ${error instanceof Error ? error.message : "Unknown error"}`,
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
 * Group colors by category
 */
function groupByCategory(colors: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {
    base: [],
    semantic: [],
    status: [],
    surface: [],
    utility: [],
  };

  colors.forEach((color) => {
    const category = color.category || "semantic";
    if (grouped[category]) {
      grouped[category].push(color);
    } else {
      grouped.semantic.push(color);
    }
  });

  // Remove empty categories
  return Object.fromEntries(Object.entries(grouped).filter(([, tokens]) => tokens.length > 0));
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
