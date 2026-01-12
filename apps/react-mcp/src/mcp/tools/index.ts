import type {Tool, ToolConfig} from "../types";
import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {getSharedContext} from "../lib/shared-context";

import {getComponentDocsTool} from "./get-component-docs";
import {getComponentSourceCodeTool} from "./get-component-source-code";
import {getComponentSourceStylesTool} from "./get-component-source-styles";
import {getDocsTool} from "./get-docs";
import {getThemeVariablesTool} from "./get-theme-variables";
import {listComponentsTool} from "./list-components";

// All available tools
const tools: Tool[] = [
  listComponentsTool,
  getComponentDocsTool,
  getComponentSourceCodeTool,
  getComponentSourceStylesTool,
  getThemeVariablesTool,
  getDocsTool,
];

/**
 * Initialize all tools with the server
 * Fetches shared context once and passes it to all tools
 */
export async function initializeTools(server: McpServer, config: ToolConfig = {}): Promise<void> {
  // Fetch shared context once for all tools
  const sharedContext = await getSharedContext(
    config.apiBaseUrl || process.env.HEROUI_API_URL || "https://mcp-api.heroui.com",
  );

  const finalConfig: ToolConfig = {
    apiBaseUrl: config.apiBaseUrl || process.env.HEROUI_API_URL || "https://mcp-api.heroui.com",
    ...config,
  };

  const enabledTools = tools.filter((tool) => !tool.disabled?.(finalConfig));

  await Promise.all(
    enabledTools.map(async (tool) => {
      // Pass shared context to tool ctx() function
      const toolCtx = await tool.ctx?.(sharedContext);

      tool.exec(server, {
        ctx: toolCtx,
        name: tool.name,
        description: tool.description,
        config: finalConfig,
      });
    }),
  );
}
