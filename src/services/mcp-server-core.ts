#!/usr/bin/env node

/**
 * Simplified MCP Server Core - Lazy loading with component data service
 * Provides component documentation via Model Context Protocol
 */

import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import {z} from "zod";

import {componentDataService} from "./component-data-service.js";
import {versionCheckService} from "./version-check-service.js";

// Tool schemas
const getComponentPropsSchema = z.object({
  component: z.string().describe("The name of the component"),
  library: z.enum(["heroui", "native"]).describe("The library to get component props from"),
  version: z
    .string()
    .optional()
    .describe(
      'Specific version to use (e.g., "v3.0.0-alpha.3"). Defaults to latest if not specified',
    ),
});

const listComponentsSchema = z.object({
  library: z.enum(["heroui", "native"]).describe("The library to list components from"),
  version: z
    .string()
    .optional()
    .describe(
      'Specific version to use (e.g., "v3.0.0-alpha.3"). Defaults to latest if not specified',
    ),
});

const getComponentExampleSchema = z.object({
  component: z.string().describe("The name of the component"),
  library: z.enum(["heroui", "native"]).describe("The library to get example from"),
  version: z
    .string()
    .optional()
    .describe(
      'Specific version to use (e.g., "v3.0.0-alpha.3"). Defaults to latest if not specified',
    ),
});

const checkVersionSchema = z.object({
  currentVersion: z
    .string()
    .optional()
    .describe("The current version installed (optional, will check if update is needed)"),
  package: z
    .enum(["heroui", "native", "mcp"])
    .describe("The package to check version for (heroui, native, or mcp)"),
});

/**
 * Simplified MCP Server Core Class - No memory loading
 */
