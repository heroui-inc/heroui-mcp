# Contributing to HeroUI React MCP Server

Thank you for your interest in contributing to the HeroUI React MCP Server! This guide will help you get started with development.

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
pnpm extract:all:dev  # Extracts HeroUI
# Or extract individually:
pnpm extract:dev:heroui

# Start MCP server (stdio transport)
pnpm mcp:stdio
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
# Build STDIO client for NPM
pnpm build

# Test the built package locally
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
      "args": ["/path/to/heroui-mcp/dist/stdio.js"]
    }
  }
}
```

### Environment Variables for Testing

You can override the API URL for local development:

```json
{
  "mcpServers": {
    "heroui": {
      "command": "npx",
      "args": ["-y", "@heroui/react-mcp"],
      "env": {
        "HEROUI_API_URL": "http://localhost:8787"
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

### MCP Server Commands

- `pnpm mcp:stdio` - Run MCP server with stdio transport
- `pnpm mcp:inspector` - Run MCP server with Inspector UI for testing
- `pnpm build` - Build the project for npm distribution
- `pnpm clean` - Clean build artifacts

### Data Extraction Commands

#### Development Environment (local R2 bucket)

- `pnpm extract:all:dev` - Extract HeroUI to dev bucket
- `pnpm extract:dev:heroui` - Extract HeroUI components to dev bucket
- `pnpm extract:dev both -- --force` - Force re-extraction even if version exists

#### Direct R2 Upload (requires environment variables)

- `pnpm extract:heroui` - Extract HeroUI to R2 (uses R2_BUCKET_NAME env var)

### Cloudflare Workers Commands

- `pnpm dev` - Start local development server (http://localhost:8787)
- `pnpm deploy` - Deploy to production environment
- `pnpm deploy:staging` - Deploy to staging environment
- `pnpm deploy:production` - Deploy to production environment

### Development Commands

- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint code linting
- `pnpm format` - Format code with Prettier

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
│       ├── version-check-service.ts  # Version checking functionality
│       ├── base-extractor.ts         # Base extraction functionality
│       └── github-client.ts          # GitHub API client
├── scripts/
│   ├── extract-heroui-r2.ts  # HeroUI data extraction to R2
│   ├── extract-dev.sh        # Development extraction helper
│   └── check-versions-ci.mjs # CI version checking script
├── lib/
│   ├── base-extractor.ts     # Base extraction functionality
│   ├── github-client.ts      # GitHub API client
│   ├── r2-uploader.ts        # R2 storage upload client
│   └── data-store.ts         # Data storage abstraction
├── data/                     # Local fallback data (npm package)
│   ├── latest/
│   │   └── heroui.json
│   └── versions.json
├── .env.example         # Environment variables template
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

The server extracts component data from GitHub repositories and stores it in Cloudflare R2:

- **HeroUI**: React components from `heroui-inc/heroui` (v3 branch)

### R2 Storage Structure

```
heroui-mcp-data/
├── latest/
│   └── heroui.json           # Latest HeroUI data
├── heroui/
│   ├── v3.0.0-alpha.33.json  # Versioned HeroUI data
│   └── ...
└── versions.json             # Version metadata
```

### Updating Component Data

#### For Development

```bash
# Set up environment variables in .env
# Then extract to development bucket
pnpm extract:all:dev

# Force re-extraction
pnpm extract:dev:heroui -- --force
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

The HeroUI React MCP project has two parallel implementations:

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
