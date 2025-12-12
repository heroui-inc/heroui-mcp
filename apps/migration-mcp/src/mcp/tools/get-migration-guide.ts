/**
 * Agent migration guide tool
 *
 * Provides the agent-focused migration guide for AI assistants helping users migrate from HeroUI v2 to v3
 */

import type {Tool} from "../types";

import {z} from "zod";

import {getMigrationDocSourceUrl, readMigrationDoc} from "../lib/migration-docs";

export const getMigrationGuideTool: Tool = {
  name: "get_migration_guide",
  description: `Get the comprehensive migration guide migrating from HeroUI v2 to v3.
Fetches the official migration documentation index from the HeroUI v3 repository.
This guide covers:
- Overview of major changes
- Step-by-step migration instructions
- Dependency updates
- Configuration changes
- Component migration reference table
- Migration checklist

Use this tool to get the complete migration overview. For specific component migration guides, use get_component_guides.`,
  exec(server, {name, description}) {
    const inputSchema = z.object({});

    const handler = async () => {
      try {
        const docUrl = getMigrationDocSourceUrl("agent-guide.mdx");
        const content = await readMigrationDoc("agent-guide.mdx");

        return {
          content: [
            {
              type: "text",
              text: `# HeroUI v2 to v3 Agent Migration Guide\n\n**Source:** ${docUrl}\n\n---\n\n${content}`,
            },
          ],
        };
      } catch (error) {
        const docUrl = getMigrationDocSourceUrl("agent-guide.mdx");

        if (error instanceof Error && error.message.includes("404")) {
          return {
            content: [
              {
                type: "text",
                text: `Agent migration guide not yet available.\n\nThe documentation is being prepared and will be available soon. Please check https://v3.heroui.com for the latest migration information.`,
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
