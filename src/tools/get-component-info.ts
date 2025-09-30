/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ComponentContext, Tool} from "./types";

import {z} from "zod";

import {fetchApi} from "../lib/fetch";

export const getComponentInfoTool: Tool<ComponentContext> = {
  name: "get_component_info",
  description: `Get complete information about a HeroUI v3 (Alpha) component - v2 API NOT supported.
⚠️ This returns v3 ALPHA component info - APIs may differ from v2 and may change before stable.
CRITICAL: Always use this before implementing ANY component to understand its v3 anatomy.
Returns: description, import statement, anatomy (compound structure), props, subcomponents, examples count, and CSS classes.
v3 DIFFERENCE: Uses COMPOUND COMPONENTS (e.g., <Card><Card.Header>...</Card.Header></Card>)
v2 used flat props like <Card title="..."> - this pattern is NOT supported in v3.
The anatomy field shows the exact v3 component structure you must follow.
If migrating from v2: Component APIs have changed - check carefully, don't assume v2 patterns work.
Use this tool when user asks "how to use X component" or before any implementation.
Workflow: list_components → get_component_info → get_component_examples.`,

  async ctx() {
    try {
      const data = await fetchApi<{components: string[]}>("/components");

      return {
        componentList: data.components || [],
      };
    } catch (error) {
      console.error("Failed to fetch component list:", error);

      // Return empty list as fallback
      return {
        componentList: [],
      };
    }
  },

  exec(server, {config, name, description, ctx}) {
    // Create input schema with dynamic component enum
    const inputSchema = z.object({
      component: z.enum(ctx.componentList as [string, ...string[]])
        .describe(`The exact component name from list_components (case-sensitive).
Examples: "Button", "Card", "TextField", "Tabs".
DO NOT guess names - always verify with list_components first.`),
    });

    const handler = async ({component}: z.infer<typeof inputSchema>) => {
      try {
        // Encode component name to handle special characters
        const encodedComponent = encodeURIComponent(component);
        const endpoint = `/components/${encodedComponent}`;

        const response = await fetchApi<{
          component: string;
          version: string;
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
        let responseText = `# ${response.component} Component (v3 Alpha)\n\n`;

        // Add version warning
        responseText += `⚠️ **v3 ALPHA Notice:** This is v3 documentation - NOT compatible with v2\n`;
        responseText += `Migration from v2 is not supported yet. APIs may change before stable release.\n\n`;

        // Add library and version info
        responseText += `**Library:** HeroUI v3\n`;
        responseText += `**Version:** ${response.version} (Alpha)\n\n`;

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
