/**
 * MCP tool types
 */

import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

interface ToolConfig {
  apiBaseUrl?: string;
}

export interface Tool {
  name: string;
  description: string;
  disabled?: (config: ToolConfig) => boolean;
  exec: (
    server: McpServer,
    options: {
      name: string;
      description: string;
      config: ToolConfig;
      ctx?: any;
    },
  ) => void;
}
