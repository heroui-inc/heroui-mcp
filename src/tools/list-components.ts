import type {Tool} from "./types.js";

import {z} from "zod";

import {wrapWithAnalytics} from "../lib/tool-analytics-wrapper.js";

const inputSchema = z.object({
  library: z.enum(["heroui", "native"]).describe("The library to list components from"),
  version: z
    .string()
    .optional()
    .describe(
      "Specific version to use (e.g., 'v3.0.0-alpha.3'). Defaults to latest if not specified",
    ),
});

export const listComponentsTool: Tool = {
  name: "list_components",
  description: "List all available components in HeroUI or HeroUI Native",

  exec(server, {config, name, description}) {
    const handler = async ({library, version}: z.infer<typeof inputSchema>) => {
      try {
        let components: string[];

        if (config.dataService) {
          // Use R2 data service
          components = await config.dataService.listComponents(library, version);
        } else {
          // Fallback to local fetch
          const {fetchComponentList} = await import("../lib/fetch.js");
          components = await fetchComponentList(library, version, config.apiBaseUrl);
        }

        const libraryName = library === "heroui" ? "HeroUI" : "HeroUI Native";
        const versionText = version ? ` (${version})` : " (latest)";

        return {
          content: [
            {
              type: "text",
              text: `Available Components in ${libraryName}${versionText}\n\n${components.map((c) => `- ${c}`).join("\n")}\n\nTotal: ${components.length} components`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Unable to list components for ${library}. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool with analytics wrapper
    server.tool(name, description, inputSchema, wrapWithAnalytics(server, name, handler));
  },
};
