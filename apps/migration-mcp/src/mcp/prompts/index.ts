/**
 * Initialize all prompts with the server
 */

import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {z} from "zod";

import {analyzeAndPlanPrompt, getAnalyzeAndPlanPrompt} from "./analyze-and-plan";
import {getImplementMigrationPrompt, implementMigrationPrompt} from "./implement-migration";

/**
 * Initialize all prompts with the server
 */
export async function initializePrompts(server: McpServer): Promise<void> {
  // Register analyze-and-plan prompt (with optional migrationType argument)
  server.registerPrompt(
    analyzeAndPlanPrompt.name,
    {
      description: analyzeAndPlanPrompt.description,
      argsSchema: {
        migrationType: z
          .enum(["full", "incremental"])
          .optional()
          .describe(
            "Migration approach: 'full' (default) or 'incremental'. Full migration breaks the project during migration. Incremental migration allows v2 and v3 to coexist.",
          ),
      },
    },
    async (args) => {
      return getAnalyzeAndPlanPrompt(args);
    },
  );

  // Register implement-migration prompt (with optional migrationType argument)
  server.registerPrompt(
    implementMigrationPrompt.name,
    {
      description: implementMigrationPrompt.description,
      argsSchema: {
        migrationType: z
          .enum(["full", "incremental"])
          .optional()
          .describe(
            "Migration approach: 'full' (default) or 'incremental'. Full migration breaks the project during migration. Incremental migration allows v2 and v3 to coexist.",
          ),
      },
    },
    async (args) => {
      return getImplementMigrationPrompt(args);
    },
  );
}
