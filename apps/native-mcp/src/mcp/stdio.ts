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
  const server = new McpServer({
    name: packageInfo.name,
    version: packageInfo.version,
    instructions: `## HeroUI Native MCP Tools - React Native Component Documentation

Welcome to HeroUI Native MCP! These tools provide documentation for **HeroUI Native** React Native components.

### ⚠️ IMPORTANT: Version Information
• **Current Status:** Local documentation extraction
• **Target Platform:** React Native (iOS & Android)
• **Built With:** React Native Reanimated, NativeWind v4
• **Status:** Production-ready components with comprehensive documentation

### Getting Started
Use the \`installation\` tool for setting up HeroUI Native in your project:
\`\`\`javascript
installation({ framework: "expo", packageManager: "npm" })
\`\`\`

### Essential Workflow
Always follow this order when implementing HeroUI Native components:

1. **installation** - Set up HeroUI Native in your React Native project
2. **list_components** - Check available Native components
3. **get_component_info** - Get complete API and anatomy
4. **get_component_props** - Review TypeScript types
5. **get_component_examples** - See usage patterns

### Key Features
• Compound components pattern (e.g., Button.StartContent, Button.LabelContent)
• Built on React Native Reanimated for smooth animations
• NativeWind v4 for Tailwind-based styling
• Comprehensive theme system with semantic colors
• Accessibility-first design
• TypeScript support

### Example Usage
\`\`\`javascript
// Check Native component structure
get_component_info({ components: ["Button"] })

// Native uses compound components
<Button variant="primary" onPress={handlePress}>
  <Button.StartContent>
    <Icon name="download" />
  </Button.StartContent>
  <Button.LabelContent>Download</Button.LabelContent>
</Button>
\`\`\`

### Available Documentation
• Components: Use tools to explore Native components
• Theme: Use get_theme_info() for theming
• Installation: Framework-specific setup guides

### Pro Tips
• HeroUI Native is built for production React Native apps
• All components support dark mode out of the box
• Use NativeWind classes for custom styling
• Components are fully typed with TypeScript
• Report issues at: https://github.com/heroui-inc/heroui-native/issues

For complete guidelines: https://github.com/heroui-inc/heroui-native/blob/alpha/README.md`,
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
