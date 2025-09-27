import type {Tool} from "./types.js";

import {z} from "zod";

import {wrapWithAnalytics} from "../lib/tool-analytics-wrapper.js";

const inputSchema = z.object({
  library: z.enum(["heroui", "native"]).describe("The library to get component props from"),
  component: z.string().describe("The name of the component"),
  version: z
    .string()
    .optional()
    .describe(
      "Specific version to use (e.g., 'v3.0.0-alpha.3'). Defaults to latest if not specified",
    ),
});

export const getComponentPropsTool: Tool = {
  name: "get_component_props",
  description: "Get detailed props information for a specific HeroUI or HeroUI Native component",

  exec(server, {config, name, description}) {
    const handler = async ({library, component, version}: z.infer<typeof inputSchema>) => {
      try {
        let componentData;

        if (config.dataService) {
          // Use R2 data service
          componentData = await config.dataService.getComponent(library, component, version);
        } else {
          // Fallback to local fetch
          const {fetchComponentProps} = await import("../lib/fetch.js");
          componentData = await fetchComponentProps(library, component, version, config.apiBaseUrl);
        }

        if (!componentData) {
          return {
            content: [
              {
                type: "text",
                text: `Component "${component}" not found in ${library}${version ? ` version ${version}` : ""}`,
              },
            ],
          };
        }

        // Format props as markdown
        const libraryName = library === "heroui" ? "HeroUI" : "HeroUI Native";
        const versionText = version ? ` (${version})` : " (latest)";

        let propsText = `# ${componentData.name} Component Props - ${libraryName}${versionText}\n\n`;

        if (componentData.description) {
          propsText += `${componentData.description}\n\n`;
        }

        propsText += "## Props\n\n";

        for (const [propName, prop] of Object.entries(componentData.props)) {
          propsText += `- **${propName}**: \`${prop.type}\``;
          if (prop.description) {
            propsText += ` - ${prop.description}`;
          }
          if (prop.default !== undefined) {
            propsText += ` (default: \`${prop.default}\`)`;
          }
          propsText += "\n";
        }

        if (componentData.importStatement) {
          propsText += `\n## Import\n\n\`\`\`javascript\n${componentData.importStatement}\n\`\`\``;
        }

        return {
          content: [
            {
              type: "text",
              text: propsText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Unable to get props for ${component}. ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
        };
      }
    };

    // Register tool with analytics wrapper
    server.tool(name, description, inputSchema, wrapWithAnalytics(server, name, handler));
  },
};
