/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ThemeContext, Tool} from "../types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

export const getThemeVariablesTool: Tool<ThemeContext> = {
  name: "get_theme_variables",
  description: `Get HeroUI Native theme variables and design tokens.
Returns theme variable values (colors, border radius, opacity) in HSL format for light and dark modes.
Use this tool to get actual theme variable values for customization.
For theme documentation and guides, use get_docs({ path: "/docs/native/getting-started/theming" }) instead.`,

  async ctx(shared) {
    return {
      themeList: shared?.themeList || ["default"],
    };
  },

  exec(server, {config, name, description}) {
    // Create input schema with dynamic theme enum
    const inputSchema = z.object({
      theme: z
        .enum(["default"] as [string, ...string[]])
        .optional()
        .describe(
          `Theme name. Only "default" theme is supported. Defaults to "default" if not specified.`,
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
        responseText += `**Theme:** ${response.theme || "default"}\n`;
        responseText += `**Version:** ${response.version || "unknown"}\n\n`;

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
              text: `Error: Unable to get theme variables. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.registerTool(name, {description, inputSchema: inputSchema.shape}, handler as any);
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
