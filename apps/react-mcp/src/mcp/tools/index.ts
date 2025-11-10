import type {Tool, ToolConfig} from "../types";
import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {API_BASE_URL} from "../constants";
import {getSharedContext} from "../lib/shared-context";

import {getThemeInfoTool} from "./deprecated/get-theme-info";
import {getComponentExamplesTool} from "./get-component-examples";
import {getComponentInfoTool} from "./get-component-info";
import {getComponentPropsTool} from "./get-component-props";
import {getComponentSourceCodeTool} from "./get-component-source-code";
import {getComponentSourceStylesTool} from "./get-component-source-styles";
import {getDocsTool} from "./get-docs";
import {getThemeTool} from "./get-theme";
import {getThemeRulesTool} from "./get-theme-rules";
import {installationTool} from "./installation";
import {listComponentsTool} from "./list-components";
import {listThemesTool} from "./list-themes";
import {saveThemeTool} from "./save-theme";

// Free/public tools (always available)
const freeTools: Tool[] = [
  installationTool,
  listComponentsTool,
  getComponentInfoTool,
  getComponentPropsTool,
  getComponentExamplesTool,
  getComponentSourceCodeTool,
  getComponentSourceStylesTool,
  getThemeRulesTool, // New: theme guidelines and default values
  getThemeInfoTool, // Deprecated: kept for backwards compatibility
  getDocsTool,
];

// Premium tools (only available if API key is present and authenticated)
const premiumTools: Tool[] = [
  listThemesTool,
  getThemeTool, // New: get user saved themes
  saveThemeTool,
];

/**
 * Check if API key is available for premium features
 */
function hasApiKey(config: ToolConfig): boolean {
  return !!(config.apiKey || process.env.HEROUI_API_KEY);
}

/**
 * Initialize all tools with the server
 * Fetches shared context once and passes it to all tools
 * Premium tools are only registered if API key is present AND valid
 * Uses /ctx endpoint response to determine authentication status (optimized - no extra network call)
 */
export async function initializeTools(server: McpServer, config: ToolConfig = {}): Promise<void> {
  const apiBaseUrl = API_BASE_URL;

  // Fetch shared context once for all tools
  // This also validates API key via auth middleware on /ctx endpoint
  const {context: sharedContext, isAuthenticated} = await getSharedContext(apiBaseUrl);

  const finalConfig: ToolConfig = {
    apiBaseUrl,
    ...config,
  };

  // Always include free tools
  const allTools: Tool[] = [...freeTools];

  // Only include premium tools if API key exists AND is authenticated
  // isAuthenticated comes from /ctx endpoint which validates via auth middleware
  if (hasApiKey(finalConfig) && isAuthenticated) {
    allTools.push(...premiumTools);
    // eslint-disable-next-line no-console
    console.error("[MCP] Premium tools enabled (valid API key authenticated via /ctx)");
  } else if (hasApiKey(finalConfig)) {
    // eslint-disable-next-line no-console
    console.error("[MCP] Premium tools disabled (invalid or missing API key)");
  }

  // Filter out any disabled tools
  const enabledTools = allTools.filter((tool) => !tool.disabled?.(finalConfig));

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
