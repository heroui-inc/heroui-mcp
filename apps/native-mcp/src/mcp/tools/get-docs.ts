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
  description: `Get HeroUI v3 Native documentation content for guides, principles, component docs, and release notes.
Fetches official documentation from v3.heroui.com.
Returns the complete MDX content of documentation pages.
Use for understanding concepts, design principles, implementation guides, and version history.
The path parameter description shows available Native documentation paths extracted from v3.heroui.com/native/llms.txt.
Documentation covers: design principles, getting started, components, theming, colors, styling, animation, release notes.
IMPORTANT: Always use exact paths shown in the available paths list - DO NOT guess paths.
Example paths: /docs/native/components/button, /docs/native/getting-started/theming, /docs/native/releases/beta-11.
All Native documentation paths start with /docs/native/ prefix.
Returns MDX content which may include code examples and explanations.
This is v3 beta documentation - ensure you're working with HeroUI Native v3, not v2.`,

  async ctx(shared) {
    const pathsList = shared?.docPaths || [];
    let availablePaths =
      "Available Native documentation paths extracted from v3.heroui.com/native/llms.txt:\n\n";

    if (pathsList.length > 0) {
      // Filter to only include Native documentation paths and extract path parts
      const filteredPaths = pathsList
        .map((p) => {
          // Extract path from full URL if needed
          const urlMatch = p.match(/https?:\/\/[^/]+(\/docs\/native\/.*)/);

          return urlMatch ? urlMatch[1] : p;
        })
        .filter((p) => {
          // Only include Native docs paths
          return p.startsWith("/docs/native/") && !p.includes("/react/");
        })
        .sort();

      if (filteredPaths.length > 0) {
        filteredPaths.forEach((path) => {
          availablePaths += `  - ${path}\n`;
        });
      } else {
        availablePaths =
          "Documentation paths available (examples):\n  - /docs/native/components/button\n  - /docs/native/getting-started/theming\n  - /docs/native/releases/beta-11";
      }
    } else {
      availablePaths =
        "Documentation paths available (examples):\n  - /docs/native/components/button\n  - /docs/native/getting-started/theming\n  - /docs/native/releases/beta-11";
    }

    return {
      availablePaths,
      pathsList: pathsList, // Return original pathsList for other uses
    };
  },

  exec(server, {config, name, description, ctx}) {
    // Create input schema with available paths in description
    const inputSchema = z.object({
      path: z.string().describe(`The exact documentation path to fetch.
Must be one of the paths listed below - DO NOT guess paths.
All Native documentation paths start with /docs/native/ prefix.
Component docs use pattern: /docs/native/components/{component-name}
Getting started docs use pattern: /docs/native/getting-started/{topic}
Release notes use pattern: /docs/native/releases/{version} (e.g., /docs/native/releases/beta-11)
For backward compatibility, old paths like /docs/components/{name} and /docs/core/{topic} are automatically transformed.

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
        const statusCode = (error as any)?.status;
        const is404 =
          statusCode === 404 || errorMessage.includes("404") || errorMessage.includes("not found");

        if (is404) {
          // Filter example paths (exclude releases/changelogs, prioritize components/getting-started)
          const examplePaths = ctx.pathsList
            .map((p) => {
              const urlMatch = p.match(/https?:\/\/[^/]+(\/docs\/native\/.*)/);

              return urlMatch ? urlMatch[1] : p;
            })
            .filter((p) => {
              const lower = p.toLowerCase();

              return (
                p.startsWith("/docs/native/") &&
                !lower.includes("/releases/") &&
                !lower.includes("/changelog") &&
                !lower.includes("release")
              );
            })
            .sort((a, b) => {
              // Prioritize components and getting-started
              const aIsComponent = a.includes("/components/");
              const bIsComponent = b.includes("/components/");
              const aIsGettingStarted = a.includes("/getting-started/");
              const bIsGettingStarted = b.includes("/getting-started/");

              if (aIsComponent && !bIsComponent) return -1;
              if (!aIsComponent && bIsComponent) return 1;
              if (aIsGettingStarted && !bIsGettingStarted) return -1;
              if (!aIsGettingStarted && bIsGettingStarted) return 1;

              return a.localeCompare(b);
            })
            // Limit to 8 examples
            .slice(0, 8);

          const examplesText =
            examplePaths.length > 0
              ? examplePaths.map((p) => `  - ${p}`).join("\n")
              : "  - /docs/native/components/button\n  - /docs/native/getting-started/theming\n  - /docs/native/releases/beta-11";

          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Documentation not found at path: ${path}\n\nExample paths (these are examples, not an exhaustive list):\n${examplesText}\n\nAll Native documentation paths start with /docs/native/ prefix.`,
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
