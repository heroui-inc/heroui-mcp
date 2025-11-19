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

## Available Tools

### `get_migration_guide`

Get comprehensive migration guide for upgrading from HeroUI v2 to v3.

**Parameters:**
- `framework` (optional): Specify your framework (`next-app`, `next-pages`, `vite`, `astro`, `general`)

**Returns:**
Step-by-step migration instructions including:
- Breaking changes
- Dependency updates
- Code migration examples
- Framework-specific notes

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

