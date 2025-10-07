# @heroui/native-mcp

> ⚠️ **WORK IN PROGRESS**: This MCP server is currently under development with placeholder implementations.

MCP (Model Context Protocol) server for HeroUI Native component documentation. Provides AI assistants like Claude with access to HeroUI Native React Native component documentation.

## Status

🚧 **Placeholder Implementation** - The basic structure is set up, but actual functionality needs to be implemented.

## Installation (When Ready)

```bash
npm install -g @heroui/native-mcp@latest
```

## Configuration

Add to your MCP client configuration (e.g., Claude Desktop):

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

## Available Tools

### `list_components`
List all available HeroUI Native components.

**Status**: Placeholder - Returns sample component names

### `get_component_info`
Get detailed information about a specific Native component.

**Parameters**:
- `component`: Component name (e.g., "Button")

**Status**: Placeholder - Returns sample component data

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run in development mode
pnpm dev:stdio

# Test with MCP Inspector
pnpm mcp:inspector
```

### Project Structure

```
packages/native-mcp/
├── src/
│   ├── stdio.ts                      # Main MCP server entry point
│   ├── tools/                        # MCP tool implementations
│   │   ├── index.ts                  # Tool initialization
│   │   ├── types.ts                  # Shared types
│   │   ├── list-components.ts        # List components tool
│   │   └── get-component-info.ts     # Get component info tool
│   └── lib/
│       └── extractors/               # Data extraction logic
│           ├── base.ts               # Base extractor class
│           └── components.ts         # Component extractor
├── scripts/
│   └── extract-components.ts         # Extraction script
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## TODO

### High Priority
- [ ] Implement actual Native component extraction from GitHub
- [ ] Parse Native component documentation
- [ ] Extract component props and types
- [ ] Add component code examples
- [ ] Set up R2 storage integration

### Medium Priority
- [ ] Add installation guide tool
- [ ] Add theme system support
- [ ] Add search functionality
- [ ] Implement caching strategy

### Low Priority
- [ ] Add component preview generation
- [ ] Add testing setup
- [ ] Add CI/CD pipeline
- [ ] Add analytics

## Architecture

Similar to `@heroui/react-mcp` with:
- **Base Extractor**: Shared extraction logic
- **Component Extractor**: Native-specific component extraction
- **MCP Tools**: Protocol interface for AI assistants
- **STDIO Server**: Communication layer

## Contributing

This is a placeholder setup. Contributions welcome once the implementation begins!

## License

MIT

## Related

- [@heroui/react-mcp](../react-mcp) - MCP server for HeroUI React components
- [HeroUI Native](https://github.com/heroui-inc/heroui) - The component library
