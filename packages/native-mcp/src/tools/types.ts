import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

export interface ToolConfig {
  apiKey?: string;
  apiBaseUrl?: string;
}

export interface ComponentContext {
  componentList: string[];
}

export interface Tool<T = unknown> {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  // Optional context initialization
  ctx?(): Promise<T> | T | void;
  // Check if tool should be disabled
  disabled?(config: ToolConfig): boolean;
  // Execute the tool
  exec(
    server: McpServer,
    opts: {
      ctx: T;
      name: string;
      description: string;
      config: ToolConfig;
    },
  ): Promise<void> | void;
}