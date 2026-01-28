/* eslint-disable @typescript-eslint/no-explicit-any */
import type {DocsContext, Tool} from "../types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

interface DocContentResponse {
  path: string;
  url: string;
  content: string;
  contentType: string;
}

export const getDocsTool: Tool<DocsContext> = {
  name: "get_docs",
  description: `Get HeroUI v3 React documentation content for guides, principles, and release notes (NOT component docs).
Fetches official documentation from v3.heroui.com.
Returns the complete MDX content of documentation pages.
Use for understanding concepts, design principles, implementation guides, and version history.
Documentation covers: getting started, theming, colors, styling, animation, release notes.
IMPORTANT: For component documentation, use get_component_docs instead.
Example paths: /docs/react/getting-started/theming, /docs/react/releases/v3-0-0-beta-3.
All React documentation paths start with /docs/react/ prefix.
Returns MDX content which may include code examples and explanations.
This is v3 beta documentation - ensure you're working with HeroUI v3, not v2.
NOTE: For HeroUI Native documentation, use the @heroui/native-mcp server instead.`,

  async ctx(shared) {
    // Filter out component paths - those are handled by get_component_docs
    const docPaths = (shared?.docPaths || []).filter(
      (path) => !path.startsWith("/docs/react/components"),
    );

    return {
      docPaths,
    };
  },

  exec(server, {config, name, description, ctx}) {
    // Create input schema with dynamic doc paths enum
    // Fallback to string if not enough paths available (shouldn't happen in production)
    const pathSchema =
      ctx.docPaths.length >= 2 ? z.enum(ctx.docPaths as [string, ...string[]]) : z.string();

    const inputSchema = z.object({
      path: pathSchema.describe(`The documentation path to fetch.
DO NOT guess paths - use one of the available paths from the enum.
NOTE: For component docs, use get_component_docs instead.
NOTE: Paths containing /native/ are for HeroUI Native docs and require @heroui/native-mcp server.`),
    });

    const handler = async ({path}: z.infer<typeof inputSchema>) => {
      if (!path) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: Please provide a documentation path",
            },
          ],
        };
      }

      // Check if path includes /native/ - these are handled by native-mcp
      if (path.toLowerCase().includes("/native/")) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: The requested path includes '/native/' which refers to HeroUI Native documentation.

HeroUI Native documentation is handled by a separate MCP server (@heroui/native-mcp).
Please use the native-mcp server instead to access Native component documentation.

Requested path: ${path}`,
            },
          ],
        };
      }

      // Warn if trying to use component docs path
      if (path.includes("/components/")) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Component documentation should be fetched using get_component_docs tool instead.
For component docs, use: get_component_docs({components: ["ComponentName"]})

Requested path: ${path}`,
            },
          ],
        };
      }

      try {
        // Fetch documentation content from the API
        // The API route is mounted at /v1/docs, so we need to strip /docs/ prefix
        // Input: /docs/react/getting-started/theming
        // API expects: react/getting-started/theming (route is /v1/docs/:path(*))
        const apiPath = path.startsWith("/docs/")
          ? path.slice(6)
          : path.startsWith("/")
            ? path.slice(1)
            : path;
        const data = await fetchApi<DocContentResponse & {_warning?: string}>(
          `/v1/docs/${apiPath}`,
          config.apiBaseUrl,
        );

        const {content, url, contentType, _warning} = data;

        // Format the response
        let text = `# Documentation: ${path}\n\n`;
        if (_warning) {
          text += `${_warning}\n\n`;
        }
        text += `**URL:** ${url}\n**Content Type:** ${contentType}\n\n---\n\n${content}`;

        return {
          content: [
            {
              type: "text" as const,
              text,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const statusCode = (error as any)?.status;

        if (statusCode === 404) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Documentation not found at path: ${path}\n\nExample paths:\n  - /docs/react/getting-started/theming\n  - /docs/react/releases/v3-0-0-beta-3\n\nAll React documentation paths start with /docs/react/ prefix.`,
              },
            ],
          };
        }

        if (statusCode === 500) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Server error while fetching documentation. Please try again later.\n\nRequested path: ${path}`,
              },
            ],
          };
        }

        // Generic error fallback
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Unable to fetch documentation content. ${errorMessage}\n\nRequested path: ${path}`,
            },
          ],
        };
      }
    };

    server.registerTool(name, {description, inputSchema: inputSchema.shape}, handler as any);
  },
};
