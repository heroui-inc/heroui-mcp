import type {Resource} from "../types";
import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {readFile} from "fs/promises";
import {dirname, join} from "path";
import {fileURLToPath} from "url";

/**
 * HeroUI Web Rules Resource
 *
 * Provides comprehensive development guidelines for HeroUI v3.
 * This resource is automatically available to AI assistants and includes:
 * - MCP tool workflows
 * - Component architecture patterns
 * - Styling system documentation
 * - Accessibility requirements
 * - Troubleshooting guide
 * - Common issues and solutions
 */
export const heroUIWebRulesResource: Resource = {
  name: "heroui-web-rules",
  description:
    "HeroUI v3 development guidelines and best practices for AI agents. " +
    "Includes MCP tool workflows, component architecture patterns, styling system, " +
    "accessibility requirements, troubleshooting guide, and common issues with solutions.",

  exec: (server: McpServer) => {
    // Get the directory of the current module
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Resolve path relative to the built dist directory
    // The built file is at dist/stdio.js, and heroui-web-rules.mdc is copied to dist/ during build
    // So both files are in the same directory
    const rulesPath = join(__dirname, "heroui-web-rules.mdc");

    server.resource(
      "heroui-web-rules",
      "file:///heroui-web-rules.mdc",
      {
        description:
          "HeroUI v3 development guidelines and best practices for AI agents. " +
          "Includes MCP tool workflows, component architecture patterns, styling system, " +
          "accessibility requirements, troubleshooting guide, and common issues with solutions.",
        mimeType: "text/markdown",
      },
      async (uri) => {
        try {
          const rulesContent = await readFile(rulesPath, "utf-8");

          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: "text/markdown",
                text: rulesContent,
              },
            ],
          };
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to read heroui-web-rules.mdc:", error);

          // Return an error message as the content
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: "text/plain",
                text: "Error: HeroUI development guidelines could not be loaded. Please check the MCP installation.",
              },
            ],
          };
        }
      },
    );
  },
};
