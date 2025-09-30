/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ComponentContext, Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

export const getComponentSourceCodeTool: Tool<ComponentContext> = {
  name: "get_component_source_code",
  description: `Get the actual React/TypeScript source code implementation of a HeroUI v3 component.
Returns the internal implementation for learning purposes or debugging.
Shows how the component is built using React Aria Components.
Use this to understand component internals, not for copying implementation.
The source shows accessibility features, keyboard handling, and ARIA attributes.
Note: For using components, refer to examples via get_component_examples.
IMPORTANT: Do NOT copy this code directly - use the component via @heroui/react imports.
This shows v3 alpha implementation which uses React Aria Components as foundation.
GitHub links are provided for viewing the source in context.`,
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
        .describe(`Component name from list_components to view source code.
This shows internal implementation - use get_component_examples for usage.`),
    });

    const handler = async ({component}: z.infer<typeof inputSchema>) => {
      try {
        // Encode component name to handle special characters
        const encodedComponent = encodeURIComponent(component);
        const sourceEndpoint = `/components/${encodedComponent}/source`;

        const sourceResponse = await fetchApi<{
          component: string;
          version: string;
          filePath: string;
          sourceCode: string;
          githubUrl: string;
        }>(sourceEndpoint, config.apiBaseUrl);

        let responseText = `# ${component} Component Source Code\n\n`;
        responseText += `## React/TypeScript Source\n`;
        responseText += `**File:** \`${sourceResponse.filePath}\`\n`;
        responseText += `**GitHub:** [View on GitHub](${sourceResponse.githubUrl})\n\n`;
        responseText += `\`\`\`tsx\n${sourceResponse.sourceCode}\n\`\`\`\n`;

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
                text: `Source code not available for ${component}. The component may not have source code in the repository.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Unable to get source code for ${component}. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
