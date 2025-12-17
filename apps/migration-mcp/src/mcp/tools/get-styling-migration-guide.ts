/**
 * Styling migration guide tool
 *
 * Provides the styling migration guide for upgrading from HeroUI v2 to v3
 */

import type {Tool} from "../types";

import {z} from "zod";

import {AnalyticsErrorEvent, AnalyticsEvent} from "../../api/types/analytics";
import {getMigrationDocSourceUrl, readMigrationDoc} from "../lib/migration-docs";

export const getStylingMigrationGuideTool: Tool = {
  name: "get_styling_migration_guide",
  description: `Get the styling migration guide for upgrading from HeroUI v2 to v3.
Fetches the official styling migration documentation from the HeroUI v3 repository.
This guide covers:
- Styling system changes
- CSS variable migrations
- Theme configuration updates
- Style prop changes
- Custom styling patterns

Use this tool to get styling-specific migration information. For the main migration guide, use get_migration_guide. For component-specific guides, use get_component_guides.`,

  exec(server, {name, description, config}) {
    const inputSchema = z.object({});

    const handler = async () => {
      const startTime = Date.now();
      const analytics = config.analytics;

      try {
        const docUrl = getMigrationDocSourceUrl("styling.mdx");
        const content = await readMigrationDoc("styling.mdx");

        if (analytics) {
          analytics.track({
            event: AnalyticsEvent.GET_STYLING_MIGRATION_GUIDE,
            properties: {
              endpoint: "get_styling_migration_guide",
              responseTime: Date.now() - startTime,
            },
          });
        }

        return {
          content: [
            {
              type: "text",
              text: `# HeroUI v2 to v3 Styling Migration Guide\n\n**Source:** ${docUrl}\n\n---\n\n${content}`,
            },
          ],
        };
      } catch (error) {
        const docUrl = getMigrationDocSourceUrl("styling.mdx");

        if (analytics) {
          analytics.trackError({
            error,
            errorEvent: AnalyticsErrorEvent.GET_STYLING_MIGRATION_GUIDE_ERROR,
            fallbackMessage: "Failed to fetch styling migration guide",
            properties: {
              endpoint: "get_styling_migration_guide",
              responseTime: Date.now() - startTime,
            },
          });
        }

        if (error instanceof Error && error.message.includes("404")) {
          return {
            content: [
              {
                type: "text",
                text: `Styling migration guide not yet available.\n\nThe documentation is being prepared and will be available soon. Please check https://v3.heroui.com for the latest migration information.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Error fetching styling migration guide: ${error instanceof Error ? error.message : "Unknown error"}\n\nURL: ${docUrl}`,
            },
          ],
        };
      }
    };

    // Register tool with SDK - StreamableHTTPTransport handles execution automatically
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
