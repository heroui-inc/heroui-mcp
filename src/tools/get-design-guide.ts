/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

const inputSchema = z.object({
  guide: z
    .enum([
      "color-theory",
      "animations",
      "dark-mode",
      "custom-themes",
      "color-customization",
      "responsive-design",
      "accessibility",
    ])
    .describe("The design guide to retrieve"),
  section: z.string().optional().describe("Specific section within the guide to retrieve"),
});

export const getDesignGuideTool: Tool = {
  name: "get_design_guide",
  description:
    "Get HeroUI design guides and documentation for themes, colors, animations, and best practices",

  exec(server, {config, name, description}) {
    const handler = async ({guide, section}: z.infer<typeof inputSchema>) => {
      try {
        const endpoint = `/docs/${guide}${section ? `?section=${encodeURIComponent(section)}` : ""}`;

        try {
          const response = await fetchApi<{
            guide: string;
            title: string;
            content: string;
            sections?: Array<{
              id: string;
              title: string;
              content?: string;
            }>;
            examples?: Array<{
              title: string;
              code: string;
              description?: string;
            }>;
            meta?: {
              category: string;
              lastUpdated?: string;
              readingTime?: string;
            };
          }>(endpoint, config.apiBaseUrl);

          // Format the response as structured text
          let responseText = `# ${response.title}\n\n`;

          if (response.meta) {
            if (response.meta.category) {
              responseText += `**Category:** ${response.meta.category}\n`;
            }
            if (response.meta.readingTime) {
              responseText += `**Reading Time:** ${response.meta.readingTime}\n`;
            }
            responseText += "\n";
          }

          // Add main content
          if (response.content) {
            responseText += response.content + "\n\n";
          }

          // Add sections if available
          if (response.sections && response.sections.length > 0) {
            response.sections.forEach((section) => {
              responseText += `## ${section.title}\n\n`;
              if (section.content) {
                responseText += section.content + "\n\n";
              }
            });
          }

          // Add examples if available
          if (response.examples && response.examples.length > 0) {
            responseText += "## Examples\n\n";
            response.examples.forEach((example) => {
              responseText += `### ${example.title}\n\n`;
              if (example.description) {
                responseText += example.description + "\n\n";
              }
              responseText += "```tsx\n" + example.code + "\n```\n\n";
            });
          }

          return {
            content: [
              {
                type: "text",
                text: responseText,
              },
            ],
          };
        } catch (error: any) {
          if (error.status === 404) {
            const availableGuides = [
              "color-theory",
              "animations",
              "dark-mode",
              "custom-themes",
              "color-customization",
              "responsive-design",
              "accessibility",
            ];
            throw new Error(
              `Guide "${guide}" not found. Available guides: ${availableGuides.join(", ")}`,
            );
          }
          throw error;
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching design guide: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
