/**
 * HeroUI Native MCP STDIO Server
 *
 * This is the main entry point for the npm package @heroui/native-mcp
 * It runs locally and communicates with the HeroUI API server
 */

import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";

import {API_BASE_URL} from "./constants";
import {packageInfo} from "./lib/package-info";
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
      instructions: `## HeroUI Native MCP Tools - Beta Documentation

These tools provide documentation for **HeroUI Native (Beta)** React Native components.

### ⚠️ IMPORTANT: Version Information
• **Current Support:** HeroUI Native (Beta) ONLY
• **Status:** Beta - expect breaking changes
• **Target Platform:** React Native (iOS & Android)
• **Built With:** React Native Reanimated, Uniwind (Tailwind CSS for React Native)

### Getting Started
Use the \`get_docs\` tool to fetch the official installation guide:
\`\`\`javascript
get_docs({ path: "/docs/native/getting-started/quick-start" })
\`\`\`

### Essential Workflow
Always follow this order when implementing HeroUI Native components:

1. **get_docs** - Fetch installation guide: \`get_docs({ path: "/docs/native/getting-started/quick-start" })\`
2. **list_components** - Check available components
3. **get_component_docs** - Get complete API, examples, and usage (examples are included in component docs)
4. **get_theme_variables** - Review theme variable values

### Key Features
• Compound components pattern (e.g., Button.StartContent, Button.LabelContent)
• Built on React Native Reanimated for smooth animations
• Uniwind (Tailwind CSS for React Native) for styling
• Comprehensive theme system with semantic colors
• Accessibility-first design
• TypeScript support

### Available Tools
• Components: Use \`list_components\` to see all available components. Use \`get_component_docs({ components: ["ComponentName"] })\` for detailed documentation (includes examples).
• Documentation: Use \`get_docs({ path: "/docs/native/getting-started/quick-start" })\` for setup guides, or \`get_docs({ path: "/docs/native/getting-started/theming" })\` for other guides.
• Theme: Use \`get_theme_variables()\` for default theme variable values.

### Pro Tips
• This MCP is for HeroUI Native Beta
• Beta status - use for experimentation and new projects
• Examples are included in component docs - no separate examples tool needed`,
      capabilities: {
        tools: {
          listChanged: true,
        },
      },
    },
  );

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
    // eslint-disable-next-line no-console
    console.error("HeroUI Native MCP Server running on STDIO");
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
