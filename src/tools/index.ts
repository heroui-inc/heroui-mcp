import type {Tool, ToolConfig} from "./types";
import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {checkVersionTool} from "./check-version";
import {getComponentExampleTool} from "./get-component-example";
import {getComponentPropsTool} from "./get-component-props";
import {listComponentsTool} from "./list-components";

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
  const finalConfig: ToolConfig = {
    apiBaseUrl: config.apiBaseUrl || process.env.HEROUI_API_URL || "https://mcp-api.heroui.com",
    ...config,
  };

  const enabledTools = tools.filter((tool) => !tool.disabled?.(finalConfig));

  await Promise.all(
    enabledTools.map(async (tool) => {
      if (registeredToolCache.has(tool.name)) {
        return;
      }

      const toolCtx = await tool.ctx?.();

      registeredToolCache.set(tool.name, tool);

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
