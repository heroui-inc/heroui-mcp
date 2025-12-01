/**
 * Initialize all tools with the server
 */

import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {getComponentMigrationGuidesTool} from "./get-component-migration-guides";
import {getMigrationGuideTool} from "./get-migration-guide";
import {listMigrationGuidesTool} from "./list-migration-guides";

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

  listMigrationGuidesTool.exec(server, {
    name: listMigrationGuidesTool.name,
    description: listMigrationGuidesTool.description,
    config: {},
  });

  getComponentMigrationGuidesTool.exec(server, {
    name: getComponentMigrationGuidesTool.name,
    description: getComponentMigrationGuidesTool.description,
    config: {},
  });
}
