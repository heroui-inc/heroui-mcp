/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "../types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

interface DocsContext {
  availablePaths: string;
  pathsList: string[];
}

export const getDocsTool: Tool<DocsContext> = {
  name: "get_docs",
  description: `Get HeroUI Native documentation content for guides and component docs.
Fetches official documentation from GitHub (heroui-native repository README.md).
Only supports documentation links from the ## Documentation and ## Changelog sections (### subsections).
Returns the complete markdown content of documentation pages.
Use for understanding concepts, configuration, theming, and component usage.
The path parameter description shows ALL available documentation paths.
Documentation covers: core setup (provider, theming, fonts), all components, changelog.
IMPORTANT: Always use exact paths shown in the available paths list - DO NOT guess paths.
Example paths: /docs/core/provider, /docs/components/button, /docs/changelog.
Returns markdown content which may include code examples and API references.`,

  async ctx(shared) {
    const pathsList = shared?.docPaths || [];
    let availablePaths = "Available documentation paths:\n\n";

    if (pathsList.length > 0) {
      // Group paths by category based on URL structure
      const categories: Record<string, string[]> = {
        CORE: [],
        COMPONENTS: [],
        CHANGELOG: [],
        OTHER: [],
      };

      pathsList.forEach((path) => {
        if (path.includes("/core/")) {
          categories.CORE.push(path);
        } else if (path.includes("/components/")) {
          categories.COMPONENTS.push(path);
        } else if (path.includes("/changelog")) {
          categories.CHANGELOG.push(path);
        } else {
          categories.OTHER.push(path);
        }
      });

      // Format available paths for display
      Object.entries(categories).forEach(([category, paths]) => {
        if (paths.length > 0) {
          availablePaths += `${category}:\n`;
          paths.forEach((path) => {
            availablePaths += `  - ${path}\n`;
          });
          availablePaths += "\n";
        }
      });
    } else {
      availablePaths +=
        "Documentation paths available (examples):\n  - /docs/core/provider\n  - /docs/components/button\n  - /docs/changelog\n";
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
Paths always start with /docs/.
Component docs use pattern: /docs/components/{component-name}
Core docs use pattern: /docs/core/{topic}

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

      try {
        // Fetch documentation content from the API
        const data = await fetchApi<{
          path: string;
          url: string;
          content: string;
          contentType: string;
        }>(`/docs/content?path=${encodeURIComponent(path)}`, config.apiBaseUrl);

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
        // Check if it's a 404 error
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const is404 = errorMessage.includes("404") || errorMessage.includes("not found");

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

        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Unable to fetch documentation content. ${errorMessage}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
