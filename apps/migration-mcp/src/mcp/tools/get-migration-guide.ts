/**
 * Agent migration guide tool
 *
 * Provides the agent-focused migration guide for AI assistants helping users migrate from HeroUI v2 to v3
 */

import type {Tool} from "../types";

import {z} from "zod";

import {AnalyticsErrorEvent, AnalyticsEvent} from "../../api/types/analytics";
import {getMigrationDocSourceUrl, readMigrationDoc} from "../lib/migration-docs";

export const getMigrationGuideTool: Tool = {
  name: "get_migration_workflow",
  description: `Get the comprehensive migration guide migrating from HeroUI v2 to v3.
Fetches the official migration documentation index from the HeroUI v3 repository.
This guide covers:
- Overview of major changes
- Step-by-step migration instructions
- Dependency updates
- Configuration changes
- Component migration reference table
- Migration checklist

Use this tool to get the complete migration overview. For specific component migration guides, use get_component_migration_guides.

The migrationType parameter allows you to choose between "full" (default) and "incremental" migration approaches.`,
  exec(server, {name, description, config}) {
    const inputSchema = z.object({
      migrationType: z.enum(["full", "incremental"]).optional().default("full"),
    });

    const handler = async ({migrationType = "full"}: {migrationType?: "full" | "incremental"}) => {
      const startTime = Date.now();
      const analytics = config.analytics;

      try {
        const filename =
          migrationType === "incremental" ? "agent-guide-incremental.mdx" : "agent-guide-full.mdx";

        const docUrl = getMigrationDocSourceUrl(filename, config.docsBaseUrl);
        // Fetch from docs site - Fumadocs automatically resolves <include> tags
        const content = await readMigrationDoc(filename, config.docsBaseUrl);

        if (analytics) {
          analytics.track({
            event: AnalyticsEvent.GET_MIGRATION_GUIDE,
            properties: {
              endpoint: "get_migration_workflow",
              migrationType,
              responseTime: Date.now() - startTime,
            },
          });
        }

        const title =
          migrationType === "incremental"
            ? "HeroUI v2 to v3 Agent Migration Guide - Incremental Migration with Coexistence"
            : "HeroUI v2 to v3 Agent Migration Guide - Full Migration";

        return {
          content: [
            {
              type: "text",
              text: `# ${title}\n\n**Source:** ${docUrl}\n\n---\n\n${content}`,
            },
          ],
        };
      } catch (error) {
        const filename =
          migrationType === "incremental" ? "agent-guide-incremental.mdx" : "agent-guide-full.mdx";
        const docUrl = getMigrationDocSourceUrl(filename, config.docsBaseUrl);

        if (analytics) {
          analytics.trackError({
            error,
            errorEvent: AnalyticsErrorEvent.GET_MIGRATION_GUIDE_ERROR,
            fallbackMessage: "Failed to fetch migration guide",
            properties: {
              endpoint: "get_migration_workflow",
              migrationType,
              responseTime: Date.now() - startTime,
            },
          });
        }

        if (error instanceof Error && error.message.includes("404")) {
          return {
            content: [
              {
                type: "text",
                text: `Agent migration guide not yet available.\n\nThe documentation is being prepared and will be available soon. Please check https://heroui.com for the latest migration information.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Error fetching agent migration guide: ${error instanceof Error ? error.message : "Unknown error"}\n\nURL: ${docUrl}`,
            },
          ],
        };
      }
    };

    // Register tool with SDK - StreamableHTTPTransport handles execution automatically
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
