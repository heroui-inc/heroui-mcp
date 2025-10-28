/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ComponentContext, Tool} from "../types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

export const getComponentExamplesTool: Tool<ComponentContext> = {
  name: "get_component_examples",
  description: `Get complete, working code examples for HeroUI v3 components.
Accepts an array of component names and returns examples for each.
Returns ready-to-use React/TypeScript code demonstrating various use cases.
Examples show COMPOUND COMPONENT patterns - study these carefully.
CRITICAL: Examples demonstrate the ONLY correct way to use components.
Never modify the structure shown in examples (e.g., don't flatten compound components).
Each example includes imports, component usage, and common patterns.
Use this after get_component_info to see practical implementations.
If implementing a component, ALWAYS check examples first to avoid mistakes.
Common mistakes to avoid: Using onClick instead of onPress, flat props instead of compound components.
Workflow: get_component_info → get_component_props → get_component_examples.`,

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
Examples will show compound component usage if applicable.
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
