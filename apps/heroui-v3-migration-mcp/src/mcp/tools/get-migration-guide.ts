/**
 * Migration guide tool
 *
 * Provides step-by-step instructions for migrating from HeroUI v2 to v3
 */

import type {Tool} from "../types";

import {z} from "zod";

export const getMigrationGuideTool: Tool = {
  name: "get_migration_guide",
  description: `Get comprehensive migration guide for upgrading from HeroUI v2 to v3.
Fetches the official migration documentation from v3.heroui.com.`,

  exec(server, {name, description}) {
    const inputSchema = z.object({});

    const handler = async () => {
      try {
        // Fetch migration guide from v3.heroui.com
        const docUrl = "https://v3.heroui.com/docs/v2-to-v3-migration.mdx";
        const response = await fetch(docUrl);

        if (!response.ok) {
          // If the document doesn't exist yet, provide a helpful error message
          if (response.status === 404) {
            return {
              content: [
                {
                  type: "text",
                  text: `Migration guide not yet available at ${docUrl}.\n\nThe documentation is being prepared and will be available soon. Please check https://v3.heroui.com for the latest migration information.`,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `Error fetching migration guide: ${response.status} ${response.statusText}\n\nURL: ${docUrl}`,
              },
            ],
          };
        }

        const content = await response.text();

        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching migration guide: ${error instanceof Error ? error.message : "Unknown error"}\n\nURL: https://v3.heroui.com/docs/v2-to-v3-migration.mdx`,
            },
          ],
        };
      }
    };

    // Register tool with SDK - StreamableHTTPTransport handles execution automatically
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