export class McpServerCore {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "heroui-mcp",
        version: "0.0.0-alpha.1",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupRequestHandlers();
  }

  /**
   * Handle MCP initialize request
   */
  async handleInitialize(params: {protocolVersion?: string}): Promise<{
    capabilities: {tools: {}};
    protocolVersion: string;
    serverInfo: {name: string; version: string};
  }> {
    // Validate protocol version if provided
    if (params?.protocolVersion && params.protocolVersion !== "2025-03-26") {
      console.warn(`Client requested protocol version ${params.protocolVersion}, using 2025-03-26`);
    }

    return {
      capabilities: {
        tools: {},
      },
      protocolVersion: "2025-03-26",
      serverInfo: {
        name: "heroui-mcp",
        version: "0.0.0-alpha.1",
      },
    };
  }

  /**
   * Handle MCP initialized notification
   */
  async handleInitialized(): Promise<void> {
    // Initialization complete - server is ready
  }

  /**
   * Initialize the server (no longer needs data loading)
   */
  async initialize(): Promise<void> {
    // No initialization needed - data is loaded lazily
  }

  /**
   * Handle list tools request
   */
  async handleListTools(): Promise<{
    tools: {
      description: string;
      inputSchema: {
        properties: Record<string, any>;
        required: string[];
        type: string;
      };
      name: string;
    }[];
  }> {
    return {
      tools: [
        {
          description: "List all available components in HeroUI or HeroUI Native",
          inputSchema: {
            properties: {
              library: {
                description: "The library to list components from",
                enum: ["heroui", "native"],
                type: "string",
              },
              version: {
                description: "Specific version to use (optional, defaults to latest)",
                type: "string",
              },
            },
            required: ["library"],
            type: "object",
          },
          name: "list_components",
        },
        {
          description: "Get the props/properties for a specific HeroUI component",
          inputSchema: {
            properties: {
              component: {
                description: "The name of the component",
                type: "string",
              },
              library: {
                description: "The library containing the component",
                enum: ["heroui", "native"],
                type: "string",
              },
              version: {
                description: "Specific version to use (optional, defaults to latest)",
                type: "string",
              },
            },
            required: ["library", "component"],
            type: "object",
          },
          name: "get_component_props",
        },
        {
          description: "Get usage examples for a specific HeroUI component",
          inputSchema: {
            properties: {
              component: {
                description: "The name of the component",
                type: "string",
              },
              library: {
                description: "The library containing the component",
                enum: ["heroui", "native"],
                type: "string",
              },
              version: {
                description: "Specific version to use (optional, defaults to latest)",
                type: "string",
              },
            },
            required: ["library", "component"],
            type: "object",
          },
          name: "get_component_example",
        },
        {
          description: "Check if you're using the latest version of HeroUI packages or MCP server",
          inputSchema: {
            properties: {
              currentVersion: {
                description: "The current version installed (optional)",
                type: "string",
              },
              package: {
                description: "The package to check version for",
                enum: ["heroui", "native", "mcp"],
                type: "string",
              },
            },
            required: ["package"],
            type: "object",
          },
          name: "check_version",
        },
      ],
    };
  }

  /**
   * Handle tool call request
   */
  async handleToolCall(params: {arguments?: Record<string, unknown>; name: string}): Promise<{
    content: {text: string; type: string}[];
    isError?: boolean;
  }> {
    const {arguments: args, name} = params;

    if (!args) {
      throw new McpError(ErrorCode.InvalidParams, "Missing required arguments");
    }

    if (name === "list_components") {
      return this.handleListComponents(args as {library: string; version: string});
    } else if (name === "get_component_props") {
      return this.handleGetComponentProps(
        args as {component: string; library: string; version: string},
      );
    } else if (name === "get_component_example") {
      return this.handleGetComponentExample(
        args as {component: string; library: string; version: string},
      );
    } else if (name === "check_version") {
      return this.handleCheckVersion(
        args as {package: "heroui" | "native" | "mcp"; currentVersion?: string},
      );
    } else {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  }

  /**
   * Handle list components tool
   */
  private async handleListComponents(args: {library: string; version: string}): Promise<{
    content: {text: string; type: string}[];
    isError?: boolean;
  }> {
    const {library, version} = listComponentsSchema.parse(args);

    try {
      const components = await componentDataService.listComponents(library, version);
      const displayLibrary = library === "heroui" ? "HeroUI" : "HeroUI Native";
      const versionText = version ? ` (${version})` : " (latest)";

      const componentsList = components.map((name) => `- ${name}`).join("\n");

      return {
        content: [
          {
            text: `# Available Components in ${displayLibrary}${versionText}\n\n${componentsList}\n\nTotal: ${components.length} components`,
            type: "text",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            text: `Error loading components for ${library}: ${error}`,
            type: "text",
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle get component props tool
   */
  private async handleGetComponentProps(args: {
    component: string;
    library: string;
    version: string;
  }): Promise<{
    content: {text: string; type: string}[];
    isError?: boolean;
  }> {
    const {component, library, version} = getComponentPropsSchema.parse(args);

    try {
      const componentData = await componentDataService.getComponent(library, component, version);
      const displayLibrary = library === "heroui" ? "HeroUI" : "HeroUI Native";
      const versionText = version ? ` (${version})` : " (latest)";

      const propsList = Object.entries(componentData.props)
        .map(([name, prop]) => {
          const defaultText = prop.default !== undefined ? ` (default: ${prop.default})` : "";
          const requiredText = prop.required ? " **(required)**" : "";

          return `- **${name}**: \`${prop.type}\`${requiredText}${defaultText}${prop.description ? ` - ${prop.description}` : ""}`;
        })
        .join("\n");

      return {
        content: [
          {
            text: `# ${componentData.name} Component Props - ${displayLibrary}${versionText}\n\n${componentData.description ? `${componentData.description}\n\n` : ""}## Props\n\n${propsList || "No props available"}\n\n${componentData.importStatement ? `## Import\n\n\`\`\`tsx\n${componentData.importStatement}\n\`\`\`` : ""}`,
            type: "text",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            text: `Error loading component props for ${library}/${component}: ${error}`,
            type: "text",
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle get component example tool
   */
  private async handleGetComponentExample(args: {
    component: string;
    library: string;
    version: string;
  }): Promise<{
    content: {text: string; type: string}[];
    isError?: boolean;
  }> {
    const {component, library, version} = getComponentExampleSchema.parse(args);

    try {
      const example = await componentDataService.getComponentExample(library, component, version);
      const displayLibrary = library === "heroui" ? "HeroUI" : "HeroUI Native";
      const versionText = version ? ` (${version})` : " (latest)";

      return {
        content: [
          {
            text: `# ${component} Component Example - ${displayLibrary}${versionText}\n\n${example}`,
            type: "text",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            text: `Error loading component example for ${library}/${component}: ${error}`,
            type: "text",
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle check version tool
   */
  private async handleCheckVersion(args: {
    package: "heroui" | "native" | "mcp";
    currentVersion?: string;
  }): Promise<{
    content: {text: string; type: string}[];
    isError?: boolean;
  }> {
    const parsed = checkVersionSchema.parse(args);

    try {
      let versionInfo;
      let packageName;

      switch (parsed.package) {
        case "heroui":
          packageName = "HeroUI";
          versionInfo = await versionCheckService.checkHeroUIVersion(parsed.currentVersion);
          break;
        case "native":
          packageName = "HeroUI Native";
          versionInfo = await versionCheckService.checkHeroUINativeVersion(parsed.currentVersion);
          break;
        case "mcp":
          packageName = "HeroUI MCP";
          versionInfo = await versionCheckService.checkMCPVersion(parsed.currentVersion);
          break;
      }

      let message = `# ${packageName} Version Check\n\n`;

      message += `**Current Version:** ${versionInfo.currentVersion}\n`;
      message += `**Latest Version:** ${versionInfo.latestVersion}\n`;
      message += `**Status:** ${versionInfo.isLatest ? "✅ Up to date" : "⚠️ Update available"}\n\n`;
      message += `${versionInfo.recommendation}\n`;

      if (versionInfo.allVersions && versionInfo.allVersions.length > 0) {
        message += `\n## Recent Versions\n`;
        message += versionInfo.allVersions
          .slice(0, 5)
          .map((v) => `- ${v}`)
          .join("\n");
      }

      return {
        content: [
          {
            text: message,
            type: "text",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            text: `Error checking version for ${args.package}: ${error}`,
            type: "text",
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Setup MCP request handlers (empty for now)
   */
  private setupRequestHandlers(): void {
    // Request handlers setup will be done by transport layer
  }
}
