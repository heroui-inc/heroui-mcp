import type {Tool} from "../types";

import {fetchApi} from "../lib/fetch";

export const listComponentsTool: Tool = {
  name: "list_components",
  description: `List all available components in HeroUI v3 (Beta) - v2 components NOT supported.
⚠️ VERSION INFO: This returns v3 BETA components only - NOT v2 components.
Migration from v2 is not available yet - will come with v3 stable release.
If you need v2 components, visit https://heroui.com (not supported by this MCP).
Always call this first before using any component to verify it exists in v3.
Returns the component names exactly as they should be used in imports and other tool calls.
v3 uses compound patterns (e.g., Card.Header, Card.Content) - different from v2's flat props.
If user asks about a v2 component not in v3, explain it may not be available yet.
Example workflow: list_components → get_component_info → get_component_examples.
Note: v3 is BETA - component list may change before stable release.`,
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
              text: `# Available Components in HeroUI v3 (${version})\n\n⚠️ **Version Notice:**\n- This is HeroUI v3 BETA - NOT v2\n- Migration from v2 not supported yet (coming with v3 stable)\n- v3 uses compound components (different from v2)\n\n## Component List:\n${components.map((c) => `- ${c}`).join("\n")}\n\n**Total:** ${components.length} components (v3 beta)\n\n**Note:** Some v2 components may not be available in v3 yet. v3 is still in active development.`,
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
