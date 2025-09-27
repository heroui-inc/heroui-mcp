#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { server } from "./server.js"
import { initializeTools } from "./tools/index.js"

async function main() {
  // Use local server for development, staging for test, production otherwise
  const nodeEnv = process.env.NODE_ENV
  let apiBaseUrl: string

  if (nodeEnv === "development") {
    // Local development server (run with: npm run dev)
    apiBaseUrl = process.env.HEROUI_API_URL || "http://localhost:8787"
  } else if (nodeEnv === "staging") {
    // Staging environment
    apiBaseUrl = "https://staging-mcp.heroui.com"
  } else {
    // Production environment (default)
    apiBaseUrl = "https://mcp.heroui.com"
  }

  await initializeTools(server, {
    apiBaseUrl,
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.info("HeroUI MCP Server running on stdio")
}

main().catch((error) => {
  console.error("Fatal error in main():", error)
  process.exit(1)
})
