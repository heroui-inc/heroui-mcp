# HeroUI MCP Server

Access HeroUI component documentation directly in your AI assistant via Model Context Protocol (MCP).

## Features

- Complete component documentation for HeroUI and HeroUI Native
- Search and browse components
- Get props, types, and usage examples
- Always up-to-date with latest versions

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "heroui": {
      "command": "npx",
      "args": ["-y", "@heroui/mcp"]
    }
  }
}
```

### Claude Code

Add to your Claude Code configuration:

**macOS**: `~/Library/Application Support/Claude/claude_mcp_settings.json`
**Windows**: `%APPDATA%\Claude\claude_mcp_settings.json`

```json
{
  "mcpServers": {
    "heroui": {
      "command": "npx",
      "args": ["-y", "@heroui/mcp"]
    }
  }
}
```

### Cursor

Add to Cursor Settings → Features → MCP Servers:

```json
{
  "mcpServers": {
    "heroui": {
      "command": "npx",
      "args": ["-y", "@heroui/mcp"]
    }
  }
}
```

### Windsurf

Add to Windsurf configuration → MCP Servers:

```json
{
  "mcpServers": {
    "heroui": {
      "command": "npx",
      "args": ["-y", "@heroui/mcp"]
    }
  }
}
```

### VS Code (with MCP extension)

Add to your VS Code settings:

```json
{
  "mcp.servers": {
    "heroui": {
      "command": "npx",
      "args": ["-y", "@heroui/mcp"]
    }
  }
}
```

## Usage

Once configured, you can ask your AI assistant questions like:

- "Show me all HeroUI components"
- "What props does the Button component have?"
- "Give me an example of using the Card component"
- "List all components in HeroUI Native"
- "Check if I'm using the latest version of HeroUI"

## Available Tools

The MCP server provides these tools to AI assistants:

### `list_components`

List all available components in a library.

```javascript
// Parameters
{
  library: "heroui" | "native",  // Required
  version?: "v3.0.0"             // Optional, defaults to latest
}
```

### `get_component_props`

Get detailed props information for a specific component.

```javascript
// Parameters
{
  library: "heroui" | "native",  // Required
  component: "Button",           // Required
  version?: "v3.0.0"            // Optional
}
```

### `get_component_example`

Get usage examples for a specific component.

```javascript
// Parameters
{
  library: "heroui" | "native",  // Required
  component: "Button",           // Required
  version?: "v3.0.0"            // Optional
}
```

### `check_version`

Check if you're using the latest version.

```javascript
// Parameters
{
  package: "heroui" | "native" | "mcp"; // Required
}
```

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/heroui-inc/heroui-mcp
   cd heroui-mcp
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start development:

   ```bash
   # Start API server
   pnpm dev:api

   # In another terminal, test STDIO client
   pnpm dev:stdio
   ```

### Testing

```bash
# Test API endpoints
pnpm test:api

# Test with MCP Inspector
pnpm mcp:inspector
```

### Building

```bash
# Build STDIO client for NPM
pnpm build

# Deploy API to Cloudflare
pnpm deploy:api:production
```

## Architecture

The HeroUI MCP uses a simple architecture:

1. **STDIO Client** (`@heroui/mcp`) - Runs locally, handles MCP protocol
2. **REST API** (Cloudflare Worker) - Serves component data
3. **R2 Storage** - Stores component documentation

```
AI Assistant → STDIO Client → REST API → R2 Storage
```

## API Endpoints

The REST API is publicly available at `https://mcp-api.heroui.com`:

- `GET /api/components/heroui` - List HeroUI components
- `GET /api/components/native` - List HeroUI Native components
- `GET /api/components/heroui/Button` - Get Button component details
- `GET /api/components/heroui/Button/props` - Get Button props
- `GET /api/components/heroui/Button/example` - Get Button examples
- `GET /api/versions` - Get version information

## Environment Variables

### Optional Configuration

- `HEROUI_API_URL` - Custom API URL (default: `https://mcp-api.heroui.com`)

Example:

```json
{
  "mcpServers": {
    "heroui": {
      "command": "npx",
      "args": ["-y", "@heroui/mcp"],
      "env": {
        "HEROUI_API_URL": "http://localhost:8787"
      }
    }
  }
}
```

## Troubleshooting

### MCP server not found

The package will be automatically downloaded when using `npx`. To verify it's available:

```bash
npx @heroui/mcp --version
```

### Connection issues

Test the API is accessible:

```bash
curl https://mcp-api.heroui.com/health
```

### Debug mode

Run with debug output:

```bash
DEBUG=* npx @heroui/mcp
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Support

- [GitHub Issues](https://github.com/heroui-inc/heroui-mcp/issues)
- [Discord Community](https://discord.gg/heroui)
- Email: support@heroui.com

## License

MIT © HeroUI Inc.
