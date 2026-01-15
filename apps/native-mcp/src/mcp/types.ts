import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

export interface ToolConfig {
  apiKey?: string;
  apiBaseUrl?: string;
}

export interface SharedContext {
  componentList: string[];
  docPaths: string[];
  version: string;
  timestamp: number;
}

export interface ComponentContext {
  componentList: string[];
}

export interface DocsContext {
  docPaths: string[];
}

export interface Tool<T = unknown> {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  // Optional context initialization - receives shared context if available
  ctx?(shared?: SharedContext): Promise<T> | T | void;
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
