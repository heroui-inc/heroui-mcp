/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ComponentContext, Tool} from "../types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

interface ComponentDocsResponse {
  component: string;
  path: string;
  url: string;
  content: string;
  contentType: string;
}

export const getComponentDocsTool: Tool<ComponentContext> = {
  name: "get_component_docs",
  description: `Get complete HeroUI Native component documentation (including examples, props, usage) directly from v3.heroui.com.
Accepts an array of component names and returns the full MDX documentation for each component.
Returns raw markdown content from the component's .mdx file, which includes:
- Import statements
- Usage examples
- Variants and sizes
- Props documentation
- Styling information
- API Reference
- And more

This tool replaces get_component_info, get_component_props, and get_component_examples.
Use this when you need complete component documentation in one call.
Workflow: list_components → get_component_docs.
Note: Examples are included in the component docs, no separate examples tool needed.`,

  async ctx(shared) {
    return {
      componentList: shared?.componentList || [],
    };
  },

  exec(server, {config, name, description, ctx}) {
    // Create input schema with dynamic component enum
    const inputSchema = z.object({
      components: z.array(z.enum(ctx.componentList as [string, ...string[]])).min(1)
        .describe(`Array of component names from list_components (case-sensitive).
Examples: ["Button"], ["Card", "TextField"], ["Button", "Card", "Tabs"].
DO NOT guess names - always verify with list_components first.`),
    });

    const handler = async ({components}: z.infer<typeof inputSchema>) => {
      try {
        const results = await Promise.all(
          components.map(async (component) => {
            try {
              const data = await fetchApi<ComponentDocsResponse>(
                `/components/${component}/docs`,
                config.apiBaseUrl,
              );

              return {
                success: true as const,
                component,
                url: data.url,
                content: data.content,
                contentType: data.contentType,
              };
            } catch (error: any) {
              const statusCode = error?.status;
              const errorMessage = error instanceof Error ? error.message : "Unknown error";

              return {
                success: false as const,
                component,
                error: errorMessage,
                status: statusCode,
              };
            }
          }),
        );

        let responseText = "";

        results.forEach((result, index) => {
          if (index > 0) responseText += "\n\n---\n\n";

          if (!result.success) {
            responseText += `# ${result.component} Documentation\n\n`;
            responseText += `Error: ${result.error}\n`;
            if (result.status) {
              responseText += `Status: ${result.status}\n`;
            }
          } else {
            responseText += `# ${result.component} Documentation\n\n`;
            responseText += `**URL:** ${result.url}\n\n`;
            responseText += `---\n\n`;
            responseText += result.content;
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
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Unable to get component documentation. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.registerTool(name, {description, inputSchema: inputSchema.shape}, handler as any);
  },
};
