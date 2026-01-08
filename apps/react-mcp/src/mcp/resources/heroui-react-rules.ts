import type {Resource} from "../types";
import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {access, readFile} from "fs/promises";
import {dirname, join, resolve} from "path";
import {fileURLToPath} from "url";

/**
 * HeroUI React Rules Resource
 *
 * Provides comprehensive development guidelines for HeroUI v3 React components.
 * This resource is automatically available to AI assistants and includes:
 * - MCP tool workflows (including get_docs for documentation)
 * - Component architecture patterns (compound components)
 * - Styling system documentation
 * - Accessibility requirements
 * - Troubleshooting guide
 * - Common issues and solutions
 */
export const heroUIReactRulesResource: Resource = {
  name: "heroui-react-rules",
  description:
    "HeroUI v3 React development guidelines and best practices for AI agents. " +
    "Includes MCP tool workflows (get_docs, component tools), component architecture patterns, " +
    "styling system, accessibility requirements, troubleshooting guide, and common issues with solutions.",

  exec: (server: McpServer) => {
    // Get the directory of the current module
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Resolve path: try dist first (production), then project root (development)
    // In production: built file is at dist/stdio.js, and heroui-react-rules.mdc is in dist/
    // In development: source file is at src/mcp/resources/, and heroui-react-rules.mdc is at project root
    const getRulesPath = async (): Promise<string> => {
      // Try dist directory first (production build)
      const distPath = join(__dirname, "heroui-react-rules.mdc");
      try {
        await access(distPath);

        return distPath;
      } catch {
        // If not in dist, try project root (development)
        // Go up from src/mcp/resources/ to project root
        const projectRoot = resolve(__dirname, "../../..");
        const rootPath = join(projectRoot, "heroui-react-rules.mdc");
        try {
          await access(rootPath);

          return rootPath;
        } catch {
          // Fallback to dist path (will throw error with better context)
          return distPath;
        }
      }
    };

    server.registerResource(
      "heroui-react-rules",
      "file:///heroui-react-rules.mdc",
      {
        description:
          "HeroUI v3 React development guidelines and best practices for AI agents. " +
          "Includes MCP tool workflows (get_docs, component tools), component architecture patterns, " +
          "styling system, accessibility requirements, troubleshooting guide, and common issues with solutions.",
        mimeType: "text/markdown",
      },
      async (uri) => {
        try {
          const rulesPath = await getRulesPath();
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
          console.error("Failed to read heroui-react-rules.mdc:", error);

          // Return an error message as the content
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: "text/plain",
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      },
    );
  },
};
