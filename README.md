# HeroUI MCP Monorepo

Model Context Protocol (MCP) servers for the HeroUI design system. Access HeroUI component documentation directly in your AI assistant.

## Packages

| Package | Description | Status | Docs |
| --- | --- | --- | --- |
| `@heroui/react-mcp` | MCP server for web (`@heroui/react`) component docs, examples, and theme data | ✅ Available on npm | [README](packages/react-mcp/README.md) |
| `@heroui/native-mcp` | MCP server for React Native (`@heroui/native`) component docs and tooling | 🚧 In development | [README](packages/native-mcp/README.md) |

## Quick Start

### Installation

Choose your package based on your platform:

**For Web (React/Next.js):**
```bash
# Cursor, Claude Code, Windsurf, etc.
npx -y @heroui/react-mcp@latest
```

**For React Native:**
```bash
# Coming soon
npx -y @heroui/native-mcp@latest
```

See package-specific READMEs for detailed installation instructions for your IDE.

## What's Included

- 🔍 **Component Discovery** - Search and browse all HeroUI components
- 📚 **Complete Documentation** - Props, types, and usage examples
- 🎨 **Theme Information** - Access theme variables and design tokens
- 💻 **Source Code** - View component implementation and styles
- 🔄 **Always Up-to-Date** - Latest component data fetched automatically

## Local Development

```bash
# Clone and install
git clone https://github.com/heroui-inc/heroui-mcp.git
cd heroui-mcp
pnpm install

# Build packages
pnpm build --filter=@heroui/react-mcp
pnpm build --filter=@heroui/native-mcp

# Run tests
pnpm lint
pnpm typecheck
```

Builds, linting, and other scripts run through Turbo via the workspace root. Each package also exposes its own scripts—see the package-level READMEs for details.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, architecture details, and contribution guidelines.

Please adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions.

## Support

- 📖 [Documentation](https://heroui.com)
- 💬 [Discord Community](https://discord.gg/heroui)
- 🐦 [X (Twitter)](https://x.com/hero_ui)
- 🐛 [GitHub Issues](https://github.com/heroui-inc/heroui-mcp/issues)
- 📧 [Email Support](mailto:support@heroui.com)

## License

[MIT](LICENSE)
