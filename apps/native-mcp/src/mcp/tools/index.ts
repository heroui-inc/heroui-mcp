import type {Tool, ToolConfig} from "../types";
import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {getSharedContext} from "../lib/shared-context";

import {getComponentExamplesTool} from "./get-component-examples";
import {getComponentInfoTool} from "./get-component-info";
import {getComponentPropsTool} from "./get-component-props";
import {getDocsTool} from "./get-docs";
import {getThemeVariablesTool} from "./get-theme-variables";
import {listComponentsTool} from "./list-components";

// All available tools
const tools: Tool[] = [
  listComponentsTool,
  getComponentInfoTool,
  getComponentPropsTool,
  getComponentExamplesTool,
  getThemeVariablesTool,
  getDocsTool,
];

/**
 * Initialize all tools with the server
 */
export async function initializeTools(server: McpServer, config: ToolConfig = {}): Promise<void> {
  const finalConfig: ToolConfig = {
    apiBaseUrl:
      config.apiBaseUrl || process.env.HEROUI_NATIVE_API_URL || "https://native-mcp-api.heroui.com",
    ...config,
  };

  // Fetch shared context once for all tools
  const sharedContext = await getSharedContext(finalConfig.apiBaseUrl);

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
