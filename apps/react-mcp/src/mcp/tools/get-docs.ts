/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "../types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

interface DocContentResponse {
  path: string;
  url: string;
  content: string;
  contentType: string;
}

interface DocsContext {
  availablePaths: string;
  pathsList: string[];
}

export const getDocsTool: Tool<DocsContext> = {
  name: "get_docs",
  description: `Get HeroUI v3 React documentation content for guides, principles, and component docs.
Fetches official documentation from v3.heroui.com.
Returns the complete MDX content of documentation pages.
Use for understanding concepts, design principles, implementation guides.
The path parameter description shows ALL available documentation paths.
Documentation covers: design principles, getting started, components, theming, colors, styling, animation.
IMPORTANT: Always use exact paths shown in the available paths list - DO NOT guess paths.
Example paths: /docs/react/components/button, /docs/react/getting-started/theming, /docs/react/getting-started.
All React documentation paths start with /docs/react/ prefix.
Returns MDX content which may include code examples and explanations.
This is v3 beta documentation - ensure you're working with HeroUI v3, not v2.
NOTE: For HeroUI Native documentation, use the @heroui/native-mcp server instead.`,

  async ctx(shared) {
    const pathsList = shared?.docPaths || [];
    let availablePaths = "Available documentation paths:\n\n";

    if (pathsList.length > 0) {
      // Simple list format since we have paths from shared context
      pathsList.forEach((path) => {
        availablePaths += `  - ${path}\n`;
      });
    } else {
      availablePaths =
        "Documentation paths available (examples):\n  - /docs/react/components/button\n  - /docs/react/getting-started/theming\n  - /docs/react/getting-started";
    }

    return {
      availablePaths,
      pathsList,
    };
  },
  exec(server, {config, name, description, ctx}) {
    // Create input schema with available paths in description
    const inputSchema = z.object({
      path: z.string().describe(`The exact documentation path to fetch.
Must be one of the paths listed below - DO NOT guess paths.
All React documentation paths start with /docs/react/ prefix.
Component docs use pattern: /docs/react/components/{component-name}
Getting started docs use pattern: /docs/react/getting-started/{topic}
NOTE: Paths containing /native/ are for HeroUI Native docs and require @heroui/native-mcp server.

${ctx.availablePaths}`),
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

      try {
        // Fetch documentation content from the API
        const data = await fetchApi<DocContentResponse>(
          `/docs/content?path=${encodeURIComponent(path)}`,
          config.apiBaseUrl,
        );

        const {content, url, contentType} = data;

        // Format the response
        return {
          content: [
            {
              type: "text" as const,
              text: `# Documentation: ${path}\n\n**URL:** ${url}\n**Content Type:** ${contentType}\n\n---\n\n${content}`,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        // Extract HTTP status code from error object (set by fetchApi)
        const statusCode = (error as any)?.status;
        const is404 =
          statusCode === 404 || errorMessage.includes("404") || errorMessage.includes("not found");

        if (is404) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Documentation not found at path: ${path}\n\nAvailable paths:\n${ctx.pathsList.slice(0, 10).join("\n")}\n\nUse one of these paths or check the description for more available paths.`,
              },
            ],
          };
        }

        // Provide status-specific error messages
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

        if (statusCode && statusCode >= 400 && statusCode < 500) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Error fetching documentation (status ${statusCode}): ${errorMessage}\n\nRequested path: ${path}`,
              },
            ],
          };
        }

        if (statusCode && statusCode >= 500) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Server error while fetching documentation (status ${statusCode}). Please try again later.\n\nRequested path: ${path}`,
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

    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
