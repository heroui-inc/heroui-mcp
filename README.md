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

# Set up environment variables (required for data extraction)
cp .env.example .env
# Edit .env with your Cloudflare R2 and GitHub credentials
```

### Available Scripts

**Build Commands:**
```bash
pnpm build                    # Build all packages
pnpm build:react              # Build React MCP only
pnpm build:native             # Build Native MCP only
```

**Development Servers:**
```bash
pnpm dev                      # Start all dev servers
pnpm dev:react                # React MCP API server (http://localhost:8787)
pnpm dev:native               # Native MCP API server (http://localhost:8788)
pnpm dev:react:stdio          # React MCP stdio transport
pnpm dev:native:stdio         # Native MCP stdio transport
```

**Testing & Inspection:**
```bash
pnpm inspect:react            # Launch MCP Inspector for React
pnpm inspect:native           # Launch MCP Inspector for Native
pnpm lint                     # Run linting
pnpm typecheck                # Run type checking
pnpm test                     # Run tests
```

**Data Extraction:**
```bash
pnpm extract:react:dev        # Extract React component data
pnpm extract:native:dev       # Extract Native component data
```

**Code Quality:**
```bash
pnpm format                   # Format code with Prettier
pnpm clean                    # Clean build artifacts
pnpm release:check            # Pre-release validation
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development setup and architecture information.

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
