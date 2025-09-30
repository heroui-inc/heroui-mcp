/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ComponentContext, Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

export const getComponentPropsTool: Tool<ComponentContext> = {
  name: "get_component_props",
  description: `Get detailed TypeScript prop definitions for a HeroUI v3 component.
Returns the complete TypeScript interface with all props, types, defaults, and descriptions.
Use this for type-safe implementations and to understand all available options.
IMPORTANT: Props returned are for the React component (@heroui/react), not BEM classes.
These props work with @heroui/react imports only, not @heroui/styles.
Common props include: variant, size, color, isDisabled, className, onPress (not onClick!).
Use after get_component_info to understand specific prop types.
Example output includes interfaces, enums, and detailed prop documentation.
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
        .describe(`The exact component name as returned by list_components.
Must match exactly (case-sensitive): "Button", "Card", etc.
For compound components, use the root component name only.`),
    });

    const handler = async ({component}: z.infer<typeof inputSchema>) => {
      try {
        // Encode component name to handle special characters and ensure proper URL encoding
        const encodedComponent = encodeURIComponent(component);
        const endpoint = `/components/${encodedComponent}/props`;

        const data = await fetchApi<{props: string}>(endpoint, config.apiBaseUrl);
        const propsText = data.props || `No props information available for ${component}`;

        return {
          content: [
            {
              type: "text",
              text: propsText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Unable to get props for ${component}. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
