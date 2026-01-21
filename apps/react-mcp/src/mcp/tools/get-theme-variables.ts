/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "../types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

const inputSchema = z.object({});

export const getThemeVariablesTool: Tool = {
  name: "get_theme_variables",
  description: `Get HeroUI v3 default theme variables and design tokens (actual variable values).
Includes both light and dark mode variables for all categories:
- Colors: Color tokens (accent, success, danger, background, foreground)
- Typography: Font sizes, weights, line heights
- Spacing: Margin, padding, gap values
- Borders: Border radius, widths, colors
- Shadows: Box shadows and elevations
- Animations: Durations, timing functions
Variables use modern oklch() color format for better color manipulation.
Apply these in your CSS with :root or theme-specific selectors.
Example variables: --color-accent, --radius-md, --font-size-body, --spacing-4.
For theme documentation and guides, use the get_docs tool instead.
IMPORTANT: HeroUI v3 uses Tailwind CSS v4 - ensure compatibility.`,
  exec(server, {config, name, description}) {
    const handler = async () => {
      try {
        const response = await fetchApi<any>("/v1/themes/variables?theme=default", config.apiBaseUrl);

        // Format the response as structured text
        let responseText = `# HeroUI Default Theme Variables\n\n`;
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

  // Handle optimized structure (with common variables)
  if (themeData.common) {
    // Format common variables
    if (themeData.common.base?.length > 0 || themeData.common.calculated?.length > 0) {
      text += `## Common Variables (Shared)\n\n`;

      if (themeData.common.base?.length > 0) {
        text += `### Base Variables\n`;
        themeData.common.base.forEach((v: any) => {
          text += `- **${v.name}**: ${v.value}`;
          if (v.description) text += ` - ${v.description}`;
          text += `\n`;
        });
        text += `\n`;
      }

      if (themeData.common.calculated?.length > 0) {
        text += `### Calculated Variables\n`;
        themeData.common.calculated.forEach((v: any) => {
          text += `- **${v.name}**: ${v.value}`;
          if (v.description) text += ` - ${v.description}`;
          text += `\n`;
        });
        text += `\n`;
      }
    }

    // Format mode-specific semantic variables
    if (themeData.light?.semantic?.length > 0) {
      text += `## Light Mode Semantic Variables\n\n`;
      themeData.light.semantic.forEach((v: any) => {
        text += `- **${v.name}**: ${v.value}`;
        if (v.description) text += ` - ${v.description}`;
        text += `\n`;
      });
      text += `\n`;
    }

    if (themeData.dark?.semantic?.length > 0) {
      text += `## Dark Mode Semantic Variables\n\n`;
      themeData.dark.semantic.forEach((v: any) => {
        text += `- **${v.name}**: ${v.value}`;
        if (v.description) text += ` - ${v.description}`;
        text += `\n`;
      });
      text += `\n`;
    }
  } else if (themeData.variables) {
    // Handle old structure
    if (themeData.variables.base?.length > 0) {
      text += formatThemeVariables("Base Variables", themeData.variables.base);
    }
    if (themeData.variables.semantic?.length > 0) {
      text += formatThemeVariables("Semantic Variables", themeData.variables.semantic);
    }
    if (themeData.variables.calculated?.length > 0) {
      text += formatThemeVariables("Calculated Variables", themeData.variables.calculated);
    }
  }

  return text;
}

/**
 * Format theme variables for display (array of variables)
 */
function formatThemeVariables(title: string, variables: any[]): string {
  let text = `## ${title}\n\n`;

  variables.forEach((v: any) => {
    text += `- **${v.name}**: ${v.value}`;
    if (v.description) text += ` - ${v.description}`;
    text += `\n`;
  });

  text += `\n`;

  return text;
}
