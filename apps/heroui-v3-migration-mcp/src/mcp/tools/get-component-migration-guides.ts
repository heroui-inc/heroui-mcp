/**
 * Get component migration guide tool
 *
 * Provides migration guide for specific components
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

export const getComponentMigrationGuidesTool: Tool = {
  name: "get_component_guides",
  description: `Get migration guides for multiple HeroUI components from v2 to v3.
Accepts an array of component names and returns migration guides for each.
Fetches the official component-specific migration documentation from the HeroUI v3 repository.
Each component guide covers:
- Component-specific API changes
- Prop changes and migrations
- Code examples showing v2 vs v3 patterns
- Breaking changes
- Migration steps

Use list_migration_guides to see all available component migration guides.
Example: get_component_guides({ components: ["button", "card"] })`,

  exec(server, {name, description}) {
    // Create input schema with array of component enums
    // Convert const array to tuple for z.enum
    const componentTuple = [...AVAILABLE_COMPONENTS] as [string, ...string[]];
    const componentEnum = z.enum(componentTuple);

    const inputSchema = z.object({
      components: z
        .array(componentEnum)
        .min(1)
        .describe(
          `Array of component names (kebab-case) from list_migration_guides.
Examples: ["button"], ["card", "modal"], ["input", "select", "checkbox"].
Use list_migration_guides to see all available component migration guides.`,
        ),
    });

    const handler = async ({components}: z.infer<typeof inputSchema>) => {
      if (!components || components.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Error: Please provide at least one component name.\n\nUse list_migration_guides to see all available component migration guides.",
            },
          ],
        };
      }

      const results: Array<{
        component: string;
        content?: string;
        error?: string;
      }> = [];

      // Fetch migration guides for all components
      await Promise.all(
        components.map(async (componentName) => {
          const normalizedName = componentName.toLowerCase().trim();

          try {
            const docUrl = getGitHubRawUrl(`${normalizedName}.mdx`);
            const response = await fetch(docUrl);

            if (!response.ok) {
              if (response.status === 404) {
                results.push({
                  component: componentName,
                  error: `Migration guide not found for component "${componentName}"`,
                });

                return;
              }

              results.push({
                component: componentName,
                error: `Error fetching migration guide: ${response.status} ${response.statusText}`,
              });

              return;
            }

            const content = await response.text();

            results.push({
              component: componentName,
              content: `# ${componentName.charAt(0).toUpperCase() + componentName.slice(1)} Migration Guide\n\n**Component:** ${componentName}\n**Source:** ${docUrl}\n\n---\n\n${content}`,
            });
          } catch (error) {
            results.push({
              component: componentName,
              error: `Error fetching migration guide: ${error instanceof Error ? error.message : "Unknown error"}`,
            });
          }
        }),
      );

      // Format response with all results
      let responseText = "";

      results.forEach((result, index) => {
        if (index > 0) responseText += "\n\n---\n\n";

        if (result.error || !result.content) {
          responseText += `# ${result.component} Migration Guide\n\n`;
          responseText += `Error: ${result.error || "Migration guide not available"}\n`;
        } else {
          responseText += result.content;
        }
      });

      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
      };
    };

    // Register tool with SDK - StreamableHTTPTransport handles execution automatically
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
