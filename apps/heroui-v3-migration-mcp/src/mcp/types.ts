/**
 * MCP tool types
 */

import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

interface ToolConfig {
  apiBaseUrl?: string;
}

export interface Tool<T = unknown> {
  name: string;
  description: string;
  disabled?: (config: ToolConfig) => boolean;
  // Optional context initialization
  ctx?: () => Promise<T> | T | void;
  exec: (
    server: McpServer,
    options: {
      name: string;
      description: string;
      config: ToolConfig;
      ctx?: T;
    },
  ) => void;
}
