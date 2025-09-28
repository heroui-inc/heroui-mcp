/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

const inputSchema = z.object({
  library: z.enum(["heroui", "native"]).describe("The library to get the component from"),
  component: z.string().describe("The name of the component"),
  version: z
    .string()
    .optional()
    .describe(
      "Specific version to use (e.g., 'v3.0.0-alpha.31'). Defaults to latest if not specified",
    ),
});

export const getComponentInfoTool: Tool = {
  name: "get_component_info",
  description:
    "Get complete information about a specific HeroUI or HeroUI Native component including description, anatomy, props, and examples",

  exec(server, {config, name, description}) {
    const handler = async ({library, component, version}: z.infer<typeof inputSchema>) => {
      try {
        // Encode component name to handle special characters
        const encodedComponent = encodeURIComponent(component);
        const endpoint = `/components/${library}/${encodedComponent}${version ? `?version=${version}` : ""}`;

        try {
          const response = await fetchApi<{
            library: string;
            component: string;
            version: string;
            latestVersion: string;
            data: {
              name: string;
              description?: string;
              importStatement?: string;
              anatomy?: string;
              props: Record<string, any>;
              subComponents?: Record<string, any>;
              examples?: Array<{name: string; content: string}>;
              cssClasses?: Array<{name: string; description: string}>;
              links?: {
                source?: string;
                styles?: string;
              };
            };
          }>(endpoint, config.apiBaseUrl);

          // Format the response as structured text
          let responseText = `# ${response.component} Component\n\n`;

          // Add library and version info
          responseText += `**Library:** ${response.library === "heroui" ? "HeroUI" : "HeroUI Native"}\n`;
          responseText += `**Version:** ${response.version}`;
          if (response.latestVersion && response.version !== response.latestVersion) {
            responseText += ` (latest: ${response.latestVersion})`;
          }
          responseText += "\n\n";

          // Add description
          if (response.data.description) {
            responseText += `## Description\n${response.data.description}\n\n`;
          }

          // Add import statement
          if (response.data.importStatement) {
            responseText += `## Import\n\`\`\`tsx\n${response.data.importStatement}\n\`\`\`\n\n`;
          }

          // Add anatomy if available
          if (response.data.anatomy) {
            responseText += `## Anatomy\n\`\`\`tsx\n${response.data.anatomy}\n\`\`\`\n\n`;
          }

          // Add props
          if (response.data.props && Object.keys(response.data.props).length > 0) {
            responseText += `## Props\n`;
            Object.entries(response.data.props).forEach(([propName, prop]) => {
              responseText += `- **${propName}**: \`${prop.type}\``;
              if (prop.default) {
                responseText += ` = \`${prop.default}\``;
              }
              if (prop.description) {
                responseText += ` - ${prop.description}`;
              }
              responseText += "\n";
            });
            responseText += "\n";
          }

          // Add sub-components
          if (response.data.subComponents && Object.keys(response.data.subComponents).length > 0) {
            responseText += `## Sub-components\n`;
            Object.entries(response.data.subComponents).forEach(([subName, subComp]) => {
              responseText += `### ${response.component}.${subName}\n`;
              if (subComp.props && Object.keys(subComp.props).length > 0) {
                Object.entries(subComp.props).forEach(([propName, prop]: [string, any]) => {
                  responseText += `- **${propName}**: \`${prop.type}\``;
                  if (prop.default) {
                    responseText += ` = \`${prop.default}\``;
                  }
                  if (prop.description) {
                    responseText += ` - ${prop.description}`;
                  }
                  responseText += "\n";
                });
              }
              responseText += "\n";
            });
          }

          // Add CSS classes
          if (response.data.cssClasses && response.data.cssClasses.length > 0) {
            responseText += `## CSS Classes (BEM)\n`;
            responseText += `HeroUI v3 follows the BEM pattern for styling components. You can customize these classes globally:\n\n`;
            response.data.cssClasses.forEach((cssClass) => {
              responseText += `- **${cssClass.name}** - ${cssClass.description}\n`;
            });
            responseText += "\n";
          }

          // Add source links
          if (response.data.links) {
            responseText += `## Source Code\n`;
            if (response.data.links.source || response.data.links.styles) {
              responseText += `Use the \`get_component_source\` tool to retrieve:\n`;
              if (response.data.links.source) {
                responseText += `- React/TypeScript implementation\n`;
              }
              if (response.data.links.styles) {
                responseText += `- CSS styles\n`;
              }
              responseText += "\n";
            }
          }

          // Add examples count
          if (response.data.examples && response.data.examples.length > 0) {
            responseText += `## Examples\n`;
            responseText += `This component has ${response.data.examples.length} example${response.data.examples.length > 1 ? "s" : ""} available.\n`;
            responseText += `Use the \`get_component_examples\` tool to retrieve the example code.\n`;
          }

          return {
            content: [
              {
                type: "text" as const,
                text: responseText,
              },
            ],
          };
        } catch (error: any) {
          if (error.status === 404) {
            // Try with different case variations if not found
            const variations = [
              component.charAt(0).toUpperCase() + component.slice(1).toLowerCase(),
              component.toLowerCase(),
              component.toUpperCase(),
            ];

            for (const variation of variations) {
              if (variation !== component) {
                try {
                  const altEndpoint = `/components/${library}/${encodeURIComponent(variation)}${version ? `?version=${version}` : ""}`;
                  const altResponse = await fetchApi<any>(altEndpoint, config.apiBaseUrl);

                  // Recursively call with the correct component name
                  return handler({library, component: altResponse.component, version});
                } catch {
                  // Continue to next variation
                }
              }
            }

            return {
              content: [
                {
                  type: "text",
                  text: `Component "${component}" not found in ${library}${version ? ` version ${version}` : ""}`,
                },
              ],
            };
          }
          throw error;
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Unable to get information for ${component}. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.tool(name, description, inputSchema.shape, handler as any);
  },
};
