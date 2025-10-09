# Contributing to HeroUI MCP

Thank you for your interest in contributing to the HeroUI MCP project! This monorepo hosts both `@heroui/react-mcp` and `@heroui/native-mcp` servers. This guide will help you get started with development.

## 📋 Prerequisites

- Node.js v22+ (see `.nvmrc`)
- pnpm package manager

## 🚀 Local Development Setup

```bash
# Clone the repository
git clone https://github.com/heroui-inc/heroui-mcp.git
cd heroui-mcp

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Extract component data to local development R2 bucket
pnpm extract:react:dev        # Extract React MCP data
pnpm extract:native:dev       # Extract Native MCP data

# Start development API server
pnpm dev:react                # React MCP (http://localhost:8787)
pnpm dev:native               # Native MCP (http://localhost:8788)
```

### Environment Variables Setup

Create a `.env` file with your credentials:

```bash
# R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_r2_bucket_name

# GitHub Token (optional but recommended to avoid rate limits)
GITHUB_TOKEN=your_github_personal_access_token
```

**Note**: GitHub token doesn't need special permissions for public repos. Create one at [GitHub Settings](https://github.com/settings/tokens).

## 📦 Building

### Building for NPM

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build --filter=@heroui/react-mcp
pnpm build --filter=@heroui/native-mcp

# Test a built package locally
cd packages/react-mcp  # or packages/native-mcp
npm pack
# This creates a .tgz file you can install locally to test
```

### Deploying API to Cloudflare

```bash
# Deploy to staging
pnpm deploy:api:staging

# Deploy to production
pnpm deploy:api:production
```

## 🧪 Testing

### Quick Testing

```bash
# Test API endpoints
pnpm test:api

# Test with staging API
pnpm test:api:staging

# Test with production API
pnpm test:api:production
```

### Using MCP Inspector

The MCP Inspector provides a web UI to test and debug the MCP server functionality:

```bash
# Start the React MCP Inspector
pnpm inspect:react

# Start the Native MCP Inspector
pnpm inspect:native
```

This will:

1. Start the MCP server with stdio transport
2. Launch the Inspector UI in your browser (usually at http://localhost:6274)
3. Provide a session token for authentication
4. Allow interactive testing of all MCP tools

### Testing with Local Build

For development or testing with a local build in your IDE:

```json
{
  "mcpServers": {
    "heroui-react-local": {
      "command": "node",
      "args": ["/path/to/heroui-mcp/packages/react-mcp/dist/stdio.js"]
    },
    "heroui-native-local": {
      "command": "node",
      "args": ["/path/to/heroui-mcp/packages/native-mcp/dist/stdio.js"]
    }
  }
}
```

### Environment Variables for Testing

When installed via `npx`, the MCP servers connect to these default API endpoints:

- **React MCP** (`@heroui/react-mcp`): `https://mcp-api.heroui.com`
- **Native MCP** (`@heroui/native-mcp`): `https://native-mcp-api.heroui.com`

You can override the API URL for local development:

```json
{
  "mcpServers": {
    "heroui-react": {
      "command": "npx",
      "args": ["-y", "@heroui/react-mcp"],
      "env": {
        "HEROUI_API_URL": "http://localhost:8787"
      }
    },
    "heroui-native": {
      "command": "npx",
      "args": ["-y", "@heroui/native-mcp"],
      "env": {
        "HEROUI_NATIVE_API_URL": "http://localhost:8788"
      }
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


### 🔨 Build Commands

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build:native      # Build @heroui/native-mcp
pnpm build:react       # Build @heroui/react-mcp
```

### 🚀 Development Commands

```bash
# Start development server for all packages
pnpm dev

# Start development server for specific package
pnpm dev:native        # Native MCP dev server (API)
pnpm dev:react         # React MCP dev server (API)

# Start specific transport
pnpm dev:native:api    # Native MCP API server (http://localhost:8788)
pnpm dev:native:stdio  # Native MCP stdio transport
pnpm dev:react:api     # React MCP API server (http://localhost:8787)
pnpm dev:react:stdio   # React MCP stdio transport
```

### 🔍 MCP Inspector Commands

```bash
# Launch MCP Inspector web UI for testing tools
pnpm inspect:native    # Native MCP Inspector
pnpm inspect:react     # React MCP Inspector
```

The Inspector provides a web interface at http://localhost:6274 (or similar) for testing MCP tools interactively.

### 📦 Data Extraction Commands

#### Native MCP Extraction

```bash
pnpm extract:native:dev            # Extract all to dev bucket
pnpm extract:native:dev:components # Extract only components
pnpm extract:native:dev:theme      # Extract only theme
```

#### React MCP Extraction

```bash
pnpm extract:react:dev             # Extract all to dev bucket
pnpm extract:react:dev:heroui      # Extract only HeroUI components
pnpm extract:react:dev:theme       # Extract only theme
```

### ✅ Code Quality Commands

```bash
# Type checking
pnpm typecheck         # Check all packages

# Linting
pnpm lint              # Lint all packages

# Formatting
pnpm format            # Format all TypeScript/JSON files

# Code cleanup
pnpm clean             # Clean build artifacts
```

### 🧪 Testing Commands

```bash
# Run all tests
pnpm test

# Pre-release checks
pnpm release:check     # Run lint, typecheck, and build
```

## 🏗️ Architecture

The HeroUI MCP uses a simple architecture:

1. **STDIO Client** (`@heroui/react-mcp`) - Runs locally, handles MCP protocol
2. **REST API** (Cloudflare Worker) - Serves component data
3. **R2 Storage** - Stores component documentation

