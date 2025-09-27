import type {Tool, ToolConfig} from "./types.js";
import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {checkVersionTool} from "./check-version.js";
import {getComponentExampleTool} from "./get-component-example.js";
import {getComponentPropsTool} from "./get-component-props.js";
import {listComponentsTool} from "./list-components.js";

// All available tools
const tools: Tool[] = [
  listComponentsTool,
  getComponentPropsTool,
  getComponentExampleTool,
  checkVersionTool,
];

// Cache for registered tools
const registeredToolCache = new Map<string, Tool>();

/**
 * Initialize all tools with the server
 */
export async function initializeTools(server: McpServer, config: ToolConfig = {}): Promise<void> {
  // Set default config
  const finalConfig: ToolConfig = {
    apiBaseUrl: config.apiBaseUrl || process.env.HEROUI_API_URL || "https://mcp.heroui.com",
    ...config,
  };

  // Filter enabled tools
  const enabledTools = tools.filter((tool) => !tool.disabled?.(finalConfig));

  // Initialize each tool
  await Promise.all(
    enabledTools.map(async (tool) => {
      // Skip if already registered
      if (registeredToolCache.has(tool.name)) {
        return;
      }

      // Get tool context
      const toolCtx = await tool.ctx?.();

      // Register the tool
      registeredToolCache.set(tool.name, tool);

      // Execute tool setup with McpServer
      tool.exec(server, {
        ctx: toolCtx,
        name: tool.name,
        description: tool.description,
        config: finalConfig,
      });
    }),
  );
}

/**
 * Clear all registered tools
 */
export function clearTools(): void {
  registeredToolCache.clear();
}

/**
 * Get a registered tool by name
 */
export function getTool(name: string): Tool | undefined {
  return registeredToolCache.get(name);
}

/**
 * Get all registered tools
 */
export function getAllTools(): Tool[] {
  return Array.from(registeredToolCache.values());
}
