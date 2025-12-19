/**
 * Hooks migration guide tool
 *
 * Provides the hooks migration guide for upgrading from HeroUI v2 to v3
 */

import type {Tool} from "../types";

import {z} from "zod";

import {AnalyticsErrorEvent, AnalyticsEvent} from "../../api/types/analytics";
import {getMigrationDocSourceUrl, readMigrationDoc} from "../lib/migration-docs";

export const getHooksMigrationGuideTool: Tool = {
  name: "get_hooks_migration_guide",
  description: `Get the hooks migration guide for upgrading from HeroUI v2 to v3.
Fetches the official hooks migration documentation from the HeroUI v3 repository.
This guide covers:
- Component hooks removal (useSwitch, useInput, useCheckbox, etc.)
- useDisclosure → useOverlayState migration
- Migration strategies and examples

Use this tool to get hooks-specific migration information. For the main migration guide, use get_migration_guide. For component-specific guides, use get_component_guides. For styling migration, use get_styling_migration_guide.`,

  exec(server, {name, description, config}) {
    const inputSchema = z.object({});

    const handler = async () => {
      const startTime = Date.now();
      const analytics = config.analytics;

      try {
        const docUrl = getMigrationDocSourceUrl("hooks.mdx");
        const content = await readMigrationDoc("hooks.mdx");

        if (analytics) {
          analytics.track({
            event: AnalyticsEvent.GET_HOOKS_MIGRATION_GUIDE,
            properties: {
              endpoint: "get_hooks_migration_guide",
              responseTime: Date.now() - startTime,
            },
          });
        }

        return {
          content: [
            {
              type: "text",
              text: `# HeroUI v2 to v3 Hooks Migration Guide\n\n**Source:** ${docUrl}\n\n---\n\n${content}`,
            },
          ],
        };
      } catch (error) {
        const docUrl = getMigrationDocSourceUrl("hooks.mdx");

        if (analytics) {
          analytics.trackError({
            error,
            errorEvent: AnalyticsErrorEvent.GET_HOOKS_MIGRATION_GUIDE_ERROR,
            fallbackMessage: "Failed to fetch hooks migration guide",
            properties: {
              endpoint: "get_hooks_migration_guide",
              responseTime: Date.now() - startTime,
            },
          });
        }

        if (error instanceof Error && error.message.includes("404")) {
          return {
            content: [
              {
                type: "text",
                text: `Hooks migration guide not yet available.\n\nThe documentation is being prepared and will be available soon. Please check https://v3.heroui.com for the latest migration information.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Error fetching hooks migration guide: ${error instanceof Error ? error.message : "Unknown error"}\n\nURL: ${docUrl}`,
            },
          ],
        };
      }
    };

    // Register tool with SDK - StreamableHTTPTransport handles execution automatically
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
