/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

const inputSchema = z.object({
  library: z.enum(["heroui", "native"]).describe("The library to get the component from"),
  component: z.string().describe("The name of the component"),
  type: z
    .enum(["source", "styles", "both"])
    .describe(
      "Type of source to retrieve: 'source' for React/TS code, 'styles' for CSS, 'both' for both",
    ),
  version: z
    .string()
    .optional()
    .describe(
      "Specific version to use (e.g., 'v3.0.0-alpha.31'). Defaults to latest if not specified",
    ),
});

export const getComponentSourceTool: Tool = {
  name: "get_component_source",
  description:
    "Get the source code and/or CSS styles for a specific HeroUI or HeroUI Native component. This provides access to the actual implementation and styling code from the GitHub repository.",

  exec(server, {config, name, description}) {
    const handler = async ({library, component, type, version}: z.infer<typeof inputSchema>) => {
      try {
        // Encode component name to handle special characters
        const encodedComponent = encodeURIComponent(component);
        let responseText = `# ${component} Component Source Code\n\n`;
        responseText += `**Library:** ${library === "heroui" ? "HeroUI" : "HeroUI Native"}\n`;
        if (version) {
          responseText += `**Version:** ${version}\n`;
        }
        responseText += "\n";

        const errors: string[] = [];

        // Fetch source code if requested
        if (type === "source" || type === "both") {
          try {
            const sourceEndpoint = `/components/${library}/${encodedComponent}/source${version ? `?version=${version}` : ""}`;
            const sourceResponse = await fetchApi<{
              library: string;
              component: string;
              version: string;
              filePath: string;
              sourceCode: string;
              githubUrl: string;
            }>(sourceEndpoint, config.apiBaseUrl);

            responseText += `## React/TypeScript Source\n`;
            responseText += `**File:** \`${sourceResponse.filePath}\`\n`;
            responseText += `**GitHub:** [View on GitHub](${sourceResponse.githubUrl})\n\n`;
            responseText += `\`\`\`tsx\n${sourceResponse.sourceCode}\n\`\`\`\n\n`;
          } catch (error: any) {
            if (error.status === 404) {
              errors.push(`Source code not available for ${component}`);
            } else {
              errors.push(`Failed to fetch source code: ${error.message}`);
            }
          }
        }

        // Fetch styles if requested
        if (type === "styles" || type === "both") {
          try {
            const stylesEndpoint = `/components/${library}/${encodedComponent}/styles${version ? `?version=${version}` : ""}`;
            const stylesResponse = await fetchApi<{
              library: string;
              component: string;
              version: string;
              filePath: string;
              stylesCode: string;
              githubUrl: string;
            }>(stylesEndpoint, config.apiBaseUrl);

            responseText += `## CSS Styles\n`;
            responseText += `**File:** \`${stylesResponse.filePath}\`\n`;
            responseText += `**GitHub:** [View on GitHub](${stylesResponse.githubUrl})\n\n`;
            responseText += `\`\`\`css\n${stylesResponse.stylesCode}\n\`\`\`\n\n`;
          } catch (error: any) {
            if (error.status === 404) {
              errors.push(`CSS styles not available for ${component}`);
            } else {
              errors.push(`Failed to fetch styles: ${error.message}`);
            }
          }
        }

        // If there were errors, append them to the response
        if (errors.length > 0) {
          responseText += `## Notes\n`;
          errors.forEach((error) => {
            responseText += `- ${error}\n`;
          });
        }

        // If no content was retrieved at all
        if (
          errors.length > 0 &&
          ((type === "both" && errors.length === 2) || (type !== "both" && errors.length === 1))
        ) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Component source not available for ${component}. ${errors.join(". ")}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: responseText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Unable to get source code for ${component}. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
