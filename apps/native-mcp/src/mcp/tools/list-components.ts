import type {Tool} from "../types";

import {fetchApi} from "../lib/fetch";

export const listComponentsTool: Tool = {
  name: "list_components",
  description: `List all available components in HeroUI Native.
Returns the component names exactly as they should be used in imports and other tool calls.
HeroUI Native components are React Native components for mobile development.
Always call this first before using any component to verify it exists.
Example workflow: list_components → get_component_info → get_component_examples.`,
  exec(server, {config, name, description}) {
    // Register tool
    server.tool(name, description, {}, async () => {
      try {
        // Direct API call
        const data = await fetchApi<{components: string[]; latestVersion: string}>(
          "/components",
          config.apiBaseUrl,
        );
        const components = data.components || [];
        const version = data.latestVersion || "latest";

        return {
          content: [
            {
              type: "text",
              text: `# Available Components in HeroUI Native (${version})\n\n## Component List:\n${components.map((c) => `- ${c}`).join("\n")}\n\n**Total:** ${components.length} components\n\n**Note:** HeroUI Native provides React Native components for building mobile applications.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Unable to list components. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    });
  },
};
