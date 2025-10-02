/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ComponentContext, Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

export const getComponentSourceStylesTool: Tool<ComponentContext> = {
  name: "get_component_source_styles",
  description: `Get the CSS styles and BEM classes for HeroUI v3 components.
Accepts an array of component names and returns styles for each.
Returns the complete CSS implementation including all variants and states.
Shows BEM class structure (e.g., .button, .button--accent, .button--disabled).
IMPORTANT: These are framework-agnostic styles from @heroui/styles package.
DO NOT mix BEM classes with React components - choose one approach:
- Use @heroui/react for full React components with accessibility
- Use @heroui/styles for CSS-only styling without JavaScript
BEM classes provide styling only - no JavaScript behavior or accessibility.
For production use, prefer @heroui/react components for full functionality.
GitHub links are provided for viewing styles in context.`,

  async ctx() {
    try {
      const data = await fetchApi<{components: string[]}>("/components");

      return {
        componentList: data.components || [],
      };
    } catch (error) {
      console.error("Failed to fetch component list:", error);

      // Return empty list as fallback
      return {
        componentList: [],
      };
    }
  },

  exec(server, {config, name, description, ctx}) {
    // Create input schema with dynamic component enum
    const inputSchema = z.object({
      components: z.array(z.enum(ctx.componentList as [string, ...string[]])).min(1)
        .describe(`Array of component names from list_components.
These are BEM classes from @heroui/styles - not for use with React components.`),
    });

    const handler = async ({components}: z.infer<typeof inputSchema>) => {
      try {
        const response = await fetchApi<{
          version: string;
          results: Array<{
            component: string;
            filePath?: string;
            stylesCode?: string;
            githubUrl?: string;
            error?: string;
          }>;
        }>("/components/styles", config.apiBaseUrl, {
          method: "POST",
          body: JSON.stringify({components}),
        });

        let responseText = "";

        response.results.forEach((result, index) => {
          if (index > 0) responseText += "\n\n---\n\n";

          if (result.error || !result.stylesCode) {
            responseText += `# ${result.component} Component Styles\n\n`;
            responseText += `Error: ${result.error || "Styles not available"}\n`;
          } else {
            responseText += `# ${result.component} Component Styles\n\n`;
            responseText += `## CSS Styles\n`;
            responseText += `**File:** \`${result.filePath}\`\n`;
            responseText += `**GitHub:** [View on GitHub](${result.githubUrl})\n\n`;
            responseText += `\`\`\`css\n${result.stylesCode}\n\`\`\`\n`;
          }
        });

        return {
          content: [
            {
              type: "text" as const,
              text: responseText,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Unable to get styles for components. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
