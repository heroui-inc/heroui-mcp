/**
 * Migration guide tool
 *
 * Provides the main migration guide for upgrading from HeroUI v2 to v3
 */

import type {Tool} from "../types";

import {z} from "zod";

const GITHUB_BRANCH = "docs/migration";
const GITHUB_REPO = "heroui-inc/heroui";
const MIGRATION_DOCS_PATH = "apps/docs/content/docs/v2-to-v3-migration";

function getGitHubRawUrl(filename: string): string {
  return `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${MIGRATION_DOCS_PATH}/${filename}`;
}

export const getMigrationGuideTool: Tool = {
  name: "get_migration_guide",
  description: `Get the comprehensive main migration guide for upgrading from HeroUI v2 to v3.
Fetches the official migration documentation index from the HeroUI v3 repository.
This guide covers:
- Overview of major changes
- Step-by-step migration instructions
- Dependency updates
- Configuration changes
- Component migration reference table
- Migration checklist

Use this tool to get the complete migration overview. For specific component migration guides, use get_comp_guide.`,

  exec(server, {name, description}) {
    const inputSchema = z.object({});

    const handler = async () => {
      try {
        const docUrl = getGitHubRawUrl("index.mdx");
        const response = await fetch(docUrl);

        if (!response.ok) {
          if (response.status === 404) {
            return {
              content: [
                {
                  type: "text",
                  text: `Migration guide not yet available.\n\nThe documentation is being prepared and will be available soon. Please check https://v3.heroui.com for the latest migration information.`,
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
              text: `# HeroUI v2 to v3 Migration Guide\n\n**Source:** ${docUrl}\n\n---\n\n${content}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching migration guide: ${error instanceof Error ? error.message : "Unknown error"}\n\nURL: ${getGitHubRawUrl("index.mdx")}`,
            },
          ],
        };
      }
    };

    // Register tool with SDK - StreamableHTTPTransport handles execution automatically
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
