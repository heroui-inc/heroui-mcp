/**
 * HeroUI React MCP STDIO Server
 *
 * This is the main entry point for the npm package @heroui/react-mcp
 * It runs locally and communicates with the HeroUI API server
 */

import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";

import {API_BASE_URL} from "./constants";
import {packageInfo} from "./lib/package-info";
import {initializeResources} from "./resources";
import {initializeTools} from "./tools";

/**
 * Create and configure the MCP server
 */
async function createServer(): Promise<McpServer> {
  const server = new McpServer(
    {
      name: packageInfo.name,
      version: packageInfo.version,
    },
    {
      instructions: `## HeroUI React MCP Tools - v3 Beta Documentation

These tools provide documentation for **HeroUI v3 (Beta)** React components.

### ⚠️ IMPORTANT: Version Information
• **Current Support:** HeroUI v3 (Beta) ONLY
• **HeroUI v2:** NOT supported by this MCP
• **Migration from v2 to v3:** NOT available yet (coming when v3 is stable)
• **Status:** v3 is in BETA - expect breaking changes

### 🚫 Migration Notice
**Migration from HeroUI v2 to v3 is NOT supported yet.**
A migration tool will be available in the future when v3 reaches stable release.
For now, v3 should only be used for new projects.

### Getting Started
Use the \`get_docs\` tool to fetch the official installation guide:
\`\`\`javascript
get_docs({ path: "/docs/react/getting-started/quick-start" })
\`\`\`

### Essential Workflow
Always follow this order when implementing HeroUI v3 components:

1. **get_docs** - Fetch installation guide: \`get_docs({ path: "/docs/react/getting-started/quick-start" })\`
2. **list_components** - Check available v3 components
3. **get_component_info** - Get complete API and anatomy
4. **get_component_props** - Review TypeScript types
5. **get_component_examples** - See usage patterns

### Key Differences in v3
• Compound components pattern (e.g., Card.Header, Card.Content)
• Requires Tailwind CSS v4 (NOT v3)
• No Provider component needed (unlike v2)
• Built on React Aria Components
• Modern React 19+ features

### Example Usage
\`\`\`javascript
// Check v3 component structure
get_component_info({ component: "Card" })

// v3 uses compound components (NOT flat props like v2)
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
  </Card.Header>
  <Card.Content>Content</Card.Content>
</Card>
\`\`\`

### Available Documentation
• Components: Use tools to explore v3 components
• Installation: Use get_docs({ path: "/docs/react/getting-started/quick-start" }) for setup guides
• Guides: Use get_docs({ path: "/docs/react/getting-started" }) for other getting-started guides
• Theme: Use get_theme_variables() for theme variable values, or get_docs({ path: "/docs/react/getting-started/theming" }) for theming guides

### Pro Tips
• This MCP is for v3 ONLY - v2 docs are at https://heroui.com
• v3 is BETA - use for experimentation and new projects
• Migration guide will come with stable v3 release
• Report v3 issues at: https://github.com/heroui-inc/heroui/issues

For v3 guidelines: https://v3.heroui.com/llms-full.txt
For v2 documentation: https://heroui.com (not supported by this MCP)`,
      capabilities: {
        tools: {
          listChanged: true,
        },
        resources: {},
      },
    },
  );

  // Initialize tools from the tools directory
  await initializeTools(server, {
    apiBaseUrl: API_BASE_URL,
  });

  // Initialize resources (development guidelines, etc.)
  await initializeResources(server, {
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
    // eslint-disable-next-line no-console
    console.error("HeroUI MCP Server running on STDIO");
    // eslint-disable-next-line no-console
    console.error(`API URL: ${API_BASE_URL}`);
    // eslint-disable-next-line no-console
    console.error(`Version: ${packageInfo.version}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run the server
main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", error);
  process.exit(1);
});
