# HeroUI Native MCP Server

Access HeroUI Native component documentation directly in your AI assistant via Model Context Protocol (MCP).

> **Note:** Currently supports **@heroui/native** (React Native components). For **@heroui/react** (web components), use [@heroui/react-mcp](../react-mcp).

## Features

- Complete component documentation for HeroUI Native
- Search and browse React Native components
- Get props, types, and usage examples
- Always up-to-date with latest versions

## Configuration

### Cursor

[![Add to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://link.heroui.com/native-mcp-cursor-install)

Or add manually to Cursor Settings → Features → MCP Servers:

```json
{
  "mcpServers": {
    "heroui-native": {
      "command": "npx",
      "args": ["-y", "@heroui/native-mcp@latest"]
    }
  }
}
```

### Claude Code

**Quick Install (CLI)**:
```bash
claude mcp add heroui-native -- npx -y @heroui/native-mcp@latest
```

Or manually add to your Claude Code configuration:

**macOS**: `~/Library/Application Support/Claude/claude_mcp_settings.json`
**Windows**: `%APPDATA%\Claude\claude_mcp_settings.json`

```json
{
  "mcpServers": {
    "heroui-native": {
      "command": "npx",
      "args": ["-y", "@heroui/native-mcp@latest"]
    }
  }
}
```

### Codex

**Quick Install (CLI)**:
```bash
codex mcp add heroui-native -- npx -y @heroui/native-mcp@latest
```

Or manually add to your Codex configuration file:

**macOS/Linux**: `~/.codex/config.toml`
**Windows**: `%USERPROFILE%\.codex\config.toml`

```toml
[mcp_servers.heroui-native]
command = "npx"
args = ["-y", "@heroui/native-mcp@latest"]
```

For more configuration options, see the [Codex MCP documentation](https://developers.openai.com/codex/mcp/).

### Windsurf

Add to Windsurf configuration → MCP Servers:

```json
{
  "mcpServers": {
    "heroui-native": {
      "command": "npx",
      "args": ["-y", "@heroui/native-mcp@latest"]
    }
  }
}
```

### VS Code (with MCP extension)

Add to your VS Code settings:

```json
{
  "mcp.servers": {
    "heroui-native": {
      "command": "npx",
      "args": ["-y", "@heroui/native-mcp@latest"]
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
    "heroui-native": {
      "command": "npx",
      "args": ["-y", "@heroui/native-mcp@latest"]
    }
  }
}
```

## Usage

Once configured, you can ask your AI assistant questions like:

- "Show me the HeroUI Native installation guide"
- "Show me all HeroUI Native components"
- "Get the complete documentation for the Button component"
- "Show me examples of using the Card component in React Native"
- "What are the theme variables?"
- "Explain HeroUI Native's theming guide"

## Available Tools

The MCP server provides these tools to AI assistants:

### `list_components`

List all available HeroUI Native components (always returns latest version).

```javascript
// No parameters required
```

### `get_component_docs`

Get complete component documentation (including examples, props, usage) directly from v3.heroui.com. This tool consolidates component information, props, and examples into a single call.

```javascript
// Parameters
{
  components: ["Button"]  // Required - array of component names (case-sensitive)
}

// Examples
{
  components: ["Button"]  // Single component
}
{
  components: ["Button", "Card", "TextField"]  // Multiple components
}
```

**Note:** Always use `list_components` first to verify component names before calling this tool.

### `get_docs`

Get HeroUI Native documentation content for guides, principles, and release notes (NOT component docs). Fetches official documentation from v3.heroui.com.

```javascript
// Parameters
{
  path: string  // Required - exact documentation path
}

// Examples
{
  path: "/docs/native/getting-started/theming"  // Get theming guide
}
{
  path: "/docs/native/getting-started/quick-start"  // Get installation guide
}
```

**Note:** For component documentation, use `get_component_docs` instead. All Native documentation paths start with `/docs/native/` prefix.

### `get_theme_variables`

Get HeroUI Native default theme variables and design tokens (actual variable values). Includes both light and dark mode variables for all categories.

**Note:** For theme documentation and guides, use `get_docs({ path: "/docs/native/getting-started/theming" })` instead.

## Troubleshooting

### MCP server not found

Ensure you have Node.js 22+ installed. The package will be automatically downloaded when using `npx`.

### Connection issues

If you're behind a corporate firewall, you may need to configure proxy settings or use a custom API URL.

## Contributing

Contributions are always welcome! See [../../CONTRIBUTING.md](../../CONTRIBUTING.md) for ways to get started.

Please adhere to our [Code of Conduct](../../CODE_OF_CONDUCT.md).

## Support

- 📖 [Documentation](https://github.com/heroui-inc/heroui-mcp)
- 💬 [Discord Community](https://discord.gg/9b6yyZKmH4)
- 🐦 [X (Twitter)](https://x.com/hero_ui)
- 🐛 [GitHub Issues](https://github.com/heroui-inc/heroui-mcp/issues)
- 📧 [Email Support](mailto:support@heroui.com)

## License

[MIT](https://choosealicense.com/licenses/mit/)
