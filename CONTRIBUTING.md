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
pnpm extract:react            # Extract React MCP data
pnpm extract:native           # Extract Native MCP data

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
pnpm build:react
pnpm build:native
```

Test using the build output directly. For example, in Cursor, add the following to your MCP settings:

```
"heroui-react": {
  "command": "/path/to/repo/mcp/apps/react-mcp/dist/stdio.js",
  "env": {
    "HEROUI_NATIVE_API_URL": "http://localhost:8787"
  }
}
```

Remember to start the API server with `pnpm dev:react` as well.

### Deploying API to Cloudflare

```bash
# Deploy to staging
pnpm deploy:api:staging

# Deploy to production
pnpm deploy:api:production
```

## 🧪 Testing

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
      "args": ["/path/to/heroui-mcp/apps/react-mcp/dist/stdio.js"]
    },
    "heroui-native-local": {
      "command": "node",
      "args": ["/path/to/heroui-mcp/apps/native-mcp/dist/stdio.js"]
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
pnpm dev:native        # Native MCP API server (http://localhost:8788)
pnpm dev:react         # React MCP API server (http://localhost:8787)
```

### 🔍 MCP Inspector Commands

```bash
# Launch MCP Inspector web UI for testing tools
pnpm inspect:native    # Native MCP Inspector
pnpm inspect:react     # React MCP Inspector
```

The Inspector provides a web interface for testing MCP tools interactively.

### 📦 Data Extraction Commands

```bash
pnpm extract:react            # Extract React MCP data
pnpm extract:native           # Extract Native MCP data
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

1. **STDIO Client** - Runs locally, handles MCP protocol
2. **REST API** (Cloudflare Worker) - Serves component data
3. **R2 Storage** - Stores component metadata

```
AI Assistant → STDIO Client → REST API → R2 Storage
```

## 🔧 Environment Configuration

The project supports multiple environments with different configurations:

### Development

```bash
NODE_ENV=development
```

### Staging

```bash
NODE_ENV=staging
```

### Production

```bash
NODE_ENV=production
```

Environment variables are configured in `wrangler.toml` for API servers.

## 🌐 Cloudflare Workers Deployment

Deploy the API to Cloudflare Workers:

1. **Configure Wrangler** (if not already done):

   ```bash
   wrangler login
   ```

2. **Deploy to staging**:

   ```bash
   pnpm deploy:api:staging
   ```

3. **Deploy to production**:
   ```bash
   pnpm deploy:api:production
   ```

## 📊 Data Management

### Component Data Extraction

The server extracts component data directly from `v3.heroui.com` and stores it in Cloudflare R2:

- **React MCP**: Fetches component documentation from `https://v3.heroui.com/docs/react/components/` using `llms.txt` manifest
- **Native MCP**: Fetches component documentation from `https://v3.heroui.com/docs/native/components/` using `llms.txt` manifest

Data is stored as `ctx.json` in R2, containing components list, documentation paths, version, and timestamp.

### Updating Component Data

#### For Development

Set up environment variables in `.env`, then extract to development bucket:

```bash
pnpm extract:react            # Extract React MCP data
pnpm extract:native           # Extract Native MCP data
```

#### For Staging/Production

Data is automatically extracted via GitHub Actions when:

- Code is pushed to `develop` (staging) or `main` (production)
- Manually triggered via GitHub Actions UI

### Rate Limiting

The extraction scripts fetch documentation directly from `v3.heroui.com`:

- Documentation is fetched from public URLs (no authentication required)
- Rate limiting is handled by the documentation server
- GitHub token is optional and only used for version checking via GitHub API

## 🛠️ Adding New Features

### Adding New Tools

To add a new tool to the MCP server:

1. Create a new tool file in `src/mcp/tools/`:

```typescript
// src/mcp/tools/my-tool.ts
import type {Tool} from "../types";
import {z} from "zod";
import {fetchApi} from "../lib/fetch";

export const myTool: Tool = {
  name: "my_tool",
  description: "Description of your tool",
  
  async ctx(shared) {
    // Optional: Initialize tool-specific context from shared context
    return {
      // Tool-specific context
    };
  },
  
  exec(server, {config, name, description, ctx}) {
    const inputSchema = z.object({
      // Define your parameters
    });
    
    const handler = async (args: z.infer<typeof inputSchema>) => {
      // Implementation
      const data = await fetchApi("/endpoint", config.apiBaseUrl);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data),
          },
        ],
      };
    };
    
    server.registerTool(name, {description, inputSchema: inputSchema.shape}, handler as any);
  },
};
```

2. Register the tool in `src/mcp/tools/index.ts`:

```typescript
import {myTool} from "./my-tool";

const tools: Tool[] = [
  // ... existing tools
  myTool,
];
```

3. If needed, add a corresponding API route in `src/api/routes/`:

```typescript
// src/api/routes/my-route.ts
import {Hono} from "hono";

const myRoute = new Hono();

myRoute.get("/", async (c) => {
  // Implementation
  return c.json({data: "..."});
});

export {myRoute};
```

4. Mount the route in `src/api/index.ts`:

```typescript
import {myRoute} from "./routes/my-route";

app.route("/my-route", myRoute);
```

### Architecture Notes

Each MCP package follows a unified architecture:

1. **MCP Server** - STDIO transport for NPM distribution
   - Runs locally in AI assistants
   - Communicates with REST API via HTTP
   - Uses shared context for tool initialization

2. **REST API** - Cloudflare Worker
   - Serves component data from R2 storage
   - Fetches documentation directly from v3.heroui.com when needed
   - Provides analytics and authentication middleware

3. **R2 Storage** - Cloudflare R2 bucket
   - Stores `ctx.json` with shared context (components, docs paths, version)
   - Single source of truth for component metadata

4. **Data Extraction** - CLI scripts
   - Fetches component data from v3.heroui.com using `llms.txt` manifest
   - Extracts minimal metadata (name, links) from component documentation
   - Uploads consolidated `ctx.json` to R2

## 🤝 Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:

- Code is formatted (`pnpm format`)
- All tests pass (`pnpm typecheck && pnpm lint && pnpm test`)
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
