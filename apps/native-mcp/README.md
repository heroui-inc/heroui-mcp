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

- "Help me install HeroUI Native in my React Native app"
- "Show me all HeroUI Native components"
- "What props does the Button component have?"
- "Give me an example of using the Card component in React Native"
- "What are the theme variables for dark mode?"
- "Explain HeroUI Native's color customization guide"

## Available Tools

The MCP server provides these tools to AI assistants:

### `installation`

Get comprehensive installation guide for @heroui/native in your React Native project

```javascript
// No parameters required
```

### `list_components`

List all available HeroUI Native components (always returns latest version).

```javascript
// No parameters required
```

### `get_component_info`

Get complete information about HeroUI Native components including description, anatomy, props, subcomponents, and available examples.

```javascript
// Parameters
{
  components: ["Button"]  // Required - array of component names
}

// Examples
{
  components: ["Button"]  // Single component
}
{
  components: ["Button", "Card", "TextField"]  // Multiple components
}
```

### `get_component_props`

Get detailed prop definitions for HeroUI Native components.

```javascript
// Parameters
{
  components: ["Button"]  // Required - array of component names
}

// Examples
{
  components: ["Button", "Card"]  // Get props for multiple components
}
```

### `get_component_examples`

Get complete, working code examples for HeroUI Native components.

**Note:** Example files use kebab-case naming (e.g., "dialog", "dialog-native-modal", "drop-shadow-view").

```javascript
// Parameters
{
  examples: ["button"]  // Required - array of example names (kebab-case, without .tsx extension)
}

// Examples
{
  examples: ["dialog", "dialog-native-modal"]  // Get examples for specific components
}
```

### `get_theme_info`

Get HeroUI Native theme colors and design tokens.

**Note:** Custom themes (if available) are example implementations for reference only and are not included in the package.

```javascript
// Parameters
{
  theme?: "default",   // Optional, defaults to "default"
  mode?: "light" | "dark" | "both"  // Optional, defaults to "both"
}

// Examples
{
  theme: "default",
  mode: "light"  // Get only light mode colors
}
{
  theme: "default",
  mode: "both"  // Get both light and dark mode colors (default)
}
```

### `get_docs`

Get HeroUI Native documentation content for guides and component docs.

```javascript
// Parameters
{
  path: string  // Required - exact documentation path
}

// Examples
{
  path: "/docs/core/provider"  // Core documentation
}
{
  path: "/docs/components/button"  // Component documentation
}
{
  path: "/docs/changelog"  // Changelog
}
```

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
- 💬 [Discord Community](https://discord.gg/heroui)
- 🐦 [X (Twitter)](https://x.com/hero_ui)
- 🐛 [GitHub Issues](https://github.com/heroui-inc/heroui-mcp/issues)
- 📧 [Email Support](mailto:support@heroui.com)

## License

[MIT](https://choosealicense.com/licenses/mit/)
