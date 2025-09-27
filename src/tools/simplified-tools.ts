/**
 * Simplified tool implementations that work with the standard MCP Server
 */

import type {Server} from "@modelcontextprotocol/sdk/server/index.js";

import {z} from "zod";

import {
  fetchComponentExample,
  fetchComponentList,
  fetchComponentProps,
  checkVersion as fetchVersionCheck,
} from "../lib/fetch.js";

export interface ToolConfig {
  apiBaseUrl?: string;
  useLocalData?: boolean;
}

// Tool schemas
const listComponentsSchema = z.object({
  library: z.enum(["heroui", "native"]),
  version: z.string().optional(),
});

const getComponentPropsSchema = z.object({
  library: z.enum(["heroui", "native"]),
  component: z.string(),
  version: z.string().optional(),
});

const getComponentExampleSchema = z.object({
  library: z.enum(["heroui", "native"]),
  component: z.string(),
  version: z.string().optional(),
});

const checkVersionSchema = z.object({
  package: z.enum(["heroui", "native", "mcp"]),
  currentVersion: z.string().optional(),
});

/**
 * Register all tools with the server
 */
export async function registerTools(server: Server, config: ToolConfig = {}): Promise<void> {
  const finalConfig: ToolConfig = {
    apiBaseUrl: config.apiBaseUrl || process.env.HEROUI_API_URL || "https://mcp.heroui.com",
    useLocalData: config.useLocalData ?? false,
    ...config,
  };

  // Handle tools/list
  server.setRequestHandler("tools/list", async () => ({
    tools: [
      {
        name: "list_components",
        description: "List all available components in HeroUI or HeroUI Native",
        inputSchema: {
          type: "object",
          properties: {
            library: {
              type: "string",
              enum: ["heroui", "native"],
              description: "The library to list components from",
            },
            version: {
              type: "string",
              description: "Specific version to use (e.g., 'v3.0.0-alpha.3')",
            },
          },
          required: ["library"],
        },
      },
      {
        name: "get_component_props",
        description:
          "Get detailed props information for a specific HeroUI or HeroUI Native component",
        inputSchema: {
          type: "object",
          properties: {
            library: {
              type: "string",
              enum: ["heroui", "native"],
              description: "The library to get component props from",
            },
            component: {
              type: "string",
              description: "The name of the component",
            },
            version: {
              type: "string",
              description: "Specific version to use",
            },
          },
          required: ["library", "component"],
        },
      },
      {
        name: "get_component_example",
        description: "Get usage example for a specific HeroUI or HeroUI Native component",
        inputSchema: {
          type: "object",
          properties: {
            library: {
              type: "string",
              enum: ["heroui", "native"],
              description: "The library to get the component from",
            },
            component: {
              type: "string",
              description: "The name of the component",
            },
            version: {
              type: "string",
              description: "Specific version to use",
            },
          },
          required: ["library", "component"],
        },
      },
      {
        name: "check_version",
        description:
          "Check if you're using the latest version of HeroUI, HeroUI Native, or the MCP server",
        inputSchema: {
          type: "object",
          properties: {
            package: {
              type: "string",
              enum: ["heroui", "native", "mcp"],
              description: "The package to check version for",
            },
            currentVersion: {
              type: "string",
              description: "The current version being used",
            },
          },
          required: ["package"],
        },
      },
    ],
  }));

  // Handle tools/call
  server.setRequestHandler("tools/call", async (request) => {
    const {name, arguments: args} = request.params;

    try {
      switch (name) {
        case "list_components": {
          const {library, version} = listComponentsSchema.parse(args);

          let components: string[];

          if (finalConfig.useLocalData) {
            const {componentDataService} = await import("../services/component-data-service.js");
            components = await componentDataService.listComponents(library, version);
          } else {
            components = await fetchComponentList(library, version, finalConfig.apiBaseUrl);
          }

          const libraryName = library === "heroui" ? "HeroUI" : "HeroUI Native";
          const versionText = version ? ` (${version})` : " (latest)";

          return {
            content: [
              {
                type: "text" as const,
                text: `Available Components in ${libraryName}${versionText}\n\n${components.map((c) => `- ${c}`).join("\n")}\n\nTotal: ${components.length} components`,
              },
            ],
          };
        }

        case "get_component_props": {
          const {library, component, version} = getComponentPropsSchema.parse(args);

          let componentData;

          if (finalConfig.useLocalData) {
            const {componentDataService} = await import("../services/component-data-service.js");
            componentData = await componentDataService.getComponent(library, component, version);
          } else {
            componentData = await fetchComponentProps(
              library,
              component,
              version,
              finalConfig.apiBaseUrl,
            );
          }

          if (!componentData) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Component "${component}" not found in ${library}${version ? ` version ${version}` : ""}`,
                },
              ],
            };
          }

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
                type: "text" as const,
                text: propsText,
              },
            ],
          };
        }

        case "get_component_example": {
          const {library, component, version} = getComponentExampleSchema.parse(args);

          let exampleText: string;

          if (finalConfig.useLocalData) {
            const {componentDataService} = await import("../services/component-data-service.js");
            const componentData = await componentDataService.getComponent(
              library,
              component,
              version,
            );

            if (!componentData) {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Component "${component}" not found in ${library}${version ? ` version ${version}` : ""}`,
                  },
                ],
              };
            }

            // Generate example
            const libraryName = library === "heroui" ? "HeroUI" : "HeroUI Native";
            const versionText = version ? ` (${version})` : " (latest)";

            exampleText = `// ${componentData.name} Component Example - ${libraryName}${versionText}\n\n`;

            if (componentData.importStatement) {
              exampleText += `${componentData.importStatement}\n\n`;
            }

            exampleText += `export default function Example() {\n`;
            exampleText += `  return (\n`;
            exampleText += `    <${componentData.name}>\n`;
            exampleText += `      Content\n`;
            exampleText += `    </${componentData.name}>\n`;
            exampleText += `  );\n`;
            exampleText += `}`;
          } else {
            exampleText = await fetchComponentExample(
              library,
              component,
              version,
              finalConfig.apiBaseUrl,
            );
          }

          return {
            content: [
              {
                type: "text" as const,
                text: exampleText,
              },
            ],
          };
        }

        case "check_version": {
          const {package: pkg, currentVersion} = checkVersionSchema.parse(args);

          let result: string;

          if (finalConfig.useLocalData) {
            const {versionCheckService} = await import("../services/version-check-service.js");
            result = await versionCheckService.checkVersion(pkg, currentVersion);
          } else {
            const versionResult = await fetchVersionCheck(
              pkg,
              currentVersion,
              finalConfig.apiBaseUrl,
            );
            result = versionResult.message;
          }

          return {
            content: [
              {
                type: "text" as const,
                text: result,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid parameters: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
        );
      }
      throw error;
    }
  });
}
