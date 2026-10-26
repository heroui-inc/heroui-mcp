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
Note: For using components, refer to examples via get_component_docs.
IMPORTANT: Do NOT copy this code directly - use the component via @heroui/react imports.
This shows v3 implementation which uses React Aria Components as foundation.
GitHub links are provided for viewing the source in context.`,
  async ctx(shared) {
    return {
      componentList: shared?.componentList || [],
    };
  },
  exec(server, {config, name, description, ctx}) {
    // Keep tools usable if the component list could not be fetched at startup.
    const componentSchema = ctx.componentList.length
      ? z.enum(ctx.componentList as [string, ...string[]])
      : z.string().min(1);
    const inputSchema = z.object({
      components: z.array(componentSchema).min(1)
        .describe(`Array of component names from list_components.
This shows internal implementation - use get_component_docs for usage examples.`),
    });

    const handler = async (
      {components}: z.infer<typeof inputSchema>,
      {signal}: {signal: AbortSignal},
    ) => {
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
          _warning?: string;
        }>("/v1/components/source", config.apiBaseUrl, {
          signal,
          method: "POST",
          body: JSON.stringify({components}),
        });

        let responseText = "";
        if (response._warning) {
          responseText += `${response._warning}\n\n`;
        }

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
    server.registerTool(name, {description, inputSchema: inputSchema.shape}, handler as any);
  },
};
