/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

const inputSchema = z.object({
  package: z.enum(["heroui", "native", "mcp"]).describe("The package to check version for"),
});

export const checkVersionTool: Tool = {
  name: "check_version",
  description:
    "Check if you're using the latest version of HeroUI, HeroUI Native, or the MCP server itself",

  exec(server, {config, name, description}) {
    const handler = async ({package: pkg}: z.infer<typeof inputSchema>) => {
      try {
        // Direct API call for version check
        const endpoint = `/versions/${pkg}`;
        const data = await fetchApi<{
          isLatest: boolean;
          currentVersion: string;
          latestVersion: string;
        }>(endpoint, config.apiBaseUrl);

        const result = data.isLatest
          ? `✅ You're using the latest version of ${pkg}: ${data.currentVersion}`
          : `🔄 Update available for ${pkg}!\nCurrent: ${data.currentVersion}\nLatest: ${data.latestVersion}`;

        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error checking version: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
