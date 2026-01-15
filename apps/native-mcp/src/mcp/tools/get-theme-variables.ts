/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "../types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

const inputSchema = z.object({});

export const getThemeVariablesTool: Tool = {
  name: "get_theme_variables",
  description: `Get HeroUI Native default theme variables and design tokens (actual variable values).
Returns organized CSS custom properties that control the entire design system.
Variables follow a three-layer system: primitives → semantic → calculated.
Includes both light and dark mode variables for all categories:
- Colors: Color tokens (accent, success, danger, background, foreground)
- Typography: Font sizes, weights, line heights
- Spacing: Margin, padding, gap values
- Borders: Border radius, widths, colors
- Shadows: Box shadows and elevations
- Animations: Durations, timing functions
Variables use modern HSL color format for better color manipulation.
Apply these in your CSS with :root or theme-specific selectors.
Example variables: --color-accent, --radius-md, --font-size-body, --spacing-4.
For theme documentation and guides, use the get_docs tool instead.
IMPORTANT: HeroUI Native uses Uniwind (Tailwind CSS for React Native) - ensure compatibility.`,

  exec(server, {config, name, description}) {
    const handler = async () => {
      try {
        // Always fetch default theme with both modes
        const response = await fetchApi<any>("/themes/variables?theme=default", config.apiBaseUrl);

        // Format the response as structured text
        let responseText = `# HeroUI Native Default Theme Variables\n\n`;
        responseText += `**Theme:** ${response.theme || "default"}\n\n`;

        responseText += formatThemeData(response);

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
              text: `Error fetching theme variables: ${error instanceof Error ? error.message : String(error)}`,
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
 * Format theme data - always shows both modes and all categories
 */
function formatThemeData(themeData: any): string {
  let text = "";

  // Format light mode colors
  if (themeData.light?.colors?.length > 0) {
    text += `## Light Mode Colors\n\n`;
    const grouped = groupByCategory(themeData.light.colors);
    for (const [category, tokens] of Object.entries(grouped)) {
      text += `### ${capitalize(category)}\n`;
      tokens.forEach((c: any) => {
        text += `- **${c.name}**: \`${c.value}\`\n`;
      });
      text += `\n`;
    }
  }

  // Format dark mode colors
  if (themeData.dark?.colors?.length > 0) {
    text += `## Dark Mode Colors\n\n`;
    const grouped = groupByCategory(themeData.dark.colors);
    for (const [category, tokens] of Object.entries(grouped)) {
      text += `### ${capitalize(category)}\n`;
      tokens.forEach((c: any) => {
        text += `- **${c.name}**: \`${c.value}\`\n`;
      });
      text += `\n`;
    }
  }

  // Format border radius
  if (themeData.borderRadius) {
    text += `## Border Radius\n\n`;
    Object.entries(themeData.borderRadius).forEach(([key, value]) => {
      text += `- **${key}**: \`${value}\`\n`;
    });
    text += `\n`;
  }

  // Format opacity
  if (themeData.opacity) {
    text += `## Opacity\n\n`;
    Object.entries(themeData.opacity).forEach(([key, value]) => {
      text += `- **${key}**: \`${value}\`\n`;
    });
    text += `\n`;
  }

  return text;
}

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
