import type {Tool, ToolConfig} from "../types";
import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {getSharedContext} from "../lib/shared-context";

import {getComponentDocsTool} from "./get-component-docs";
import {getComponentSourceCodeTool} from "./get-component-source-code";
import {getComponentSourceStylesTool} from "./get-component-source-styles";
import {getDocsTool} from "./get-docs";
import {getThemeVariablesTool} from "./get-theme-variables";
import {listComponentsTool} from "./list-components";

/** Default timeout for API requests in milliseconds (30 seconds). */
const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

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
 * Fetch shared context with a timeout to prevent hanging on unresponsive APIs.
 */
async function getSharedContextWithTimeout(
  apiBaseUrl: string,
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await getSharedContext(apiBaseUrl, {signal: controller.signal});
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Initialize all tools with the server.
 * Fetches shared context once and passes it to all tools.
 * If the API is unreachable, the server starts with degraded functionality
 * rather than crashing entirely.
 */
export async function initializeTools(server: McpServer, config: ToolConfig = {}): Promise<void> {
  const apiBaseUrl = config.apiBaseUrl || process.env.HEROUI_API_URL || "https://mcp-api.heroui.com";

  // Fetch shared context with graceful fallback — don't crash the server if API is down
  let sharedContext: Awaited<ReturnType<typeof getSharedContext>>;

  try {
    sharedContext = await getSharedContextWithTimeout(apiBaseUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isTimeout = error instanceof Error && error.name === "AbortError";

    // eslint-disable-next-line no-console
    console.error(
      `Warning: Failed to fetch shared context from ${apiBaseUrl}: ${
        isTimeout ? `Request timed out after ${DEFAULT_FETCH_TIMEOUT_MS / 1000}s` : message
      }`,
    );
    // eslint-disable-next-line no-console
    console.error(
      "MCP server starting with limited functionality. Tools requiring component lists may return errors.",
    );

    // Provide a minimal fallback so the server can still start
    sharedContext = {componentList: []} as Awaited<ReturnType<typeof getSharedContext>>;
  }

  const finalConfig: ToolConfig = {
    apiBaseUrl,
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
