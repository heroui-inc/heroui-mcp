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

- "Show me all HeroUI components"
- "What props does the Button component have?"
- "Give me an example of using the Card component"
- "List all components in HeroUI Native"
- "Check if I'm using the latest version of HeroUI"
- "Get the source code for the Button component"
- "Show me the CSS styles for Card"
- "What are the theme variables for dark mode?"
- "Explain HeroUI's color customization guide"

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

### `get_component_info`

Get complete information about a specific component including description, anatomy, props, and examples.

```javascript
// Parameters
{
  library: "heroui" | "native",  // Required
  component: "Button",           // Required
  version?: "v3.0.0"            // Optional
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

### `get_component_examples`

Get usage examples for a specific component.

```javascript
// Parameters
{
  library: "heroui" | "native",  // Required
  component: "Button",           // Required
  version?: "v3.0.0"            // Optional
}
```

### `get_component_source`

Get the source code (React/TypeScript) or CSS styles for a component.

```javascript
// Parameters
{
  library: "heroui" | "native",  // Required
  component: "Button",           // Required
  type: "source" | "styles" | "both", // Required
  version?: "v3.0.0"            // Optional
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

### `get_design_guide`

Get HeroUI design guides and documentation for themes, colors, animations, and best practices.

```javascript
// Parameters
{
  guide: "color-theory" | "animations" | "dark-mode" | "custom-themes" |
         "color-customization" | "responsive-design" | "accessibility", // Required
  section?: "intro" | "examples" | "api"  // Optional
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
