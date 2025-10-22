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

const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:../memory.db",
  }),
});

const SERVER_CONFIG = {
  react: {
    name: "heroui-react",
    path: "../../apps/react-mcp/src/stdio.ts",
    description: "HeroUI React MCP Server",
  },
  native: {
    name: "heroui-native",
    path: "../../apps/native-mcp/src/stdio.ts",
    description: "HeroUI React Native MCP Server",
  },
};

const targetServer = (process.env.MCP_SERVER || "react") as keyof typeof SERVER_CONFIG;
const serverConfig = SERVER_CONFIG[targetServer];

if (!serverConfig) {
  throw new Error(`Invalid MCP_SERVER: ${targetServer}. Must be 'react' or 'native'`);
}

const mcpClient = new MCPClient({
  servers: {
    [serverConfig.name]: {
      command: "tsx",
      // Playground runs in the .mastra/output directory
      args: [resolve(__dirname, serverConfig.path)],
      env: {
        NODE_ENV: "development",
        HEROUI_API_URL: process.env.HEROUI_API_URL ?? "http://localhost:8787",
      },
    },
  },
});

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

    return bedrock(process.env.BEDROCK_MODEL ?? "us.anthropic.claude-sonnet-4-20250514-v1:0");
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

    return anthropic(process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514");
  }

  throw new Error("No model provider found");
};

export const agent = new Agent({
  instructions: `You are a HeroUI testing assistant for the ${serverConfig.description}. Help test MCP tools by querying component information and documentation. Use the available tools to search for components, get documentation, and explore the HeroUI component library.`,
  memory,
  model: getModel(),
  name: `HeroUI ${targetServer.toUpperCase()} MCP Test Agent`,
  tools: async () => {
    return await mcpClient.getTools();
  },
});
