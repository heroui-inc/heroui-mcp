/**
 * Initialize all prompts with the server
 */

import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {analyzeAndPlanPrompt, getAnalyzeAndPlanPrompt} from "./analyze-and-plan";
import {getImplementMigrationPrompt, implementMigrationPrompt} from "./implement-migration";

/**
 * Initialize all prompts with the server
 */
export async function initializePrompts(server: McpServer): Promise<void> {
  // Register analyze-and-plan prompt (no arguments)
  server.prompt(analyzeAndPlanPrompt.name, analyzeAndPlanPrompt.description ?? "", async () => {
    return getAnalyzeAndPlanPrompt();
  });

  // Register implement-migration prompt (no arguments)
  server.prompt(
    implementMigrationPrompt.name,
    implementMigrationPrompt.description ?? "",
    async () => {
      return getImplementMigrationPrompt();
    },
  );
}
