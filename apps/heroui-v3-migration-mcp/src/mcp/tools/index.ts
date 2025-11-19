/**
 * Initialize all tools with the server
 */

import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {getMigrationGuideTool} from "./get-migration-guide";

/**
 * Initialize all tools with the server
 */
export async function initializeTools(server: McpServer): Promise<void> {
  // Register all tools
  getMigrationGuideTool.exec(server, {
    name: getMigrationGuideTool.name,
    description: getMigrationGuideTool.description,
    config: {},
  });
}
