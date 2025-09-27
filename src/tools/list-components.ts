/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

const inputSchema = z.object({
  library: z.enum(["heroui", "native"]).describe("The library to list components from"),
  version: z
    .string()
    .optional()
    .describe(
      "Specific version to use (e.g., 'v3.0.0-alpha.31'). Defaults to latest if not specified",
    ),
});

export const listComponentsTool: Tool = {
  name: "list_components",
  description: "List all available components in HeroUI or HeroUI Native",

  exec(server, {config, name, description}) {
    const handler = async ({library, version}: z.infer<typeof inputSchema>) => {
      try {
        // Direct API call
        const endpoint = `/components/${library}${version ? `?version=${version}` : ""}`;
        const data = await fetchApi<{components: string[]}>(endpoint, config.apiBaseUrl);
        const components = data.components || [];

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

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
