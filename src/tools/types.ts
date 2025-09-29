import type {ComponentDataServiceR2} from "../services/component-data-service-r2";
import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

export interface ToolConfig {
  apiKey?: string;
  apiBaseUrl?: string;
  dataService?: ComponentDataServiceR2;
}

export interface ToolContext {
  name: string;
  description: string;
  config: ToolConfig;
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

export type ToolResponse = {
  content: Array<{
    type: "text";
    text: string;
  }>;
};
