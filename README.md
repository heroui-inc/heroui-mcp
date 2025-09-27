# HeroUI MCP Server

Access HeroUI component documentation directly in your AI assistant via Model Context Protocol (MCP).

## Features

- Complete component documentation for HeroUI and HeroUI Native
- Search and browse components
- Get props, types, and usage examples
- Always up-to-date with latest versions

## Configuration

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


## Troubleshooting

### MCP server not found

Ensure you have Node.js 18+ installed. The package will be automatically downloaded when using `npx`.

### Connection issues

If you're behind a corporate firewall, you may need to configure proxy settings or use a custom API URL.

### Need help?

Check our [troubleshooting guide](https://github.com/heroui-inc/heroui-mcp/wiki/Troubleshooting) or ask in our [Discord community](https://discord.gg/heroui).

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Support

- [GitHub Issues](https://github.com/heroui-inc/heroui-mcp/issues)
- [Discord Community](https://discord.gg/heroui)
- Email: support@heroui.com

## License

MIT © HeroUI Inc.
