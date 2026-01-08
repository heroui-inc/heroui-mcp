/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ComponentContext, Tool} from "../types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

export const getComponentInfoTool: Tool<ComponentContext> = {
  name: "get_component_info",
  description: `Get complete information about HeroUI Native components.
CRITICAL: Always use this before implementing ANY component to understand its anatomy and structure.
Accepts an array of component names and returns information for each component.
Returns: description, import statement, anatomy (component structure), props, subcomponents, examples count, CSS classes, and platform support.
HeroUI Native components are React Native components optimized for mobile development.
The anatomy field shows the exact component structure you must follow.
Use this tool when user asks "how to use X component" or before any implementation.
Workflow: list_components → get_component_info → get_component_examples.`,

  async ctx(shared) {
    return {
      componentList: shared?.componentList || [],
      exampleList: shared?.exampleList || [],
    };
  },

  exec(server, {config, name, description, ctx}) {
    // Create input schema with dynamic component enum
    const inputSchema = z.object({
      components: z.array(z.enum(ctx.componentList as [string, ...string[]])).min(1)
        .describe(`Array of component names from list_components (case-sensitive).
Examples: ["Button"], ["Card", "TextField"], ["Button", "Card", "Tabs"].
DO NOT guess names - always verify with list_components first.`),
    });

    const handler = async ({components}: z.infer<typeof inputSchema>) => {
      try {
        const response = await fetchApi<{
          version: string;
          results: Array<{
            component: string;
            data?: {
              name: string;
              description?: string;
              importStatement?: string;
              anatomy?: string;
              props: Record<string, any>;
              subComponents?: Record<string, any>;
              examples?: Array<{name: string; content: string}>;
              cssClasses?: Array<{name: string; description: string}>;
              platforms?: string[];
              links?: {
                source?: string;
                styles?: string;
              };
            };
            error?: string;
          }>;
        }>("/components", config.apiBaseUrl, {
          method: "POST",
          body: JSON.stringify({components}),
        });

        let responseText = "";

        if (components.length > 1) {
          responseText = `# Component Information (${components.length} components)\n\n`;
          responseText += `**Note:** HeroUI Native provides React Native components for mobile development\n\n`;
        }

        response.results.forEach((result, index) => {
          if (index > 0) responseText += "\n---\n\n";

          if (result.error || !result.data) {
            responseText += `# ${result.component} Component\n\n`;
            responseText += `Error: ${result.error || "Component not found"}\n`;

            return;
          }

          responseText += `# ${result.component} Component\n\n`;

          if (components.length === 1) {
            responseText += `**Note:** HeroUI Native provides React Native components for mobile development\n\n`;
          }

          responseText += `**Library:** HeroUI Native\n`;
          responseText += `**Version:** ${response.version}\n\n`;

          if (result.data.description) {
            responseText += `## Description\n${result.data.description}\n\n`;
          }

          if (result.data.importStatement) {
            responseText += `## Import\n\`\`\`tsx\n${result.data.importStatement}\n\`\`\`\n\n`;
          }

          if (result.data.anatomy) {
            responseText += `## Anatomy\n\`\`\`tsx\n${result.data.anatomy}\n\`\`\`\n\n`;
          }

          if (result.data.platforms && result.data.platforms.length > 0) {
            responseText += `## Platform Support\n`;
            result.data.platforms.forEach((platform) => {
              responseText += `- ${platform}\n`;
            });
            responseText += "\n";
          }

          if (result.data.props && Object.keys(result.data.props).length > 0) {
            responseText += `## Props\n`;
            Object.entries(result.data.props).forEach(([propName, prop]) => {
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

          if (result.data.subComponents && Object.keys(result.data.subComponents).length > 0) {
            responseText += `## Sub-components\n`;
            Object.entries(result.data.subComponents).forEach(([subName, subComp]) => {
              responseText += `### ${result.component}.${subName}\n`;
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

          if (result.data.cssClasses && result.data.cssClasses.length > 0) {
            responseText += `## CSS Classes (BEM)\n`;
            responseText += `HeroUI Native follows the BEM pattern for styling components. You can customize these classes globally:\n\n`;
            result.data.cssClasses.forEach((cssClass) => {
              responseText += `- **${cssClass.name}** - ${cssClass.description}\n`;
            });
            responseText += "\n";
          }

          if (result.data.links) {
            responseText += `## Source Code\n`;
            if (result.data.links.source || result.data.links.styles) {
              responseText += `Use the \`get_component_source\` tool to retrieve:\n`;
              if (result.data.links.source) {
                responseText += `- React Native/TypeScript implementation\n`;
              }
              if (result.data.links.styles) {
                responseText += `- CSS/StyleSheet styles\n`;
              }
              responseText += "\n";
            }
          }

          if (result.data.examples && result.data.examples.length > 0) {
            responseText += `## Examples\n`;
            responseText += `This component has ${result.data.examples.length} example${result.data.examples.length > 1 ? "s" : ""} available.\n`;
            responseText += `Use the \`get_component_examples\` tool to retrieve the example code.\n`;
          }
        });

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
              text: `Error: Unable to get information for components. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool
    server.registerTool(name, {description, inputSchema: inputSchema.shape}, handler as any);
  },
};
