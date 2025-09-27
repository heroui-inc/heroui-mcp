import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {packageInfo} from "./lib/package-info.js";

export const server = new McpServer({
  name: "@heroui/mcp",
  version: packageInfo.version,
  capabilities: {
    prompts: {},
    resources: {},
    tools: {
      // Indicate that tools are supported
      listChanged: true,
    },
  },
});
