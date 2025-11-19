/**
 * Create and configure the MCP server
 */

import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {initializeTools} from "../../mcp/tools";

import {packageInfo} from "./package-info";

/**
 * Create and configure the MCP server
 */
export async function createMcpServer(): Promise<McpServer> {
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

### Usage
Use the \`get_migration_guide\` tool to get step-by-step migration instructions for your specific framework and use case.`,
  });

  // Initialize tools
  await initializeTools(server);

  return server;
}
