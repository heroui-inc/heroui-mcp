/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ComponentContext, Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

export const getComponentPropsTool: Tool<ComponentContext> = {
  name: "get_component_props",
  description: `Get detailed TypeScript prop definitions for HeroUI v3 components.
Accepts an array of component names and returns prop information for each.
Returns the complete TypeScript interface with all props, types, defaults, and descriptions.
Use this for type-safe implementations and to understand all available options.
IMPORTANT: Props returned are for the React component (@heroui/react), not BEM classes.
These props work with @heroui/react imports only, not @heroui/styles.
Common props include: variant, size, color, isDisabled, className, onPress (not onClick!).
Use after get_component_info to understand specific prop types.
Example output includes interfaces, enums, and detailed prop documentation.
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
Examples: ["Button"], ["Card", "TextField"].
For compound components, use the root component name only.`),
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
              type: "text",
              text: responseText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
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
