# HeroUI React MCP Mastra Test Agent

Local development agent for testing HeroUI React MCP server tools via Mastra playground.

> **Note:** This is a development-only tool. All Mastra dependencies are in the main package.json as devDependencies and are excluded from production builds.

## Quick Start

1. **Install dependencies** (from project root):

   ```bash
   pnpm install
   ```

2. **Configure environment:**

   ```bash
   cd mastra
   cp .env.example .env
   # Edit .env and add your API key (choose one provider)
   ```

3. **Start Mastra playground** (from project root):

   ```bash
   pnpm dev:mastra
   ```

4. **Access playground:**
   Open http://localhost:4111 in your browser

## Environment Variables

**Required** (choose one model provider):

- `ANTHROPIC_API_KEY` - For Claude models
- `OPENAI_API_KEY` - For GPT models
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` - For Bedrock

**Optional**:

- `ANTHROPIC_MODEL` - Override default Claude model (default: `claude-sonnet-4-20250514`)
- `OPENAI_MODEL` - Override default OpenAI model (default: `gpt-4o`)
- `BEDROCK_MODEL` - Override default Bedrock model (default: `us.anthropic.claude-sonnet-4-20250514-v1:0`)
- `HEROUI_API_URL` - Override MCP server API URL (default: `http://localhost:8787`)

## How It Works

The agent connects directly to the HeroUI React MCP server via stdio (standard input/output). When you start the playground, it:

1. Spawns the MCP server process using `tsx src/stdio.ts`
2. Automatically loads all available MCP tools and resources
3. Makes them available to the AI agent for testing

When you ask questions in the playground, the agent can:

- List available HeroUI components
- Search component documentation
- Get detailed component information
- Test MCP tool functionality in real-time

> **⚠️ Important:** If you make changes to the MCP server code, you must **restart the playground server** to see the changes.

## Memory

The agent uses persistent memory to maintain conversation context across sessions:

- **Storage**: SQLite database files in project root (`memory.db`, `memory.db-shm`, `memory.db-wal`)
- **Provider**: `LibSQLStore` with file-based storage (`file:../../memory.db`)
- **Location**: Stored two directories up from `.mastra/output` (resolves to project root)
- **Persistence**: Conversations are automatically saved and can be resumed
- **Thread Management**: Each conversation maintains its own thread with full history

The memory files are git-ignored and created automatically on first run.

## Architecture

```
mastra/
├── agent.ts          # Agent configuration with MCP client
├── index.ts          # Mastra instance setup
├── .env.example      # Environment template
└── README.md         # This file

Dependencies are managed in the root package.json as devDependencies.
The mastra/ directory is excluded from production builds and npm packages.
```
