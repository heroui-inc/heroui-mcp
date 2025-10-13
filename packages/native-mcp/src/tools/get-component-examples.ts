/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ComponentContext, Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

export const getComponentExamplesTool: Tool<ComponentContext> = {
  name: "get_component_examples",
  description: `Get complete, working code examples for HeroUI Native components.
Accepts an array of example file names and returns the example code for each.
Returns ready-to-use React Native/TypeScript code demonstrating various use cases.
Each example includes imports, component usage, and common patterns.
Use this after get_component_info to see practical implementations.
If implementing a component, ALWAYS check examples first to avoid mistakes.
Common patterns include styling, event handling, and state management.
Note: Example files use kebab-case naming (e.g., "dialog", "dialog-native-modal", "drop-shadow-view").`,

  async ctx() {
    try {
      const data = await fetchApi<{components: string[]; examples: string[]}>("/components");

      return {
        componentList: data.components || [],
        exampleList: data.examples || [],
      };
    } catch (error) {
      console.error("Failed to fetch component list:", error);

      return {
        componentList: [],
        exampleList: [],
      };
    }
  },

  exec(server, {config, name, description, ctx}) {
    // Create input schema with dynamic example enum
    const inputSchema = z.object({
      examples: z.array(z.enum(ctx.exampleList as [string, ...string[]])).min(1)
        .describe(`Array of example names (kebab-case, without .tsx extension).
Examples: "dialog", "dialog-native-modal", "drop-shadow-view", "button".
Study the examples carefully - they show the correct React Native patterns.`),
    });

    const handler = async ({examples}: z.infer<typeof inputSchema>) => {
      try {
        const response = await fetchApi<{
          version: string;
          results: Array<{
            example: string;
            content?: string;
            error?: string;
          }>;
          dependencies?: Array<{
            name: string;
            path: string;
            content: string;
          }>;
        }>("/components/examples", config.apiBaseUrl, {
          method: "POST",
          body: JSON.stringify({examples}),
        });

        let responseText = "";

        // Render main examples
        response.results.forEach((result, index) => {
          if (index > 0) responseText += "\n\n---\n\n";

          if (result.error || !result.content) {
            responseText += `# ${result.example} Example\n\n`;
            responseText += `Error: ${result.error || "Example not available"}\n`;
          } else {
            responseText += `// ${result.example} example\n${result.content}`;
          }
        });

        // Add dependencies section if provided by API
        if (response.dependencies && response.dependencies.length > 0) {
          responseText += "\n\n---\n\n";
          responseText += "# Shared Dependencies\n\n";
          responseText += "The following components are imported by the examples above:\n\n";

          response.dependencies.forEach((dep, index) => {
            if (index > 0) responseText += "\n\n---\n\n";
            responseText += `// ${dep.name} (${dep.path})\n${dep.content}`;
          });
        }

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
              text: `Error: Unable to get examples. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
