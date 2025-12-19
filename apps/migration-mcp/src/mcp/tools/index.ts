/**
 * Initialize all tools with the server
 */

import type {ToolConfig} from "../types";
import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {getComponentMigrationGuidesTool} from "./get-component-migration-guides";
import {getHooksMigrationGuideTool} from "./get-hooks-migration-guide";
import {getMigrationGuideTool} from "./get-migration-guide";
import {getStylingMigrationGuideTool} from "./get-styling-migration-guide";
import {listMigrationGuidesTool} from "./list-migration-guides";

/**
 * Initialize all tools with the server
 */
export async function initializeTools(server: McpServer, config: ToolConfig = {}): Promise<void> {
  // Register all tools with config
  getMigrationGuideTool.exec(server, {
    name: getMigrationGuideTool.name,
    description: getMigrationGuideTool.description,
    config,
  });

  listMigrationGuidesTool.exec(server, {
    name: listMigrationGuidesTool.name,
    description: listMigrationGuidesTool.description,
    config,
  });

  getComponentMigrationGuidesTool.exec(server, {
    name: getComponentMigrationGuidesTool.name,
    description: getComponentMigrationGuidesTool.description,
    config,
  });

  getStylingMigrationGuideTool.exec(server, {
    name: getStylingMigrationGuideTool.name,
    description: getStylingMigrationGuideTool.description,
    config,
  });

  getHooksMigrationGuideTool.exec(server, {
    name: getHooksMigrationGuideTool.name,
    description: getHooksMigrationGuideTool.description,
    config,
  });
}
