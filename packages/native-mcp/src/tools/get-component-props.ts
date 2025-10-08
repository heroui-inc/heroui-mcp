/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ComponentContext, Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

export const getComponentPropsTool: Tool<ComponentContext> = {
  name: "get_component_props",
  description: `Get detailed prop definitions for HeroUI Native components.
Accepts an array of component names and returns prop information for each.
Returns the complete prop interface with all props, types, defaults, and descriptions.
Use this for type-safe implementations and to understand all available options.
These props work with HeroUI Native React Native imports.
Common props include: style, onPress, disabled, testID.
Use after get_component_info to understand specific prop types.
Workflow: get_component_info → get_component_props → get_component_examples.`,

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
    // Create input schema with dynamic component enum
    const inputSchema = z.object({
      components: z.array(z.enum(ctx.componentList as [string, ...string[]])).min(1)
        .describe(`Array of component names (case-sensitive).
Examples: ["Button"], ["Card", "TextField"].`),
    });

    const handler = async ({components}: z.infer<typeof inputSchema>) => {
      try {
        const response = await fetchApi<{
          version: string;
          results: Array<{
            component: string;
            props?: string;
            error?: string;
          }>;
        }>("/components/props", config.apiBaseUrl, {
          method: "POST",
          body: JSON.stringify({components}),
        });

        let responseText = "";

        response.results.forEach((result, index) => {
          if (index > 0) responseText += "\n\n---\n\n";

          if (result.error || !result.props) {
            responseText += `# ${result.component} Props\n\n`;
            responseText += `Error: ${result.error || "Props not available"}\n`;
          } else {
            responseText += result.props;
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
              text: `Error: Unable to get props for components. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
