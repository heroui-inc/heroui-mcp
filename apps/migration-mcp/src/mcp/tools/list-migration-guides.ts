/**
 * List migration guides tool
 *
 * Lists all available component migration guides
 */

import type {Tool} from "../types";

import {z} from "zod";

import {AnalyticsEvent} from "../../api/types/analytics";

// Component migration guides available
export const AVAILABLE_COMPONENTS = [
  "accordion",
  "alert",
  "autocomplete",
  "avatar",
  "breadcrumbs",
  "button",
  "button-group",
  "card",
  "checkbox",
  "checkbox-group",
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
  "radio-group",
  "scroll-shadow",
  "select",
  "skeleton",
  "slider",
  "snippet",
  "spacer",
  "spinner",
  "switch",
  "tabs",
  "toast",
  "tooltip",
  "user",
] as const;

export const listMigrationGuidesTool: Tool = {
  name: "list_component_migration_guides",
  description: `List all available component migration guides for HeroUI v2 to v3 migration.
Returns a list of component names that have migration guides available.
Use this tool to discover which components have migration documentation.
Then use get_component_migration_guides with a components array to get the specific migration guides.`,

  exec(server, {name, description, config}) {
    const inputSchema = z.object({});

    const handler = async () => {
      const startTime = Date.now();
      const analytics = config.analytics;

      const components = [...AVAILABLE_COMPONENTS];
      const componentsList = components.map((name) => `  - ${name}`).join("\n");

      if (analytics) {
        analytics.track({
          event: AnalyticsEvent.LIST_MIGRATION_GUIDES,
          properties: {
            endpoint: "list_component_migration_guides",
            responseTime: Date.now() - startTime,
            componentsCount: components.length,
          },
        });
      }

      return {
        content: [
          {
            type: "text",
            text: `# Available Component Migration Guides\n\nFound ${components.length} component migration guides:\n\n${componentsList}\n\nUse \`get_component_migration_guides\` with a components array to get the specific migration guides.\n\nExample: \`get_component_migration_guides({ components: ["button"] })\``,
          },
        ],
      };
    };

    // Register tool with SDK - StreamableHTTPTransport handles execution automatically
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
