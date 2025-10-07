/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

const inputSchema = z.object({
  category: z
    .enum(["colors", "typography", "spacing", "borders", "shadows", "all"])
    .optional()
    .describe(
      `Filter variables by design category:
- "colors": Color tokens (primary, success, danger, background, foreground)
- "typography": Font sizes, weights, line heights
- "spacing": Margin, padding, gap values
- "borders": Border radius, widths, colors
- "shadows": Box shadows and elevations
- "all": Return everything (default)`,
    ),
});

export const getThemeInfoTool: Tool = {
  name: "get_theme_info",
  description: `Get HeroUI Native theme variables and design tokens for customization.
Returns organized CSS variables that control the entire design system.
Use for customizing colors, spacing, typography, borders, shadows.
Apply these in your StyleSheet or inline styles.
Example: colors.primary, spacing[4], typography.fontSizes.md
Category options help filter to specific design aspects.`,

  exec(server, {config, name, description}) {
    const handler = async ({category = "all"}: z.infer<typeof inputSchema>) => {
      try {
        // Build endpoint based on category
        const endpoint = category === "all" ? "/themes/variables" : `/themes/${category}`;

        const response = await fetchApi<any>(endpoint, config.apiBaseUrl);

        // Format the response as structured text
        let responseText = `# HeroUI Native Theme Variables\n\n`;
        responseText += `**Version:** ${response.version || response.latestVersion || "unknown"}\n`;
        responseText += `**Category:** ${category}\n\n`;

        if (response.variables && Array.isArray(response.variables)) {
          responseText += `## Variables\n\n`;
          response.variables.forEach((v: any) => {
            responseText += `- **${v.name}**: \`${v.value}\``;
            if (v.description) responseText += ` - ${v.description}`;
            if (v.category) responseText += ` (${v.category})`;
            responseText += `\n`;
          });
        } else if (response.colors && Array.isArray(response.colors)) {
          responseText += `## Color Variables\n\n`;
          response.colors.forEach((v: any) => {
            responseText += `- **${v.name}**: \`${v.value}\``;
            if (v.description) responseText += ` - ${v.description}`;
            responseText += `\n`;
          });
        } else if (response.typography && Array.isArray(response.typography)) {
          responseText += `## Typography Variables\n\n`;
          response.typography.forEach((v: any) => {
            responseText += `- **${v.name}**: \`${v.value}\``;
            if (v.description) responseText += ` - ${v.description}`;
            responseText += `\n`;
          });
        } else if (response.spacing && Array.isArray(response.spacing)) {
          responseText += `## Spacing Variables\n\n`;
          response.spacing.forEach((v: any) => {
            responseText += `- **${v.name}**: \`${v.value}\``;
            if (v.description) responseText += ` - ${v.description}`;
            responseText += `\n`;
          });
        }

        responseText += `\n## Usage Example\n\n`;
        responseText += `\`\`\`tsx\nimport {useTheme} from 'heroui-native';\n\n`;
        responseText += `const MyComponent = () => {\n`;
        responseText += `  const theme = useTheme();\n`;
        responseText += `  \n`;
        responseText += `  return (\n`;
        responseText += `    <View style={{backgroundColor: theme.colors.background}}>\n`;
        responseText += `      <Text style={{color: theme.colors.primary}}>Themed Text</Text>\n`;
        responseText += `    </View>\n`;
        responseText += `  );\n`;
        responseText += `};\n\`\`\`\n`;

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
