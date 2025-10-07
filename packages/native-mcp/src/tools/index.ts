import type {Tool, ToolConfig} from "./types";
import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {getComponentExamplesTool} from "./get-component-examples";
import {getComponentInfoTool} from "./get-component-info";
import {getComponentPropsTool} from "./get-component-props";
import {getDocsTool} from "./get-docs";
import {getThemeInfoTool} from "./get-theme-info";
import {installationTool} from "./installation";
import {listComponentsTool} from "./list-components";

// All available tools
const tools: Tool[] = [
  installationTool,
  listComponentsTool,
  getComponentInfoTool,
  getComponentPropsTool,
  getComponentExamplesTool,
  getThemeInfoTool,
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

  const enabledTools = tools.filter((tool) => !tool.disabled?.(finalConfig));

  await Promise.all(
    enabledTools.map(async (tool) => {
      const toolCtx = await tool.ctx?.();

      tool.exec(server, {
        ctx: toolCtx,
        name: tool.name,
        description: tool.description,
        config: finalConfig,
      });
    }),
  );
}
