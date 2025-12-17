/**
 * List migration guides tool
 *
 * Lists all available component migration guides
 */

import type {Tool} from "../types";

import {z} from "zod";

import {AnalyticsErrorEvent, AnalyticsEvent} from "../../api/types/analytics";
import {readMigrationDoc} from "../lib/migration-docs";

// Component migration guides available (from meta.json)
const AVAILABLE_COMPONENTS = [
  "accordion",
  "alert",
  "autocomplete",
  "avatar",
  "button",
  "card",
  "checkbox",
  "chip",
  "code",
  "divider",
  "dropdown",
  "form",
  "image",
  "input",
  "input-otp",
  "kbd",
  "link",
  "listbox",
  "modal",
  "navbar",
  "numberinput",
  "popover",
  "radio",
  "ripple",
  "select",
  "skeleton",
  "slider",
  "snippet",
  "spacer",
  "spinner",
  "switch",
  "tabs",
  "tooltip",
  "user",
] as const;

export const listMigrationGuidesTool: Tool = {
  name: "list_migration_guides",
  description: `List all available component migration guides for HeroUI v2 to v3 migration.
Returns a list of component names that have migration guides available.
Use this tool to discover which components have migration documentation.
Then use get_component_guides with a components array to get the specific migration guides.`,

  exec(server, {name, description, config}) {
    const inputSchema = z.object({});

    const handler = async () => {
      const startTime = Date.now();
      const analytics = config.analytics;

      try {
        // Fetch meta.json to get the list of pages
        const metaContent = await readMigrationDoc("meta.json");
        let components: string[] = [];

        try {
          const meta = JSON.parse(metaContent) as {pages?: string[]};
          // Extract component names from pages array (skip "v2-to-v3-migration" which is the index)
          components = (meta.pages || []).filter((page: string) => page !== "v2-to-v3-migration");
        } catch {
          // If meta.json parsing fails, fall back to hardcoded list
          components = [...AVAILABLE_COMPONENTS];
        }

        const componentsList = components.map((name) => `  - ${name}`).join("\n");

        if (analytics) {
          analytics.track({
            event: AnalyticsEvent.LIST_MIGRATION_GUIDES,
            properties: {
              endpoint: "list_migration_guides",
              responseTime: Date.now() - startTime,
              componentsCount: components.length,
            },
          });
        }

        return {
          content: [
            {
              type: "text",
              text: `# Available Component Migration Guides\n\nFound ${components.length} component migration guides:\n\n${componentsList}\n\nUse \`get_component_guides\` with a components array to get the specific migration guides.\n\nExample: \`get_component_guides({ components: ["button"] })\``,
            },
          ],
        };
      } catch (error) {
        if (analytics) {
          analytics.trackError({
            error,
            errorEvent: AnalyticsErrorEvent.LIST_MIGRATION_GUIDES_ERROR,
            fallbackMessage: "Failed to list migration guides",
            properties: {
              endpoint: "list_migration_guides",
              responseTime: Date.now() - startTime,
            },
          });
        }

        // Fall back to hardcoded list on error
        const componentsList = AVAILABLE_COMPONENTS.map((name) => `  - ${name}`).join("\n");

        return {
          content: [
            {
              type: "text",
              text: `# Available Component Migration Guides\n\nFound ${AVAILABLE_COMPONENTS.length} component migration guides:\n\n${componentsList}\n\nUse \`get_component_guides\` with a components array to get the specific migration guides.\n\nExample: \`get_component_guides({ components: ["button"] })\`\n\nNote: Unable to fetch latest list from repository, showing cached list.`,
            },
          ],
        };
      }
    };

    // Register tool with SDK - StreamableHTTPTransport handles execution automatically
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
