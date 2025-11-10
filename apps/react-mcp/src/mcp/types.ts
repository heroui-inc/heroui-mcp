import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

export interface ToolConfig {
  apiKey?: string;
  apiBaseUrl?: string;
}

export interface SharedContext {
  componentList: string[];
  themeList: string[];
  docPaths: string[];
  version: string;
  timestamp: number;
  isAuthenticated?: boolean;
}

export interface ComponentContext {
  componentList: string[];
}

/**
 * Context for theme-related tools
 */
export interface ThemeContext {
  /**
   * List of available theme names from R2 storage
   * Populated from /ctx endpoint at initialization
   * Always includes at least ["default"] as fallback
   */
  themeList: string[];
  isAuthenticated: boolean;
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

export interface ResourceConfig {
  apiKey?: string;
  apiBaseUrl?: string;
}

export interface Resource {
  name: string;
  description: string;
  // Check if resource should be disabled
  disabled?(config: ResourceConfig): boolean;
  // Register the resource with the server
  exec(
    server: McpServer,
    opts: {
      config?: ResourceConfig;
    },
  ): Promise<void> | void;
}
