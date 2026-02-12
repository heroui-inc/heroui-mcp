# HeroUI React MCP Server

Access HeroUI component documentation directly in your AI assistant via Model Context Protocol (MCP).

> **Note:** Currently supports **@heroui/react v3** only. For **@heroui/native** (React Native components), use [@heroui/native-mcp](../native-mcp).

## Features

- Complete component documentation for HeroUI React v3
- Search and browse components
- Get props, types, and usage examples
- Always up-to-date with latest versions

## Configuration

### Cursor

[![Add to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://link.heroui.com/mcp-cursor-install)

Or add manually to Cursor Settings → Features → MCP Servers:

```json
{
  "mcpServers": {
    "heroui": {
      "command": "npx",
      "args": ["-y", "@heroui/react-mcp@latest"]
    }
  }
}
```

### Claude Code

**Quick Install (CLI)**:

```bash
claude mcp add heroui-react -- npx -y @heroui/react-mcp@latest
```

Or manually add to your Claude Code configuration:

**macOS**: `~/Library/Application Support/Claude/claude_mcp_settings.json`
**Windows**: `%APPDATA%\Claude\claude_mcp_settings.json`

```json
{
  "mcpServers": {
    "heroui": {
      "command": "npx",
      "args": ["-y", "@heroui/react-mcp@latest"]
    }
  }
}
```

### Codex

**Quick Install (CLI)**:

```bash
codex mcp add heroui-react -- npx -y @heroui/react-mcp@latest
```

Or manually add to your Codex configuration file:

**macOS/Linux**: `~/.codex/config.toml`
**Windows**: `%USERPROFILE%\.codex\config.toml`

```toml
[mcp_servers.heroui-react]
command = "npx"
args = ["-y", "@heroui/react-mcp@latest"]
```

For more configuration options, see the [Codex MCP documentation](https://developers.openai.com/codex/mcp/).

### Windsurf

Add to Windsurf configuration → MCP Servers:

```json
{
  "mcpServers": {
    "heroui": {
      "command": "npx",
      "args": ["-y", "@heroui/react-mcp@latest"]
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
      "args": ["-y", "@heroui/react-mcp@latest"]
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
      "args": ["-y", "@heroui/react-mcp@latest"]
    }
  }
}
```

## Usage

Once configured, you can ask your AI assistant questions like:

- "Show me the HeroUI v3 installation guide"
- "Show me all HeroUI v3 components"
- "Get the complete documentation for the Button component"
- "Show me examples of using the Card component"
- "Get the source code for the Button component"
- "Show me the CSS styles for Card"
- "What are the theme variables?"
- "Explain HeroUI's theming guide"

## Available Tools

The MCP server provides these tools to AI assistants:

### `list_components`

List all available HeroUI v3 components (always returns latest version).

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

### `get_component_source_code`

Get the React/TypeScript source code (.tsx) for HeroUI components. Returns the internal implementation for learning purposes or debugging.

```javascript
// Parameters
{
  components: ["Button"]  // Required - array of component names
}

// Examples
{
  components: ["Button", "TextField"]  // Get source for multiple components
}
```

**Note:** This shows internal implementation - use `get_component_docs` for usage examples.

### `get_component_source_styles`

Get the CSS styles (.css) for HeroUI components. Returns the complete CSS implementation including all variants and states.

```javascript
// Parameters
{
  components: ["Button"]  // Required - array of component names
}

// Examples
{
  components: ["Button", "Card"]  // Get styles for multiple components
}
```

**Note:** These are framework-agnostic styles from @heroui/styles package. For React components, prefer using @heroui/react.

### `get_docs`

Get HeroUI v3 React documentation content for guides, principles, and release notes (NOT component docs). Fetches official documentation from v3.heroui.com.

```javascript
// Parameters
{
  path: string  // Required - exact documentation path
}

// Examples
{
  path: "/docs/react/getting-started/theming"  // Get theming guide
}
{
  path: "/docs/react/releases/v3-0-0-beta-3"  // Release notes
}
```

**Note:** For component documentation, use `get_component_docs` instead. All React documentation paths start with `/docs/react/` prefix.

### `get_theme_variables`

Get HeroUI v3 default theme variables and design tokens (actual variable values). Includes both light and dark mode variables for all categories.

**Note:** For theme documentation and guides, use `get_docs({ path: "/docs/react/getting-started/theming" })` instead.

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
