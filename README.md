# HeroUI MCP Server

A comprehensive Model Context Protocol (MCP) server providing access to HeroUI component documentation, props, and examples. This server can be deployed to Cloudflare Workers or run locally via stdio transport.

## 🌟 Features

- **Component Documentation**: Access detailed component props and descriptions
- **Multiple Libraries**: Support for both HeroUI and HeroUI Native
- **Version Support**: Query specific versions or latest components
- **Dual Deployment**: Run as Cloudflare Worker (HTTP) or local stdio server
- **Auto-extraction**: Automated component data extraction from GitHub repositories
- **TypeScript**: Full TypeScript support with strict typing

## 🚀 Quick Start

### Prerequisites

- Node.js v22+ (see `.nvmrc`)
- pnpm package manager

### Installation

```bash
# Install dependencies
pnpm install

# Extract component data (recommended)
pnpm extract:heroui
pnpm extract:native

# Start MCP server (stdio transport)
pnpm mcp:stdio
```

## 📋 Available Scripts

### MCP Server Commands

- `pnpm mcp:stdio` - Run MCP server with stdio transport
- `pnpm extract:heroui` - Extract component data from HeroUI repository
- `pnpm extract:native` - Extract component data from HeroUI Native repository

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
│   ├── index.ts              # Hono server entry point
│   ├── stdio.ts              # MCP stdio server entry point
│   ├── http-server.ts        # HTTP server implementation
│   ├── types.ts              # TypeScript type definitions
│   └── services/
│       ├── mcp-server-core.ts        # Core MCP server logic
│       ├── component-data-service.ts # Component data management
│       ├── data-store.ts             # Data storage and caching
│       ├── base-extractor.ts         # Base extraction functionality
│       └── github-client.ts          # GitHub API client
├── scripts/
│   ├── extract-heroui.ts     # HeroUI data extraction script
│   └── extract-native.ts     # HeroUI Native extraction script
├── data/
│   ├── latest/               # Latest component data cache
│   └── versions.json         # Version tracking
├── wrangler.toml             # Cloudflare Workers configuration
├── tsconfig.json             # TypeScript configuration
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

## 🛠️ MCP Server Usage

### Available Tools

#### 1. `list_components`
Lists all available components in the specified library.

**Parameters:**
- `library` (required): `"heroui"` or `"native"`
- `version` (optional): Specific version (e.g., `"v3.0.0-alpha.3"`)

**Example:**
```json
{
  "name": "list_components",
  "arguments": {
    "library": "heroui",
    "version": "latest"
  }
}
```

#### 2. `get_component_props`
Retrieves detailed props information for a specific component.

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
    "component": "Button",
    "version": "latest"
  }
}
```

#### 3. `get_component_example`
Gets usage examples and import statements for a component.

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

## 🌐 API Endpoints (Cloudflare Workers)

When deployed as a Cloudflare Worker, the following HTTP endpoints are available:

- `GET /` - Service information and capabilities
- `GET /health` - Health check endpoint
- `POST /mcp` - MCP protocol endpoint for HTTP transport
- `OPTIONS /mcp` - CORS preflight support

### Example HTTP Request

```bash
curl -X POST https://your-worker.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_components",
      "arguments": {
        "library": "heroui"
      }
    },
    "id": 1
  }'
```

## 🚀 Deployment

### Cloudflare Workers Deployment

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

### Local Development

1. **Start the development server**:
   ```bash
   pnpm dev
   ```

2. **Test MCP functionality**:
   ```bash
   pnpm mcp:stdio
   ```

## 📊 Data Management

### Component Data Extraction

The server automatically extracts component data from GitHub repositories:

- **HeroUI**: Main component library
- **HeroUI Native**: React Native components

Data is cached locally in the `data/` directory and versioned for consistency.

### Cache Structure

```
data/
├── latest/
│   ├── heroui/
│   │   └── components.json
│   └── native/
│       └── components.json
└── versions.json
```

## 🔍 Development

### Adding New Tools

1. Define tool schema in `mcp-server-core.ts`
2. Implement handler method
3. Register in `handleToolCall` method
4. Add to tool list in `handleListTools`

### Testing

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

## 📜 License

MIT

See [LICENSE](LICENSE) file for details.
