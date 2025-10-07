/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ComponentContext, Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

export const getComponentExamplesTool: Tool<ComponentContext> = {
  name: "get_component_examples",
  description: `Get complete, working code examples for HeroUI Native components.
Accepts an array of component names and returns examples for each.
Returns ready-to-use React Native/TypeScript code demonstrating various use cases.
Each example includes imports, component usage, and common patterns.
Use this after get_component_info to see practical implementations.
If implementing a component, ALWAYS check examples first to avoid mistakes.
Common patterns include styling, event handling, and state management.
Workflow: get_component_info → get_component_props → get_component_examples.`,

  async ctx() {
    try {
      const data = await fetchApi<{components: string[]}>("/components");

      return {
        componentList: data.components || [],
      };
    } catch (error) {
      console.error("Failed to fetch component list:", error);

      return {
        componentList: [],
      };
    }
  },

  exec(server, {config, name, description, ctx}) {
    // Create input schema with dynamic component enum
    const inputSchema = z.object({
      components: z.array(z.enum(ctx.componentList as [string, ...string[]])).min(1)
        .describe(`Array of component names from list_components (case-sensitive).
Examples will show React Native usage patterns.
Study the examples carefully - they show the correct patterns.`),
    });

    const handler = async ({components}: z.infer<typeof inputSchema>) => {
      try {
        const response = await fetchApi<{
          version: string;
          results: Array<{
            component: string;
            examples?: Array<{name: string; content: string}>;
            error?: string;
          }>;
        }>("/components/examples", config.apiBaseUrl, {
          method: "POST",
          body: JSON.stringify({components}),
        });

        let responseText = "";

        response.results.forEach((result, index) => {
          if (index > 0) responseText += "\n\n---\n\n";

          if (result.error || !result.examples) {
            responseText += `# ${result.component} Examples\n\n`;
            responseText += `Error: ${result.error || "Examples not available"}\n`;
          } else {
            result.examples.forEach((ex, exIndex) => {
              if (exIndex > 0) responseText += "\n\n";
              responseText += `// ${ex.name} example\n${ex.content}`;
            });
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
              text: `Error: Unable to get examples for components. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};