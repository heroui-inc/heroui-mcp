import type {Tool} from "./types.js";

import {z} from "zod";

import {wrapWithAnalytics} from "../lib/tool-analytics-wrapper.js";

const inputSchema = z.object({
  package: z.enum(["heroui", "native", "mcp"]).describe("The package to check version for"),
  currentVersion: z
    .string()
    .optional()
    .describe("The current version being used (e.g., '3.0.0-alpha.31')"),
});

export const checkVersionTool: Tool = {
  name: "check_version",
  description:
    "Check if you're using the latest version of HeroUI, HeroUI Native, or the MCP server itself",

  exec(server, {config, name, description}) {
    const handler = async ({package: pkg, currentVersion}: z.infer<typeof inputSchema>) => {
      try {
        let result: string;

        if (config.dataService) {
          // Use R2 data service for version check
          const versionData = await config.dataService.checkVersion(pkg, currentVersion);
          result = versionData.message;
        } else {
          // Use API endpoint
          const {checkVersion: fetchVersionCheck} = await import("../lib/fetch.js");
          const versionResult = await fetchVersionCheck(pkg, currentVersion, config.apiBaseUrl);
          result = versionResult.message;
        }

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

    // Register tool with analytics wrapper
    server.tool(name, description, inputSchema, wrapWithAnalytics(server, name, handler));
  },
};
