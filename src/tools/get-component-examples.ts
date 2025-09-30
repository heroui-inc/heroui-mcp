/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ComponentContext, Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

export const getComponentExamplesTool: Tool<ComponentContext> = {
  name: "get_component_examples",
  description: `Get complete, working code examples for a HeroUI v3 component.
Returns ready-to-use React/TypeScript code demonstrating various use cases.
Examples show COMPOUND COMPONENT patterns - study these carefully.
CRITICAL: Examples demonstrate the ONLY correct way to use components.
Never modify the structure shown in examples (e.g., don't flatten compound components).
Each example includes imports, component usage, and common patterns.
Use this after get_component_info to see practical implementations.
If implementing a component, ALWAYS check examples first to avoid mistakes.
Common mistakes to avoid: Using onClick instead of onPress, flat props instead of compound components.
Workflow: get_component_info → get_component_props → get_component_examples.`,

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
        .describe(`Component name exactly as shown in list_components output.
Examples will show compound component usage if applicable.
Study the examples carefully - they show the correct patterns.`),
    });

    const handler = async ({component}: z.infer<typeof inputSchema>) => {
      try {
        // Encode component name to handle special characters and ensure proper URL encoding
        const encodedComponent = encodeURIComponent(component);
        const endpoint = `/components/${encodedComponent}/examples`;

        const data = await fetchApi<{examples: Array<{name: string; content: string}>}>(
          endpoint,
          config.apiBaseUrl,
        );
        const examples = data.examples || [];
        const exampleText =
          examples.length > 0
            ? examples.map((ex) => `// ${ex.name} example\n${ex.content}`).join("\n\n")
            : `No examples available for ${component}`;

        return {
          content: [
            {
              type: "text" as const,
              text: exampleText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Unable to get examples for ${component}. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
