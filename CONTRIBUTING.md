# Contributing to HeroUI MCP Server

Thank you for your interest in contributing to the HeroUI MCP Server! This guide will help you get started with development.

## 📋 Prerequisites

- Node.js v22+ (see `.nvmrc`)
- pnpm package manager

## 🚀 Local Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/heroui-mcp.git
cd heroui-mcp

# Install dependencies
pnpm install

# Extract component data (recommended)
pnpm extract:heroui
pnpm extract:native

# Start MCP server (stdio transport)
pnpm mcp:stdio
```

## 📦 Building for NPM

```bash
# Build the project for npm distribution
pnpm build

# Test the built package locally
npm pack
# This creates a .tgz file you can install locally to test
```

## 🧪 Testing

### Using MCP Inspector

The MCP Inspector provides a web UI to test and debug the MCP server functionality:

```bash
# Start the MCP Inspector
pnpm mcp:inspector
```

This will:
1. Start the MCP server with stdio transport
2. Launch the Inspector UI in your browser (usually at http://localhost:6274)
3. Provide a session token for authentication

### Testing with Local Build

For development or testing with a local build in your IDE:

```json
{
  "mcpServers": {
    "heroui-local": {
      "command": "node",
      "args": ["/path/to/heroui-mcp/dist/stdio-npm.js"]
    }
  }
}
```

### Code Quality

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

## 📋 Available Scripts

### MCP Server Commands
- `pnpm mcp:stdio` - Run MCP server with stdio transport
- `pnpm mcp:inspector` - Run MCP server with Inspector UI for testing
- `pnpm extract:heroui` - Extract component data from HeroUI repository
- `pnpm extract:native` - Extract component data from HeroUI Native repository
- `pnpm build` - Build the project for npm distribution
- `pnpm clean` - Clean build artifacts

### Cloudflare Workers Commands
- `pnpm dev` - Start local development server (http://localhost:8787)
- `pnpm deploy` - Deploy to production environment
- `pnpm deploy:staging` - Deploy to staging environment
- `pnpm deploy:production` - Deploy to production environment

### Development Commands
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint code linting
- `pnpm format` - Format code with Prettier

## 🏗️ Project Structure

```
.
├── src/
│   ├── index.ts              # Hono server entry point (Cloudflare)
│   ├── stdio.ts              # MCP stdio server entry point (dev)
│   ├── stdio-npm.ts          # NPM distribution entry point
│   ├── http-server.ts        # HTTP server implementation
│   ├── types.ts              # TypeScript type definitions
│   └── services/
│       ├── mcp-server-core.ts        # Core MCP server logic
│       ├── mcp-server-core-npm.ts    # NPM version of core
│       ├── component-data-service.ts # Component data management
│       ├── component-data-service-npm.ts # NPM version
│       ├── data-store.ts             # Data storage (Cloudflare R2)
│       ├── data-store-file.ts        # File-based data store (NPM)
│       ├── base-extractor.ts         # Base extraction functionality
│       └── github-client.ts          # GitHub API client
├── scripts/
│   ├── extract-heroui.ts     # HeroUI data extraction script
│   └── extract-native.ts     # HeroUI Native extraction script
├── data/
│   ├── latest/               # Latest component data cache
│   │   ├── heroui.json       # HeroUI components data
│   │   └── native.json       # HeroUI Native components data
│   └── versions.json         # Version tracking
├── dist/                     # Build output (generated)
├── wrangler.toml             # Cloudflare Workers configuration
├── tsconfig.json             # TypeScript configuration
├── tsconfig.build.json       # TypeScript build configuration
└── package.json              # Dependencies and scripts
```

## 🔧 Environment Configuration

The project supports multiple environments with different configurations:

### Development
```bash
APP_ENV=development
LOG_LEVEL=debug
```

### Staging
```bash
APP_ENV=staging
LOG_LEVEL=info
```

### Production
```bash
APP_ENV=production
LOG_LEVEL=warn
```

Environment variables are configured in `wrangler.toml`.

## 🌐 Cloudflare Workers Deployment

The MCP server can also be deployed as a Cloudflare Worker for HTTP transport.

### API Endpoints

When deployed as a Cloudflare Worker:

- `GET /` - Service information and capabilities
- `GET /health` - Health check endpoint
- `POST /mcp` - MCP protocol endpoint for HTTP transport
- `OPTIONS /mcp` - CORS preflight support

### Deployment Steps

1. **Configure Wrangler** (if not already done):
   ```bash
   wrangler login
   ```

2. **Deploy to staging**:
   ```bash
   pnpm deploy:staging
   ```

3. **Deploy to production**:
   ```bash
   pnpm deploy:production
   ```

## 📊 Data Management

### Component Data Extraction

The server extracts component data from GitHub repositories:

- **HeroUI**: Main component library from `@heroui-org/heroui`
- **HeroUI Native**: React Native components from `@heroui-org/heroui-native`

Data is cached locally in the `data/` directory and versioned for consistency.

### Updating Component Data

To update the component data:

```bash
# Extract latest HeroUI components
pnpm extract:heroui

# Extract latest HeroUI Native components
pnpm extract:native
```

The extraction scripts will:
1. Fetch the latest component information from GitHub
2. Parse TypeScript definitions and props
3. Generate structured JSON data
4. Save to the `data/` directory

## 🛠️ Adding New Features

### Adding New Tools

To add a new tool to the MCP server:

1. Define the tool schema in `mcp-server-core.ts`:
```typescript
const myToolSchema = z.object({
  // Define your parameters
});
```

2. Implement the handler method:
```typescript
private async handleMyTool(args: {...}) {
  // Implementation
}
```

3. Register in `handleToolCall` method:
```typescript
if (name === "my_tool") {
  return this.handleMyTool(args);
}
```

4. Add to tool list in `handleListTools`:
```typescript
{
  name: "my_tool",
  description: "Description of your tool",
  inputSchema: { /* ... */ }
}
```

### Architecture Notes

The project has two parallel implementations:

1. **Cloudflare Workers version** (`src/index.ts`, `src/services/data-store.ts`)
   - Uses Cloudflare R2 for storage
   - Supports HTTP transport
   - Designed for edge deployment

2. **NPM distribution version** (`src/stdio-npm.ts`, `src/services/data-store-file.ts`)
   - Uses file-based storage
   - Supports stdio transport
   - Designed for local usage

Both versions share the same core functionality but use different storage backends.

## 🤝 Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- All tests pass (`pnpm typecheck && pnpm lint`)
- Code is formatted (`pnpm format`)
- Documentation is updated if needed
- Commit messages are clear and descriptive

## 📝 Code Style

- Use TypeScript for all new code
- Follow the existing code style (enforced by ESLint and Prettier)
- Add types for all function parameters and return values
- Document complex functions with JSDoc comments
- Keep functions small and focused

## 🐛 Reporting Issues

Please use the GitHub issue tracker to report bugs or request features. When reporting bugs, please include:

1. Version of the MCP server
2. IDE/editor you're using
3. Steps to reproduce the issue
4. Expected behavior
5. Actual behavior
6. Any error messages or logs

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.