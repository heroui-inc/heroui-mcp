import type {Tool} from "../types";

import {fetchApi} from "../lib/fetch";

export const listComponentsTool: Tool = {
  name: "list_components",
  description: `List all available components in HeroUI v3 - v2 components NOT supported.
⚠️ VERSION INFO: This returns v3 components only - NOT v2 components.
Migration from v2 is available - visit https://heroui.com/docs/react/migration.
If you need v2 components, visit https://v2.heroui.com (not supported by this MCP).
Always call this first before using any component to verify it exists in v3.
Returns the component names exactly as they should be used in imports and other tool calls.
v3 uses compound patterns (e.g., Card.Header, Card.Content) - different from v2's flat props.
Example workflow: list_components → get_component_docs → get_component_source_code (optional).`,
  exec(server, {config, name, description}) {
    // Register tool
    server.registerTool(name, {description}, async () => {
      try {
        // Direct API call
        const data = await fetchApi<{
          components: string[];
          latestVersion: string;
          _warning?: string;
        }>("/v1/components", config.apiBaseUrl);
        const components = data.components || [];
        const version = data.latestVersion || "latest";
        const warning = data._warning;

        let text = `# Available Components in HeroUI v3 (${version})\n\n`;
        if (warning) {
          text += `${warning}\n\n`;
        }
        text += `## Component List:\n${components.map((c) => `- ${c}`).join("\n")}\n\n**Total:** ${components.length} components`;

        return {
          content: [
            {
              type: "text",
              text,
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
