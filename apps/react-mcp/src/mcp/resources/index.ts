import type {Resource, ResourceConfig} from "../types";
import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {heroUIWebRulesResource} from "./heroui-web-rules";

// All available resources
const resources: Resource[] = [heroUIWebRulesResource];

/**
 * Initialize all resources with the server
 */
export async function initializeResources(
  server: McpServer,
  config: ResourceConfig = {},
): Promise<void> {
  const finalConfig: ResourceConfig = {
    apiBaseUrl: config.apiBaseUrl || process.env.HEROUI_API_URL || "https://mcp-api.heroui.com",
    ...config,
  };

  const enabledResources = resources.filter((resource) => !resource.disabled?.(finalConfig));

  await Promise.all(
    enabledResources.map(async (resource) => {
      resource.exec(server, {
        config: finalConfig,
      });
    }),
  );
}
