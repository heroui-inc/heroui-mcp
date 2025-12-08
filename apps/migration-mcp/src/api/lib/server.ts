/**
 * Create and configure the MCP server
 */

import type {ToolConfig} from "../../mcp/types";

import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {initializeTools} from "../../mcp/tools";

import {packageInfo} from "./package-info";

/**
 * Create and configure the MCP server
 */
export async function createMcpServer(config: ToolConfig = {}): Promise<McpServer> {
  const server = new McpServer({
    name: packageInfo.name,
    version: packageInfo.version,
    instructions: `## HeroUI v2 to v3 Migration Guide

This MCP server provides comprehensive migration instructions for upgrading from HeroUI v2 to v3.

### Key Changes in v3
- **Tailwind CSS v4 Required**: HeroUI v3 requires Tailwind CSS v4 (NOT v3)
- **No Provider Needed**: Unlike v2, v3 components work directly without a Provider
- **Compound Components**: Components use compound patterns (e.g., Card.Header, Card.Content)
- **onPress Instead of onClick**: Use onPress for better accessibility
- **React 19+ Features**: Built on modern React features

### Available Tools

1. **get_migration_guide**: Get the comprehensive main migration guide covering overview, steps, dependencies, configuration, and migration checklist.

2. **list_migration_guides**: List all available component-specific migration guides. Use this to discover which components have migration documentation.

3. **get_component_guides**: Get migration guides for one or more components. Includes component-specific API changes, prop migrations, code examples, and breaking changes. Accepts a components array parameter.

### Usage Workflow

1. Start with \`get_migration_guide\` to get the complete migration overview
2. Use \`list_migration_guides\` to see all available component guides
3. Use \`get_component_guides\` with a components array for specific migration instructions

Example:
- \`get_migration_guide()\` - Get main guide
- \`list_migration_guides()\` - List all components
- \`get_component_guides({ components: ["button"] })\` - Get button migration guide
- \`get_component_guides({ components: ["button", "card", "modal"] })\` - Get multiple component guides`,
  });

  // Initialize tools with config
  await initializeTools(server, config);

  return server;
}
