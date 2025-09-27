import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import packageJson from "../package.json" assert { type: "json" }

export const server = new McpServer({
  name: "@heroui/mcp",
  version: packageJson.version,
  capabilities: {
    prompts: {},
    resources: {},
    tools: {},
  },
})