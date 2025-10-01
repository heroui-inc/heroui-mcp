# HeroUI React MCP Server

Access HeroUI component documentation directly in your AI assistant via Model Context Protocol (MCP).

> **Note:** Currently supports **@heroui/react v3** only. Support for **heroui-native** coming soon.

## Features

- Complete component documentation for HeroUI React v3
- Search and browse components
- Get props, types, and usage examples
- Always up-to-date with latest versions

## Configuration

### Cursor

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-light.svg)](cursor://anysphere.cursor-deeplink/mcp/install?name=heroui-react&config=eyJjb21tYW5kIjoibnB4IC15IEBoZXJvdWkvcmVhY3QtbWNwQGxhdGVzdCJ9)

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

## IDE Rules Setup (Optional)

For better accuracy when working with HeroUI components, add the HeroUI rules file to your IDE:

### Cursor / Windsurf / Claude Code

Copy `heroui-web-rules.mdc` to your project's `.cursor/rules/` directory:

```bash
# Create rules directory if it doesn't exist
mkdir -p .cursor/rules

# Copy the HeroUI rules file
curl -o .cursor/rules/heroui-web-rules.mdc https://raw.githubusercontent.com/heroui-inc/heroui-mcp/main/heroui-web-rules.mdc
```

This provides your AI assistant with:
- Correct HeroUI v3 component patterns
- MCP tool usage guidance
- Theme customization rules
- Best practices for implementation

## Usage

Once configured, you can ask your AI assistant questions like:

- "Help me install HeroUI v3 in my Next.js app"
- "Show me all HeroUI components"
- "What props does the Button component have?"
- "Give me an example of using the Card component"
- "Check if I'm using the latest version of HeroUI"
- "Get the source code for the Button component"
- "Show me the CSS styles for Card"
- "What are the theme variables for dark mode?"
- "Explain HeroUI's color customization guide"

## Available Tools

The MCP server provides these tools to AI assistants:

### `installation`

Get complete installation guide for @heroui/react v3 in your React/Next.js project.

```javascript
// Parameters
{
  framework: "next-app" | "next-pages" | "vite" | "general",  // Required
  packageManager?: "npm" | "pnpm" | "yarn" | "bun"            // Optional, defaults to npm
}
```

### `list_components`

List all available HeroUI components (always returns latest version).

```javascript
// No parameters required
```

### `get_component_info`

Get complete information about HeroUI components including description, anatomy, props, and examples.

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

Get detailed props information for HeroUI components.

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

Get usage examples for HeroUI components.

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

Get the React/TypeScript source code (.tsx) for HeroUI components.

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

Get the CSS styles (.css) for HeroUI components.

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

Get HeroUI theme variables with an optimized structure that extracts common variables (base and calculated) shared between light and dark modes.

```javascript
// Parameters
{
  theme?: "default",   // Optional, defaults to "default"
  mode?: "light" | "dark" | "both", // Optional, defaults to "both"
  category?: "colors" | "typography" | "spacing" | "borders" | "shadows" | "animations" | "all" // Optional
}
```

### `get_docs`

Get HeroUI v3 documentation content for guides, principles, and component docs.

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
