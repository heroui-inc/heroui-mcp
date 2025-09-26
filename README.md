# HeroUI MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with access to HeroUI v3 and HeroUI Native component documentation, props, and usage examples.

## Features

- Component documentation with detailed props and descriptions
- Support for both HeroUI and HeroUI Native libraries
- Version-specific component queries
- Full TypeScript support with type definitions
- Integration with popular AI-powered IDEs and editors

## Installation

```bash
# Install globally from npm
npm install -g @heroui/mcp

# Or use directly with npx (no installation needed)
npx @heroui/mcp
```

## IDE Setup

The MCP server supports [stdio transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#stdio) and is published at `@heroui/mcp`.

### Cursor

Add to `.cursor/mcp.json` in your project root:

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

> Restart Cursor if it doesn't automatically detect the changes.

### Claude Code

Run this command in your terminal:

```bash
claude mcp add heroui -- npx -y @heroui/mcp
```

Then start a Claude Code session with `claude`.

### Windsurf

1. Go to Settings > Windsurf Settings > Cascade
2. Click "Manage MCPs" > "View raw config"
3. Add the configuration:

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

### Visual Studio Code

> Requires [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) and [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) extensions.

Add to `.vscode/mcp.json` in your project root:

```json
{
  "servers": {
    "heroui": {
      "command": "npx",
      "args": ["-y", "@heroui/mcp"]
    }
  }
}
```

### Zed

Add to your Zed settings.json:

```json
{
  "context_servers": {
    "heroui": {
      "source": "custom",
      "command": "npx",
      "args": ["-y", "@heroui/mcp"]
    }
  }
}
```

### Custom MCP Client

For any MCP-compatible client:

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

## Available Tools

### check_version

Checks if you're using the latest version of HeroUI packages or the MCP server itself.

**Parameters:**
- `package` (required): `"heroui"`, `"native"`, or `"mcp"`
- `currentVersion` (optional): Your current version (e.g., `"3.0.0-alpha.31"`). If not provided, suggests installation.

**Example:**
```json
{
  "name": "check_version",
  "arguments": {
    "package": "heroui",
    "currentVersion": "3.0.0-alpha.31"
  }
}
```

**Response (up to date):**
```markdown
# HeroUI Version Check

**Current Version:** 3.0.0-alpha.31
**Latest Version:** 3.0.0-alpha.31
**Status:** ✅ Up to date

You are using the latest v3 version of HeroUI (prerelease).

## Recent Versions
- 3.0.0-alpha.31
- 3.0.0-alpha.30
- 3.0.0-alpha.29
```

**Response (v2 user - error):**
```markdown
# ❌ Error: Incompatible HeroUI Version

**This MCP server is only compatible with @heroui/react v3+**

You are currently using v2.x, which is not supported.

## Required Action:

1. Upgrade to HeroUI v3 (currently in alpha status):
   ```bash
   npm install @heroui/react@3.0.0-alpha.31
   ```

2. Update your imports and components to v3 syntax

⚠️ **Note:** v3 is currently in alpha and may have breaking changes
```

### list_components

Lists all available components in the specified library.

**Parameters:**
- `library` (required): `"heroui"` or `"native"`
- `version` (optional): Specific version (e.g., `"v3.0.0-alpha.3"`)

**Example:**
```json
{
  "name": "list_components",
  "arguments": {
    "library": "heroui"
  }
}
```

**Response:**
```
Available Components in HeroUI (latest)

- Accordion
- Avatar
- Badge
- Button
- Card
- Checkbox
- Chip
- CircularProgress
- ...

Total: 50+ components
```

### get_component_props

Gets detailed props information for a specific component.

**Parameters:**
- `library` (required): `"heroui"` or `"native"`
- `component` (required): Component name (e.g., `"Button"`, `"Card"`)
- `version` (optional): Specific version

**Example:**
```json
{
  "name": "get_component_props",
  "arguments": {
    "library": "heroui",
    "component": "Button"
  }
}
```

**Response:**
```markdown
Button Component Props - HeroUI (latest)

A button component for user interactions.

Props

- **children**: `ReactNode` - Button content
- **variant**: `"solid" | "bordered" | "ghost" | "flat"` - Button style variant
- **color**: `"default" | "primary" | "secondary" | "success" | "warning" | "danger"` - Button color
- **size**: `"sm" | "md" | "lg"` - Button size
- **isDisabled**: `boolean` - Whether the button is disabled
- **isLoading**: `boolean` - Shows loading state
- **startContent**: `ReactNode` - Content before children
- **endContent**: `ReactNode` - Content after children
- **onPress**: `(e: PressEvent) => void` - Click handler
...

Import

import {Button} from "@heroui/react";
```

### get_component_example

Gets usage examples for a component.

**Parameters:**
- `library` (required): `"heroui"` or `"native"`
- `component` (required): Component name
- `version` (optional): Specific version

**Example:**
```json
{
  "name": "get_component_example",
  "arguments": {
    "library": "heroui",
    "component": "Button"
  }
}
```

**Response:**
```tsx
// Button Component Example - HeroUI (latest)

import {Button} from "@heroui/react";

export default function Example() {
  return (
    <Button
      color="primary"
      variant="solid"
      size="md"
      onPress={() => console.log("Button clicked")}
    >
      Click me
    </Button>
  );
}
```

## Usage Examples

### With AI Assistants

Once configured, you can ask your AI assistant questions like:

- "Am I using the latest version of HeroUI?"
- "Check if my HeroUI version is up to date"
- "Show me all HeroUI components"
- "What props does the Button component have?"
- "Give me an example of using the Card component"
- "List all components in HeroUI Native"
- "Show me the Modal component props from version v3.0.0-alpha.3"

The AI assistant will use the MCP server to fetch accurate, up-to-date information about HeroUI components and version compatibility.

> **Important:** This MCP server is only compatible with HeroUI v3+. If you're using v2, the version check will guide you through upgrading.

### Example Workflow

1. **Check your HeroUI version:**
   > "Am I using the latest version of HeroUI?"

   The assistant will use `check_version` to verify your version and suggest updates if needed.

2. **Ask about available components:**
   > "What components are available in HeroUI?"

   The assistant will use `list_components` to show all available components.

3. **Get component details:**
   > "Show me the props for the Select component"

   The assistant will use `get_component_props` to provide detailed prop information.

4. **Get usage examples:**
   > "How do I use the DatePicker component?"

   The assistant will use `get_component_example` to show implementation examples.

## Testing

To test the MCP server directly, you can use the MCP Inspector:

```bash
# Clone the repository
git clone https://github.com/heroui-inc/heroui-mcp.git
cd heroui-mcp

# Install and run the inspector
pnpm install
pnpm mcp:inspector
```

This opens a web UI where you can test all available tools interactively.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for development setup and guidelines.

## Support

- [Report Issues](https://github.com/heroui-inc/heroui-mcp/issues)
- [HeroUI Documentation](https://heroui.com)
- [MCP Specification](https://modelcontextprotocol.io)

## License

MIT