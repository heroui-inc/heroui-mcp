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

[![Add to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://link.heroui.com/mcp-native-cursor-install)

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

## IDE Rules Setup (Optional)

For better accuracy when working with HeroUI Native components, add the HeroUI Native rules file to your IDE:

### Cursor / Windsurf / Claude Code

Copy `heroui-native-rules.mdc` to your project's `.cursor/rules/` directory:

```bash
# Create rules directory if it doesn't exist
mkdir -p .cursor/rules

# Copy the HeroUI Native rules file
curl -o .cursor/rules/heroui-native-rules.mdc https://raw.githubusercontent.com/heroui-inc/heroui-mcp/main/heroui-native-rules.mdc
```

This provides your AI assistant with:
- Correct HeroUI Native component patterns
- MCP tool usage guidance
- Theme customization rules
- Best practices for React Native implementation

## Usage

Once configured, you can ask your AI assistant questions like:

- "Help me install HeroUI Native in my React Native app"
- "Show me all HeroUI Native components"
- "What props does the Button component have?"
- "Give me an example of using the Card component in React Native"
- "Check if I'm using the latest version of HeroUI Native"
- "Get the source code for the Button component"
- "Show me the CSS styles for Card"
- "What are the theme variables for dark mode?"
- "Explain HeroUI Native's color customization guide"

## Available Tools

The MCP server provides these tools to AI assistants:

### `installation`

Get complete installation guide for @heroui/native in your React Native project.

```javascript
// Parameters
{
  framework: "expo" | "bare",  // Required
  packageManager?: "npm" | "pnpm" | "yarn" | "bun"  // Optional, defaults to npm
}
```

### `list_components`

List all available HeroUI Native components (always returns latest version).

```javascript
// No parameters required
```

### `get_component_info`

Get complete information about HeroUI Native components including description, anatomy, props, and examples.

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

Get detailed props information for HeroUI Native components.

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

Get usage examples for HeroUI Native components.

```javascript
// Parameters
{
  components: ["Button"]  // Required - array of component names
}

// Examples
{
  components: ["Card", "Button"]  // Get examples for multiple components
}
```

### `get_component_source_code`

Get the React Native/TypeScript source code (.tsx) for HeroUI Native components.

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

### `get_component_source_styles`

Get the StyleSheet styles for HeroUI Native components.

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

### `get_theme_info`

Get HeroUI Native theme variables with an optimized structure that extracts common variables (base and calculated) shared between light and dark modes.

```javascript
// Parameters
{
  theme?: "default",   // Optional, defaults to "default"
  mode?: "light" | "dark" | "both", // Optional, defaults to "both"
  category?: "colors" | "typography" | "spacing" | "borders" | "shadows" | "animations" | "all" // Optional
}
```

### `get_docs`

Get HeroUI Native documentation content for guides, principles, and component docs.

```javascript
// Parameters
{
  path: string  // Required - documentation path (e.g., "/docs/introduction", "/docs/components/button")
}
```

## Development

### Local Testing with Mastra Playground

For local development and testing of MCP tools, you can use the built-in Mastra playground:

```bash
# Install dependencies
pnpm install

# Configure environment (one-time setup)
cd mastra
cp .env.example .env
# Edit .env and add your AI model API key

# Start the playground
cd ..
pnpm dev:mastra
```

Then open http://localhost:4111 in your browser to test MCP tools interactively with an AI agent.

See [mastra/README.md](./mastra/README.md) for detailed setup instructions.

## Troubleshooting

### MCP server not found

Ensure you have Node.js 18+ installed. The package will be automatically downloaded when using `npx`.

### Connection issues

If you're behind a corporate firewall, you may need to configure proxy settings or use a custom API URL.

### Need help?

Check our [troubleshooting guide](https://github.com/heroui-inc/heroui-mcp/blob/main/TROUBLESHOOTING.md) or ask in our [Discord community](https://discord.gg/heroui).

## Contributing

Contributions are always welcome!

See [CONTRIBUTING.md](https://github.com/heroui-inc/heroui-mcp/blob/main/CONTRIBUTING.md) for ways to get started.

Please adhere to this project's [CODE_OF_CONDUCT](https://github.com/heroui-inc/heroui-mcp/blob/main/CODE_OF_CONDUCT.md).

## Support

- [X](https://x.com/hero_ui)
- [GitHub Issues](https://github.com/heroui-inc/heroui-mcp/issues)
- [Discord Community](https://discord.gg/heroui)
- [Email Us](mailto:support@heroui.com)

## License

[MIT](https://choosealicense.com/licenses/mit/)
