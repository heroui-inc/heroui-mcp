# HeroUI Migration MCP

MCP server providing migration instructions for upgrading from HeroUI v2 to v3.

## Features

- **Streamable HTTP Transport**: Uses the Streamable HTTP transport as specified in the MCP specification
- **Migration Approaches**: Provides full and incremental migration workflows
- **Step-by-Step Instructions**: Comprehensive migration guide with code examples
- **Cloudflare Workers**: Deployed on Cloudflare Workers for global availability

## Usage

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "heroui-migration": {
      "url": "https://migration-mcp.heroui.com"
    }
  }
}
```

> **⚠️ Important:** Do not use the Migration MCP alongside the `heroui-react` MCP server. Having both configured simultaneously may confuse AI assistants about which set of component documentation to use. For migration purposes, connect only to the Migration MCP. Once migration is complete, you can switch to using the `heroui-react` MCP for v3 component documentation.

## Available Tools

### `get_migration_workflow`

Get the comprehensive main migration workflow guide for upgrading from HeroUI v2 to v3.

**Parameters:**

- `migrationType` (optional): `"full"` (default) or `"incremental"`. Use `"incremental"` for a workflow where v2 and v3 coexist during migration.

**Returns:**
The complete migration guide including:
- Overview of major changes
- Step-by-step migration instructions
- Dependency updates (React 19+, Tailwind CSS v4)
- Configuration changes (removing Provider, updating CSS imports)
- Component migration reference table
- Migration checklist

### `list_component_migration_guides`

List all available component-specific migration guides.

**Parameters:**
- None

**Returns:**
A list of all component names that have migration guides available (e.g., `button`, `card`, `modal`, `input`, etc.)

### `get_component_migration_guides`

Get migration guides for one or more HeroUI components.

**Parameters:**
- `components` (required): An array of component names in kebab-case (e.g., `["button"]`, `["card", "modal"]`, `["input", "select", "checkbox"]`)

**Returns:**
Migration guides for each requested component, including:
- Component-specific API changes
- Prop changes and migrations
- Code examples showing v2 vs v3 patterns
- Breaking changes
- Migration steps

### `get_styling_migration_guide`

Get the styling migration guide covering CSS variables, theme configuration, style props, and custom styling patterns.

**Parameters:**

- None

**Returns:**
The official styling migration documentation.

### `get_hooks_migration_guide`

Get the hooks migration guide covering removed component hooks, replacement APIs, and migration examples.

**Parameters:**

- None

**Returns:**
The official hooks migration documentation.

### Example Usage

```javascript
// Get the full migration workflow (default)
get_migration_workflow()

// Get the incremental migration workflow
get_migration_workflow({ migrationType: "incremental" })

// List all available component guides
list_component_migration_guides()

// Get migration guide for a single component
get_component_migration_guides({ components: ["button"] })

// Get migration guides for multiple components
get_component_migration_guides({ components: ["button", "card", "modal"] })

// Get styling and hooks migration guides
get_styling_migration_guide()
get_hooks_migration_guide()
```

## Development

Run these commands from `apps/migration-mcp`:

```bash
# Install dependencies
pnpm install

# Run locally
pnpm dev

# Deploy to staging
pnpm deploy:staging

# Deploy to production
pnpm deploy:production
```

## Architecture

This MCP server implements the Streamable HTTP transport:
- **POST requests**: Handle JSON-RPC messages (requests, notifications, responses)
- **GET requests**: Support SSE streams for server-to-client communication
- **No session management**: Stateless design for simplicity
- **No authentication**: Public service for migration instructions

## License

MIT

