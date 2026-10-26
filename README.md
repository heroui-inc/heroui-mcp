# HeroUI MCP Monorepo

Model Context Protocol (MCP) servers for the HeroUI design system. Access HeroUI component documentation directly in your AI assistant.

## MCPs

| MCP | Description | Docs |
| --- | --- | --- |
| `@heroui/react-mcp` | MCP server for web (`@heroui/react`) component docs, examples, and theme data | [README](apps/react-mcp/README.md) |
| `@heroui/native-mcp` | MCP server for React Native (`heroui-native`) component docs, examples, and theme data | [README](apps/native-mcp/README.md) |
| `@heroui/migration-mcp` | Remote MCP server for migrating from HeroUI v2 to v3 | [README](apps/migration-mcp/README.md) |

## Quick Start

### Installation

The React and Native stdio servers require Node.js 22.22.0 or later.

Choose your package based on your platform:

**For Web (React/Next.js):**
```bash
# Cursor, Claude Code, Windsurf, etc.
npx -y @heroui/react-mcp@latest
```

**For React Native:**
```bash
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

# Set up each app's environment variables (required for data extraction)
cp apps/react-mcp/.env.example apps/react-mcp/.env
cp apps/native-mcp/.env.example apps/native-mcp/.env
# Edit each app's .env with your Cloudflare R2 and GitHub credentials
# Use R2_BUCKET_NAME=heroui-mcp-data-dev to match the development API bindings
```

### Available Scripts

**Build Commands:**
```bash
pnpm build                    # Build all packages
pnpm build:react              # Build React MCP only
pnpm build:native             # Build Native MCP only
pnpm build:migration          # Type-check Migration MCP (no bundle output)
```

**Development Servers:**
```bash
pnpm dev                      # Start all dev servers (excludes mastra)
pnpm dev:react                # React MCP API server (http://localhost:8787)
pnpm dev:native               # Native MCP API server (http://localhost:8788)
pnpm dev:migration            # Migration MCP HTTP server (http://localhost:8790)
pnpm dev:mastra               # Mastra playground server (http://localhost:4111)
```

**Testing & Inspection:**
```bash
pnpm inspect:react            # Launch MCP Inspector for React
pnpm inspect:native           # Launch MCP Inspector for Native
pnpm inspect:migration        # Inspect the running local Migration MCP server
pnpm lint                     # Run linting
pnpm typecheck                # Run type checking
pnpm test                     # Run tests
```

**Data Extraction:**
```bash
pnpm extract:react            # Extract React component data
pnpm extract:native           # Extract Native component data
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
- 💬 [Discord Community](https://discord.gg/9b6yyZKmH4)
- 🐦 [X (Twitter)](https://x.com/hero_ui)
- 🐛 [GitHub Issues](https://github.com/heroui-inc/heroui-mcp/issues)
- 📧 [Email Support](mailto:support@heroui.com)

## License

[MIT](https://choosealicense.com/licenses/mit/)
