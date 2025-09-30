/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

interface DocSection {
  title: string;
  path: string;
  description: string;
}

interface DocCategory {
  name: string;
  docs: DocSection[];
}

interface DocsListResponse {
  baseUrl: string;
  categories: DocCategory[];
  total: number;
}

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
  description: `Get HeroUI v3 documentation content for guides, principles, and component docs.
Fetches official documentation from v3.heroui.com.
Returns the complete MDX content of documentation pages.
Use for understanding concepts, design principles, implementation guides.
The path parameter description shows ALL available documentation paths.
Documentation covers: design principles, quick start, components, handbook (theming, colors, styling, animation).
IMPORTANT: Always use exact paths shown in the available paths list - DO NOT guess paths.
Example paths: /docs/introduction, /docs/components/button, /docs/handbook/theming.
Returns MDX content which may include code examples and explanations.
This is v3 alpha documentation - ensure you're working with HeroUI v3, not v2.`,

  async ctx() {
    try {
      // Fetch available documentation paths
      const data = await fetchApi<DocsListResponse>("/docs/available");

      const pathsList: string[] = [];
      let availablePaths = "Available documentation paths:\n\n";

      // Format available paths for display
      data.categories.forEach((category) => {
        availablePaths += `${category.name.toUpperCase()}:\n`;
        category.docs.forEach((doc) => {
          pathsList.push(doc.path);
          availablePaths += `  - ${doc.path}: ${doc.description}\n`;
        });
        availablePaths += "\n";
      });

      return {
        availablePaths,
        pathsList,
      };
    } catch (error) {
      console.error("Failed to fetch available documentation paths:", error);

      // Return fallback with basic paths
      return {
        availablePaths:
          "Documentation paths available (examples):\n  - /docs/introduction\n  - /docs/components/button\n  - /docs/handbook/theming",
        pathsList: [],
      };
    }
  },
  exec(server, {config, name, description, ctx}) {
    // Create input schema with available paths in description
    const inputSchema = z.object({
      path: z.string().describe(`The exact documentation path to fetch.
Must be one of the paths listed below - DO NOT guess paths.
Paths always start with /docs/.
Component docs use pattern: /docs/components/{component-name}
Handbook docs use pattern: /docs/handbook/{topic}

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

    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
