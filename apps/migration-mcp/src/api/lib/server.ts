/**
 * Create and configure the MCP server
 */

import type {ToolConfig} from "../../mcp/types";
import type {AnalyticsService} from "../services/analytics";

import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {initializePrompts} from "../../mcp/prompts";
import {initializeTools} from "../../mcp/tools";

import {packageInfo} from "./package-info";

/**
 * Create and configure the MCP server
 */
export async function createMcpServer(
  config: ToolConfig & {analytics?: AnalyticsService} = {},
): Promise<McpServer> {
  const server = new McpServer({
    name: packageInfo.name,
    version: packageInfo.version,
    capabilities: {
      prompts: {},
    },
    instructions: `## HeroUI v2 to v3 Migration Guide

This MCP server provides comprehensive migration instructions for upgrading from HeroUI v2 to v3.

### Key Changes in v3
- **Tailwind CSS v4 Required**: HeroUI v3 requires Tailwind CSS v4 (NOT v3)
- **No Provider Needed**: Unlike v2, v3 components work directly without a Provider
- **Compound Components**: Components use compound patterns (e.g., Card.Header, Card.Content)
- **onPress Instead of onClick**: Use onPress for better accessibility
- **React 19+ Features**: Built on modern React features

### Available Tools

**Primary Resource for Agents:**

1. **get_agent_migration_guide**: Get the agent-focused migration guide. This is the PRIMARY resource for AI assistants. It covers:
   - Agent-specific principles and best practices
   - How to guide users through MCP prompts
   - Incremental migration workflow
   - General migration guidelines from agent perspective
   - Component and styling migration guidance
   
   **Always start with this tool** when helping users migrate.

**Additional Tools:**

2. **get_migration_guide**: Get the user-facing migration guide. Use this for reference if you need the user's perspective on migration steps.

3. **list_migration_guides**: List all available component-specific migration guides. Use this to discover which components have migration documentation.

4. **get_component_guides**: Get migration guides for one or more components. Includes component-specific API changes, prop migrations, code examples, and breaking changes. Accepts a components array parameter.

5. **get_styling_migration_guide**: Get styling migration guide covering utility classes, color tokens, and CSS variable changes.

### Available Prompts

Use prompts to guide your incremental migration workflow:

1. **analyze-project**: Analyze your project to identify all HeroUI v2 components in use
2. **create-migration-plan**: Generate an incremental migration plan based on analysis
3. **migrate-component-group**: Get migration instructions for a specific group of components
4. **verify-migration-step**: Verify that a migration step was completed successfully
5. **handle-dependencies**: Identify and handle component dependencies during migration
6. **migrate-styling-phase**: Get styling migration instructions after component migration

### Usage Workflow

**Using Prompts (Recommended for Incremental Migration):**

1. Invoke \`analyze-project\` prompt to analyze your codebase
2. Invoke \`create-migration-plan\` prompt to create a phased migration plan
3. For each phase, invoke \`migrate-component-group\` prompt with component list
4. After each phase, invoke \`verify-migration-step\` prompt
5. After all components migrated, switch dependencies and invoke \`migrate-styling-phase\` prompt

**Using Tools (For Agents):**

1. **Start with \`get_agent_migration_guide\`** - This is your primary resource. Read this first to understand how to help users migrate.
2. Use \`list_migration_guides\` to see all available component guides
3. Use \`get_component_guides\` with a components array for specific migration instructions when migrating components
4. Use \`get_styling_migration_guide\` for styling migration after components are migrated
5. Use \`get_migration_guide\` only if you need the user-facing perspective for reference

**Workflow:**
- Call \`get_agent_migration_guide()\` first to understand your role and workflow
- Guide users through prompts (users invoke prompts, you guide them)
- Use \`get_component_guides\` when migrating specific components
- Use \`get_styling_migration_guide\` after dependency switch

Example:
- \`get_agent_migration_guide()\` - **Start here** - Get agent guide
- \`list_migration_guides()\` - List all components
- \`get_component_guides({ components: ["button"] })\` - Get button migration guide
- \`get_component_guides({ components: ["button", "card", "modal"] })\` - Get multiple component guides
- \`get_styling_migration_guide()\` - Get styling migration guide`,
  });

  // Initialize tools with config
  await initializeTools(server, config);

  // Initialize prompts (no analytics needed - prompts just return static templates)
  await initializePrompts(server);

  return server;
}
