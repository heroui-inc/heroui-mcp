/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ComponentContext, Tool} from "../types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

export const getComponentSourceCodeTool: Tool<ComponentContext> = {
  name: "get_component_source_code",
  description: `Get the actual React/TypeScript source code implementation of HeroUI v3 components.
Accepts an array of component names and returns source code for each.
Returns the internal implementation for learning purposes or debugging.
Shows how the component is built using React Aria Components.
Use this to understand component internals, not for copying implementation.
The source shows accessibility features, keyboard handling, and ARIA attributes.
Note: For using components, refer to examples via get_component_examples.
IMPORTANT: Do NOT copy this code directly - use the component via @heroui/react imports.
This shows v3 beta implementation which uses React Aria Components as foundation.
GitHub links are provided for viewing the source in context.`,
  async ctx(shared) {
    return {
      componentList: shared?.componentList || [],
    };
  },
  exec(server, {config, name, description, ctx}) {
    // Create input schema with dynamic component enum
    const inputSchema = z.object({
      components: z.array(z.enum(ctx.componentList as [string, ...string[]])).min(1)
        .describe(`Array of component names from list_components.
This shows internal implementation - use get_component_examples for usage.`),
    });

    const handler = async ({components}: z.infer<typeof inputSchema>) => {
      try {
        const response = await fetchApi<{
          version: string;
          results: Array<{
            component: string;
            filePath?: string;
            sourceCode?: string;
            githubUrl?: string;
            error?: string;
          }>;
        }>("/components/source", config.apiBaseUrl, {
          method: "POST",
          body: JSON.stringify({components}),
        });

        let responseText = "";

        response.results.forEach((result, index) => {
          if (index > 0) responseText += "\n\n---\n\n";

          if (result.error || !result.sourceCode) {
            responseText += `# ${result.component} Component Source Code\n\n`;
            responseText += `Error: ${result.error || "Source code not available"}\n`;
          } else {
            responseText += `# ${result.component} Component Source Code\n\n`;
            responseText += `## React/TypeScript Source\n`;
            responseText += `**File:** \`${result.filePath}\`\n`;
            responseText += `**GitHub:** [View on GitHub](${result.githubUrl})\n\n`;
            responseText += `\`\`\`tsx\n${result.sourceCode}\n\`\`\`\n`;
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
              text: `Error: Unable to get source code for components. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