```
AI Assistant → STDIO Client → REST API → R2 Storage
```

### API Endpoints

The REST API is publicly available at `https://mcp-api.heroui.com`:

- `GET /api/components` - List HeroUI components
- `GET /api/components/Button` - Get Button component details
- `GET /api/components/Button/props` - Get Button props
- `GET /api/components/Button/examples` - Get Button examples
- `GET /api/versions` - Get version information

## 🏗️ Monorepo Structure

```
.
├── packages/
│   ├── react-mcp/           # @heroui/react-mcp - Web components
│   │   ├── src/
│   │   │   ├── index.ts              # Hono server entry (Cloudflare)
│   │   │   ├── stdio.ts              # MCP stdio server entry (dev)
│   │   │   ├── stdio-npm.ts          # NPM distribution entry
│   │   │   ├── http-server.ts        # HTTP server implementation
│   │   │   ├── types.ts              # TypeScript definitions
│   │   │   └── services/             # Core services
│   │   ├── scripts/                  # Extraction scripts
│   │   ├── data/                     # Local fallback data
│   │   ├── wrangler.toml             # Cloudflare config
│   │   ├── README.md                 # Package-specific docs
│   │   └── package.json
│   │
│   └── native-mcp/          # @heroui/native-mcp - React Native
│       ├── src/                      # Similar structure
│       ├── README.md
│       └── package.json
│
├── .github/                 # GitHub Actions workflows
├── CONTRIBUTING.md          # This file
├── CODE_OF_CONDUCT.md       # Community guidelines
├── TROUBLESHOOTING.md       # Common issues
├── README.md                # Monorepo overview
├── turbo.json               # Turbo configuration
├── pnpm-workspace.yaml      # pnpm workspace config
└── package.json             # Root dependencies
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

The server extracts component data from GitHub repositories and stores it in Cloudflare R2:

- **React MCP**: React components from `heroui-inc/heroui` (v3 branch)
- **Native MCP**: React Native components from `heroui-inc/heroui-native` (alpha branch)

### R2 Storage Structure

**React MCP:**
```
heroui-mcp-data/
├── latest/
│   └── heroui.json           # Latest HeroUI data
├── heroui/
│   ├── v3.0.0-alpha.33.json  # Versioned HeroUI data
│   └── ...
└── versions.json             # Version metadata
```

**Native MCP:**
```
heroui-native-mcp-data/
├── native/
│   ├── components/
│   │   ├── 1.0.0-alpha.1.json
│   │   └── ...
│   ├── theme/
│   │   ├── 1.0.0-alpha.1.json
│   │   └── ...
│   └── latest/
│       ├── components.json
│       └── theme.json
└── versions.json
```

### Updating Component Data

#### For Development

Set up environment variables in `.env`, then extract to development bucket:

```bash
# React MCP
pnpm extract:react:dev             # Extract all React data
pnpm extract:react:dev:heroui      # Extract only HeroUI components
pnpm extract:react:dev:theme       # Extract only theme data

# Native MCP
pnpm extract:native:dev            # Extract all Native data
pnpm extract:native:dev:components # Extract only components
pnpm extract:native:dev:theme      # Extract only theme data
```

#### For Staging/Production

Data is automatically extracted via GitHub Actions when:

- Code is pushed to `develop` (staging) or `main` (production)
- Daily at 2 AM UTC
- Manually triggered via GitHub Actions UI

### Rate Limiting

The extraction scripts include rate limiting to avoid GitHub API limits:

- **With GitHub token**: 100ms delay between requests
- **Without token**: 500ms delay between requests

Always include `GITHUB_TOKEN` in your `.env` to avoid rate limits.

## 🛠️ Debugging

### Debug Mode

Run with debug output:

```bash
DEBUG=* npx @heroui/react-mcp@latest
```

### Testing API Connection

```bash
# Test if the API is accessible
curl https://mcp-api.heroui.com/health

# Check component data
curl https://mcp-api.heroui.com/api/components
```

### Verifying Package Installation

```bash
# Check if the package is available (always use @latest)
npx @heroui/react-mcp@latest --version
```

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

5. If creating a service (like version checking), add it to `services/`:

```typescript
// services/my-service.ts
export class MyService {
  // Service implementation
}

export const myService = new MyService();
```

6. Update both MCP server core files:
   - `mcp-server-core.ts` (Cloudflare version)
   - `mcp-server-core-npm.ts` (NPM distribution version)

### Architecture Notes

Each MCP package has two parallel implementations:

1. **Cloudflare Workers version** (`src/index.ts`, `src/services/data-store.ts`)
   - Uses Cloudflare R2 for storage
   - Supports HTTP transport
   - Designed for edge deployment

2. **NPM distribution version** (`src/stdio-npm.ts`, `src/services/data-store-file.ts`)
   - Uses file-based storage
   - Supports stdio transport
   - Designed for local usage

Both versions share the same core functionality but use different storage backends.

### Working on Multiple Packages

When working on features that affect multiple packages, you can use the root commands:

```bash
# Run commands for all packages (via Turbo)
pnpm build
pnpm typecheck
pnpm lint

# Run for specific package (from root)
pnpm build:react       # Build React MCP
pnpm build:native      # Build Native MCP
pnpm dev:react         # Dev server for React MCP
pnpm dev:native        # Dev server for Native MCP

# Or use pnpm filtering directly
pnpm --filter @heroui/react-mcp build
pnpm --filter @heroui/native-mcp typecheck
```

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
