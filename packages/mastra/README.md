# HeroUI Mastra Test Agents

Local testing harness for HeroUI MCP servers with two separate test agents.

> **Note:** This is a development-only tool. All Mastra dependencies are managed in this package and are excluded from production builds.

## Overview

Two simple test agents for local MCP server testing:

- **React Agent**: Tests the HeroUI React MCP server
- **Native Agent**: Tests the HeroUI React Native MCP server

## Quick Start

1. **Install dependencies** (from monorepo root):

   ```bash
   pnpm install
   ```

2. **Configure environment:**

   ```bash
   cd packages/mastra
   cp .env.example .env
   # Edit .env and add your API key (choose one provider)
   ```

3. **Start Mastra playground**:

   From monorepo root:
   ```bash
   pnpm dev:mastra
   ```

   Or from `packages/mastra` directory:
   ```bash
   pnpm dev
   ```

4. **Access playground:**
   Open http://localhost:4111 in your browser

## Environment Variables

**Required** (choose one model provider):

- `ANTHROPIC_API_KEY` - For Claude models
- `OPENAI_API_KEY` - For GPT models
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` - For Bedrock

**Optional**:

- `ANTHROPIC_MODEL` - Override default Claude model (default: `claude-sonnet-4-5-20250929`)
- `OPENAI_MODEL` - Override default OpenAI model (default: `gpt-4o`)
- `BEDROCK_MODEL` - Override default Bedrock model (default: `us.anthropic.claude-sonnet-4-5-20250929-v1:0`)
- `HEROUI_API_URL` - Override MCP server API URL (default: `http://localhost:8787`)

## How It Works

Each agent connects to its MCP server via stdio. When you start the playground:

1. Both React and Native MCP server processes are spawned
2. Each agent loads its server's tools
3. Both agents are available in the playground

In the playground, select which agent to interact with (React or Native) and test the MCP tools.

> **⚠️ Important:** If you make changes to the MCP server code, you must **restart the playground server** to see the changes.

## Using the Agents

### In the Playground

Both agents are available in the Mastra playground:
- **herouiReactAgent** - For testing React MCP tools
- **herouiNativeAgent** - For testing Native MCP tools

Select an agent from the dropdown and start testing.

### Programmatic Usage

```typescript
import {reactAgent, nativeAgent} from '@heroui/mastra';

// Test React MCP
const reactResponse = await reactAgent.generate('List all React components');

// Test Native MCP
const nativeResponse = await nativeAgent.generate('List all Native components');
```

## Memory

Agents share persistent memory for conversation context:

- **Storage**: SQLite database (`memory.db`) in monorepo root
- **Persistence**: Conversations saved automatically
- **Thread Management**: Each agent has its own thread

Memory files are git-ignored and created automatically.

## Architecture

```
packages/mastra/
├── src/
│   ├── agent.ts          # React and Native agents
│   └── index.ts          # Mastra instance
├── .env.example          # Environment template
├── package.json          # Mastra dependencies
└── README.md             # This file
```

Simple and clean:
- `agent.ts` - Creates reactAgent and nativeAgent
- `index.ts` - Exports agents and Mastra instance

## Development

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Clean
pnpm clean
```

## MCP Tools Available

Both agents have access to their respective MCP server tools for testing component queries, documentation lookups, and more.
