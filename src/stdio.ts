#!/usr/bin/env node

/**
 * HeroUI MCP Server
 * Provides component documentation and props via Model Context Protocol
 */

import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {CallToolRequestSchema, ListToolsRequestSchema} from "@modelcontextprotocol/sdk/types.js";

import {McpServerCore} from "./services/mcp-server-core.js";

// Initialize MCP server core
const mcpServerCore = new McpServerCore();

// Create the MCP server
const server = new Server(
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

// Delegate to MCP server core
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return await mcpServerCore.handleListTools();
});

// Delegate tool calls to MCP server core
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return await mcpServerCore.handleToolCall(request.params);
});

// Start the server
async function main() {
  // Initialize MCP server core
  await mcpServerCore.initialize();

  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("HeroUI MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
