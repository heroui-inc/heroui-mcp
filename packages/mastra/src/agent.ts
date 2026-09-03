import {resolve} from "path";

import {createAmazonBedrock} from "@ai-sdk/amazon-bedrock";
import {createAnthropic} from "@ai-sdk/anthropic";
import {createOpenAI} from "@ai-sdk/openai";
import {Agent} from "@mastra/core/agent";
import {LibSQLStore} from "@mastra/libsql";
import {MCPClient} from "@mastra/mcp";
import {Memory} from "@mastra/memory";
import {config} from "dotenv";

config({path: resolve(__dirname, "../.env")});

// Shared memory storage
const memory = new Memory({
  storage: new LibSQLStore({
    id: "heroui-mcp-memory-store",
    url: "file:../../memory.db",
  }),
});

// Model provider
const getModel = () => {
  if (
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_REGION &&
    process.env.AWS_SECRET_ACCESS_KEY
  ) {
    const bedrock = createAmazonBedrock({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      region: process.env.AWS_REGION,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    return bedrock(process.env.BEDROCK_MODEL ?? "us.anthropic.claude-sonnet-4-5-20250929-v1:0");
  }

  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    return openai(process.env.OPENAI_MODEL ?? "gpt-4o");
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    return anthropic(process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929");
  }

  throw new Error("No model provider found");
};

// React MCP Client
const reactMcpClient = new MCPClient({
  servers: {
    "heroui-react": {
      command: "tsx",
      args: [resolve(__dirname, "../../../../apps/react-mcp/src/mcp/stdio.ts")],
      env: {
        NODE_ENV: "development",
        HEROUI_API_URL: process.env.HEROUI_API_URL ?? "http://localhost:8787",
      },
    },
  },
});

// Native MCP Client
const nativeMcpClient = new MCPClient({
  servers: {
    "heroui-native": {
      command: "tsx",
      args: [resolve(__dirname, "../../../../apps/native-mcp/src/mcp/stdio.ts")],
      env: {
        NODE_ENV: "development",
        HEROUI_NATIVE_API_URL: process.env.HEROUI_NATIVE_API_URL ?? "http://localhost:8788",
      },
    },
  },
});

// React Agent
export const reactAgent = new Agent({
  id: "heroui-react-mcp-test-agent",
  instructions: `You are a HeroUI React testing assistant. Help test MCP tools by querying component information and documentation for the React component library.`,
  memory,
  model: getModel(),
  name: "HeroUI React MCP Test Agent",
  tools: async () => {
    return await reactMcpClient.listTools();
  },
});

// Native Agent
export const nativeAgent = new Agent({
  id: "heroui-native-mcp-test-agent",
  instructions: `You are a HeroUI React Native testing assistant. Help test MCP tools by querying component information and documentation for the React Native component library.`,
  memory,
  model: getModel(),
  name: "HeroUI Native MCP Test Agent",
  tools: async () => {
    return await nativeMcpClient.listTools();
  },
});
