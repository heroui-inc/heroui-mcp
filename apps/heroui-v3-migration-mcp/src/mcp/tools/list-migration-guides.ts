/**
 * List migration guides tool
 *
 * Lists all available component migration guides
 */

import type {Tool} from "../types";

import {z} from "zod";

const GITHUB_BRANCH = "docs/migration";
const GITHUB_REPO = "heroui-inc/heroui";
const MIGRATION_DOCS_PATH = "apps/docs/content/docs/v2-to-v3-migration";

function getGitHubRawUrl(filename: string): string {
  return `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${MIGRATION_DOCS_PATH}/${filename}`;
}

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
Then use get_comp_guide with a component name to get the specific migration guide.`,

  exec(server, {name, description}) {
    const inputSchema = z.object({});

    const handler = async () => {
      try {
        // Fetch meta.json to get the list of pages
        const metaUrl = getGitHubRawUrl("meta.json");
        const metaResponse = await fetch(metaUrl);

        let components: string[] = [];

        if (metaResponse.ok) {
          try {
            const meta = (await metaResponse.json()) as {pages?: string[]};
            // Extract component names from pages array (skip "v2-to-v3-migration" which is the index)
            components = (meta.pages || []).filter((page: string) => page !== "v2-to-v3-migration");
          } catch {
            // If meta.json parsing fails, fall back to hardcoded list
            components = [...AVAILABLE_COMPONENTS];
          }
        } else {
          // Fall back to hardcoded list if meta.json is not available
          components = [...AVAILABLE_COMPONENTS];
        }

        const componentsList = components.map((name) => `  - ${name}`).join("\n");

        return {
          content: [
            {
              type: "text",
              text: `# Available Component Migration Guides\n\nFound ${components.length} component migration guides:\n\n${componentsList}\n\nUse \`get_comp_guide\` with a component name to get the specific migration guide.\n\nExample: \`get_comp_guide({ component: "button" })\``,
            },
          ],
        };
      } catch {
        // Fall back to hardcoded list on error
        const componentsList = AVAILABLE_COMPONENTS.map((name) => `  - ${name}`).join("\n");

        return {
          content: [
            {
              type: "text",
              text: `# Available Component Migration Guides\n\nFound ${AVAILABLE_COMPONENTS.length} component migration guides:\n\n${componentsList}\n\nUse \`get_comp_guide\` with a component name to get the specific migration guide.\n\nNote: Unable to fetch latest list from repository, showing cached list.`,
            },
          ],
        };
      }
    };

    // Register tool with SDK - StreamableHTTPTransport handles execution automatically
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
