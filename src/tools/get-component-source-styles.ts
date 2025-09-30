/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ComponentContext, Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

export const getComponentSourceStylesTool: Tool<ComponentContext> = {
  name: "get_component_source_styles",
  description: `Get the CSS styles and BEM classes for a HeroUI v3 component.
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
      component: z.enum(ctx.componentList as [string, ...string[]])
        .describe(`Component name from list_components to view CSS styles.
These are BEM classes from @heroui/styles - not for use with React components.`),
    });

    const handler = async ({component}: z.infer<typeof inputSchema>) => {
      try {
        // Encode component name to handle special characters
        const encodedComponent = encodeURIComponent(component);
        const stylesEndpoint = `/components/${encodedComponent}/styles`;

        const stylesResponse = await fetchApi<{
          component: string;
          version: string;
          filePath: string;
          stylesCode: string;
          githubUrl: string;
        }>(stylesEndpoint, config.apiBaseUrl);

        let responseText = `# ${component} Component Styles\n\n`;
        responseText += `## CSS Styles\n`;
        responseText += `**File:** \`${stylesResponse.filePath}\`\n`;
        responseText += `**GitHub:** [View on GitHub](${stylesResponse.githubUrl})\n\n`;
        responseText += `\`\`\`css\n${stylesResponse.stylesCode}\n\`\`\`\n`;

        return {
          content: [
            {
              type: "text" as const,
              text: responseText,
            },
          ],
        };
      } catch (error: any) {
        if (error.status === 404) {
          return {
            content: [
              {
                type: "text" as const,
                text: `CSS styles not available for ${component}. The component may not have styles in the repository.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Unable to get styles for ${component}. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
