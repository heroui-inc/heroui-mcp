/**
 * HeroUI MCP STDIO Server
 *
 * This is the main entry point for the npm package @heroui/mcp
 * It runs locally and communicates with the HeroUI API server
 */

import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";

import {packageInfo} from "./lib/package-info";
import {initializeTools} from "./tools";

// API client configuration
// Use local development server when running in dev mode
const isDevelopment = process.env.NODE_ENV === "development" || process.argv.includes("--dev");
const API_BASE_URL =
  process.env.HEROUI_API_URL ||
  (isDevelopment ? "http://localhost:8787" : "https://mcp-api.heroui.com");

/**
 * Create and configure the MCP server
 */
async function createServer(): Promise<McpServer> {
  const server = new McpServer({
    name: packageInfo.name,
    version: packageInfo.version,
    instructions: `## HeroUI MCP Tools - Quick Start Guide

Welcome to HeroUI MCP! These tools help you work with HeroUI v3 components effectively.

### Essential Workflow
Always follow this order when implementing HeroUI components:

1. **list_components** - Check available components
2. **get_component_info** - Get complete API and anatomy
3. **get_component_props** - Review TypeScript types
4. **get_component_examples** - See usage patterns

### Key Points
• HeroUI v3 uses compound components (e.g., Card.Header, Card.Content)
• Requires Tailwind CSS v4 (v3 not supported)
• Built on React Aria for full accessibility
• Uses OKLCH color format for theming

### Example Usage
\`\`\`javascript
// First, check component structure
get_component_info({ library: "heroui", component: "Card" })

// Then implement with correct anatomy
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
  </Card.Header>
  <Card.Content>Content</Card.Content>
</Card>
\`\`\`

### Pro Tips
• Never guess component APIs - always use tools first
• Check anatomy for compound component structure
• Use get_theme_info for customization variables
• Query design guides for best practices

For detailed guidelines, see: https://v3.heroui.com/llms-full.txt`,
    capabilities: {
      tools: {
        listChanged: true,
      },
    },
  });

  // Initialize tools from the tools directory
  await initializeTools(server, {
    apiBaseUrl: API_BASE_URL,
  });

  return server;
}

/**
 * Main function
 */
async function main() {
  try {
    // Create server
    const server = await createServer();

    // Create STDIO transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    // Log to stderr to avoid interfering with STDIO
    console.error("HeroUI MCP Server running on STDIO");
    console.error(`API URL: ${API_BASE_URL}`);
    console.error(`Version: ${packageInfo.version}`);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run the server
main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
