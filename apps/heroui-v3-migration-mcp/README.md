# HeroUI v3 Migration MCP

MCP server providing migration instructions for upgrading from HeroUI v2 to v3.

## Features

- **Streamable HTTP Transport**: Uses the Streamable HTTP transport as specified in the MCP specification
- **Framework-Specific Guides**: Provides migration instructions tailored to your framework
- **Step-by-Step Instructions**: Comprehensive migration guide with code examples
- **Cloudflare Workers**: Deployed on Cloudflare Workers for global availability

## Usage

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "heroui-v3-migration": {
      "url": "https://heroui-v3-migration-mcp.heroui.com"
    }
  }
}
```

> **⚠️ Important:** Do not use the Migration MCP alongside the `heroui-react` MCP server. Having both configured simultaneously may confuse AI assistants about which set of component documentation to use. For migration purposes, connect only to the Migration MCP. Once migration is complete, you can switch to using the `heroui-react` MCP for v3 component documentation.

## Available Tools

### `get_migration_guide`

Get the comprehensive main migration guide for upgrading from HeroUI v2 to v3.

**Parameters:**
- None

**Returns:**
The complete migration guide including:
- Overview of major changes
- Step-by-step migration instructions
- Dependency updates (React 19+, Tailwind CSS v4)
- Configuration changes (removing Provider, updating CSS imports)
- Component migration reference table
- Migration checklist

### `list_migration_guides`

List all available component-specific migration guides.

**Parameters:**
- None

**Returns:**
A list of all component names that have migration guides available (e.g., `button`, `card`, `modal`, `input`, etc.)

### `get_component_guides`

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

**Example Usage:**
```javascript
// Get main migration guide
get_migration_guide()

// List all available component guides
list_migration_guides()

// Get migration guide for a single component
get_component_guides({ components: ["button"] })

// Get migration guides for multiple components
get_component_guides({ components: ["button", "card", "modal"] })
```

## Development

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

