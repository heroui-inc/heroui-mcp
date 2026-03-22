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
  description: `Get HeroUI Native documentation content for guides, principles, and release notes (NOT component docs).
Fetches official documentation from v3.heroui.com.
Returns the complete MDX content of documentation pages.
Use for understanding concepts, design principles, implementation guides, and version history.
Documentation covers: getting started, theming, colors, styling, animation, release notes.
IMPORTANT: For component documentation, use get_component_docs instead.
Example paths: /docs/native/getting-started/theming, /docs/native/releases/v1-0-0.
All Native documentation paths start with /docs/native/ prefix.
Returns MDX content which may include code examples and explanations.
This is documentation for HeroUI Native.`,

  async ctx(shared) {
    // Filter out component paths - those are handled by get_component_docs
    const docPaths = (shared?.docPaths || []).filter(
      (path) => !path.startsWith("/docs/native/components"),
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
NOTE: For component docs, use get_component_docs instead.`),
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
        // Input: /docs/native/getting-started/theming
        // API expects: native/getting-started/theming (route is /v1/docs/:path(*))
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
                text: `Error: Documentation not found at path: ${path}\n\nExample paths:\n  - /docs/native/getting-started/theming\n  - /docs/native/releases/v1-0-0\n\nAll Native documentation paths start with /docs/native/ prefix.`,
              },
            ],
          };
        }

        // For 500 errors or other errors, check if path looks invalid and provide helpful message
        // If path doesn't start with /docs/native/, it's likely invalid
        if (statusCode === 500 || !path.startsWith("/docs/native/")) {
          // Check if it's likely a path issue (not a real server error)
          if (
            !path.startsWith("/docs/native/") ||
            path.includes("/nonexistent/") ||
            path.includes("/invalid/")
          ) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error: Documentation not found at path: ${path}\n\nExample paths:\n  - /docs/native/getting-started/theming\n  - /docs/native/releases/v1-0-0\n  - /docs/native/getting-started/colors\n  - /docs/native/components/button\n\nAll Native documentation paths start with /docs/native/ prefix.\nFor component documentation, use get_component_docs instead.`,
                },
              ],
            };
          }

          // Real server error
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
              text: `Error: Unable to fetch documentation content. ${errorMessage}\n\nRequested path: ${path}\n\nExample paths:\n  - /docs/native/getting-started/theming\n  - /docs/native/releases/v1-0-0\n\nAll Native documentation paths start with /docs/native/ prefix.`,
            },
          ],
        };
      }
    };

    server.registerTool(name, {description, inputSchema: inputSchema.shape}, handler as any);
  },
};
