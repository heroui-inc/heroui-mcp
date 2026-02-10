/**
 * Get component migration guide tool
 *
 * Provides migration guide for specific components
 */

import type {Tool} from "../types";

import {z} from "zod";

import {AnalyticsErrorEvent, AnalyticsEvent} from "../../api/types/analytics";
import {getMigrationDocSourceUrl, readMigrationDoc} from "../lib/migration-docs";

import {AVAILABLE_COMPONENTS} from "./list-migration-guides";

export const getComponentMigrationGuidesTool: Tool = {
  name: "get_component_migration_guides",
  description: `Get migration guides for multiple HeroUI components from v2 to v3.
Accepts an array of component names and returns migration guides for each.
Fetches the official component-specific migration documentation from the HeroUI v3 repository.
Each component guide covers:
- Component-specific API changes
- Prop changes and migrations
- Code examples showing v2 vs v3 patterns
- Breaking changes
- Migration steps

Use list_component_migration_guides to see all available component migration guides.
Example: get_component_migration_guides({ components: ["button", "card"] })`,

  exec(server, {name, description, config}) {
    // Create enum from AVAILABLE_COMPONENTS for validation
    const componentTuple = [...AVAILABLE_COMPONENTS] as [string, ...string[]];
    const componentEnum = z.enum(componentTuple);

    const inputSchema = z.object({
      components: z
        .array(componentEnum)
        .min(1)
        .describe(
          `Array of component names (kebab-case) from list_component_migration_guides.
Examples: ["button"], ["card", "modal"], ["input", "select", "checkbox"].
Use list_component_migration_guides to see all available component migration guides.
Invalid component names will be rejected at validation time.`,
        ),
    });

    const handler = async ({components}: z.infer<typeof inputSchema>) => {
      const startTime = Date.now();
      const analytics = config.analytics;

      if (!components || components.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Error: Please provide at least one component name.\n\nUse list_component_migration_guides to see all available component migration guides.",
            },
          ],
        };
      }

      const results: Array<{
        component: string;
        content?: string;
        error?: string;
      }> = [];

      try {
        // Fetch migration guides for all components
        await Promise.all(
          components.map(async (componentName) => {
            const normalizedName = componentName.toLowerCase().trim();

            try {
              const docUrl = getMigrationDocSourceUrl(`${normalizedName}.mdx`, config.docsBaseUrl);
              const content = await readMigrationDoc(`${normalizedName}.mdx`, config.docsBaseUrl);

              results.push({
                component: componentName,
                content: `# ${componentName.charAt(0).toUpperCase() + componentName.slice(1)} Migration Guide\n\n**Component:** ${componentName}\n**Source:** ${docUrl}\n\n---\n\n${content}`,
              });
            } catch (error) {
              if (error instanceof Error && error.message.includes("404")) {
                results.push({
                  component: componentName,
                  error: `Migration guide not found for component "${componentName}"`,
                });
              } else {
                results.push({
                  component: componentName,
                  error: `Error fetching migration guide: ${error instanceof Error ? error.message : "Unknown error"}`,
                });
              }
            }
          }),
        );

        const failedComponents = results.filter((r) => r.error);
        const successCount = results.length - failedComponents.length;

        if (analytics) {
          if (failedComponents.length > 0) {
            analytics.trackError({
              error: `Failed to fetch ${failedComponents.length} component(s)`,
              errorEvent: AnalyticsErrorEvent.GET_COMPONENT_GUIDES_ERROR,
              fallbackMessage: "Some component guides failed to fetch",
              properties: {
                endpoint: "get_component_migration_guides",
                responseTime: Date.now() - startTime,
                components: components,
                successCount,
                failedCount: failedComponents.length,
                failedComponents: failedComponents.map((r) => r.component),
              },
            });
          } else {
            analytics.track({
              event: AnalyticsEvent.GET_COMPONENT_GUIDES,
              properties: {
                endpoint: "get_component_migration_guides",
                responseTime: Date.now() - startTime,
                components: components,
                componentsCount: components.length,
              },
            });
          }
        }

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
      } catch (error) {
        if (analytics) {
          analytics.trackError({
            error,
            errorEvent: AnalyticsErrorEvent.GET_COMPONENT_GUIDES_ERROR,
            fallbackMessage: "Failed to get component guides",
            properties: {
              endpoint: "get_component_migration_guides",
              responseTime: Date.now() - startTime,
              components: components,
            },
          });
        }

        return {
          content: [
            {
              type: "text",
              text: `Error fetching component guides: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool with SDK - StreamableHTTPTransport handles execution automatically
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
