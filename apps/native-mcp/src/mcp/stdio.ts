/**
 * HeroUI Native MCP STDIO Server
 *
 * This is the main entry point for the npm package @heroui/native-mcp
 * It runs locally and communicates with the HeroUI API server
 */

import type {LoadedSkills} from "./skills";

import {McpServer} from "@modelcontextprotocol/server";
import {serveStdio} from "@modelcontextprotocol/server/stdio";

import {API_BASE_URL} from "./constants";
import {packageInfo} from "./lib/package-info";
import {SKILLS_REFRESH_INTERVAL_MS, loadSkills, waitForSkills} from "./skills";
import {initializeTools} from "./tools";

/**
 * Create and configure the MCP server. The skills are awaited only after the
 * tools are set up, so the wait for them overlaps the tools setup.
 */
async function createServer(skills?: Promise<LoadedSkills | undefined>): Promise<McpServer> {
  const server = new McpServer(
    {
      name: packageInfo.name,
      version: packageInfo.version,
    },
    {
      instructions: `## HeroUI Native MCP Tools - Documentation

These tools provide documentation for **HeroUI Native** React Native components.

### ⚠️ IMPORTANT: Version Information
• **Current Support:** HeroUI Native ONLY
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
• This MCP is for HeroUI Native
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

  // Serve the HeroUI Native skill over MCP (io.modelcontextprotocol/skills)
  (await skills)?.catalog.attach(server);

  return server;
}

/**
 * Main function
 */
async function main() {
  try {
    // Load the skills once, in the background, so loading them never holds up
    // startup; each server instance gets the same catalog, refreshed hourly so
    // long-running sessions pick up skill updates
    const skillsLoading = loadSkills(API_BASE_URL);

    void skillsLoading.then((skills) => {
      if (skills) {
        setInterval(() => void skills.refresh(), SKILLS_REFRESH_INTERVAL_MS).unref();
      }
    });

    // serveStdio negotiates the protocol era per connection: 2026-07-28
    // clients (needed for Skills over MCP) and 2025-era clients are both served
    // from the same factory. It runs the factory on the client's first message;
    // the skills must be attached before the server connects, so the factory
    // waits briefly for them (alongside the tools setup) and serves the tools
    // alone if they are not ready.
    serveStdio(() => createServer(waitForSkills(skillsLoading)), {
      onerror: (error) => {
        // eslint-disable-next-line no-console
        console.error("MCP error:", error);
      },
    });

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
