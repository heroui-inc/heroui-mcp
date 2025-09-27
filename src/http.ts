// Import DOMParser polyfill for Workers environment
import "./lib/domparser-polyfill.js"

import { Hono } from "hono"
import { cors } from "hono/cors"
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import { randomUUID } from "node:crypto"
import { server } from "./server.js"
import { initializeTools } from "./tools/index.js"
import { ComponentDataServiceR2 } from "./services/component-data-service-r2.js"

const app = new Hono()
app.use('*', cors())

// Store transports for each session type
const transports = {
  streamable: {} as Record<string, StreamableHTTPServerTransport>,
  sse: {} as Record<string, SSEServerTransport>,
}

// Modern Streamable HTTP endpoint
app.post("/mcp", async (c) => {
  const body = await c.req.json()
  const apiKey = c.req.header("x-api-key")
  const sessionId = c.req.header("mcp-session-id")
  let transport: StreamableHTTPServerTransport

  if (sessionId && transports.streamable[sessionId]) {
    // Reuse existing transport
    transport = transports.streamable[sessionId]
  } else if (!sessionId && isInitializeRequest(body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports.streamable[sessionId] = transport
      },
    })

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports.streamable[transport.sessionId]
      }
    }

    // Initialize R2 data service
    const r2AccountId = process.env.R2_ACCOUNT_ID
    const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID
    const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    const r2Bucket = process.env.R2_BUCKET_NAME || "heroui-mcp"
    const isDevelopment = process.env.NODE_ENV === "development"

    const r2Endpoint = isDevelopment ?
      `https://${r2AccountId}.r2.cloudflarestorage.com` :
      `https://${r2AccountId}.r2.cloudflarestorage.com`

    const dataService = new ComponentDataServiceR2({
      accountId: r2AccountId!,
      accessKeyId: r2AccessKeyId!,
      secretAccessKey: r2SecretAccessKey!,
      bucketName: r2Bucket,
      endpoint: r2Endpoint
    })

    await initializeTools(server, { apiKey, dataService })

    // Connect to the MCP server
    await server.connect(transport)
  } else {
    // Invalid request
    console.error(
      "Invalid Streamable HTTP request: ",
      JSON.stringify(body, null, 2),
    )
    return c.json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided",
      },
      id: null,
    }, 400)
  }

  // Create a mock Express-like req/res for the transport
  const req = {
    body,
    headers: Object.fromEntries(c.req.raw.headers.entries()),
    method: c.req.method,
    url: c.req.url,
  } as any

  const res = {
    status: (code: number) => ({
      json: (data: any) => c.json(data, code),
      send: (data: any) => c.text(data, code),
    }),
    json: (data: any) => c.json(data),
    send: (data: any) => c.text(data),
    setHeader: (name: string, value: string) => c.header(name, value),
    end: () => {},
  } as any

  await transport.handleRequest(req, res, body)
})

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (c: any) => {
  const sessionId = c.req.header("mcp-session-id")
  if (!sessionId || !transports.streamable[sessionId]) {
    const body = await c.req.text().catch(() => "")
    console.error(
      "Invalid Streamable HTTP request (invalid/missing session ID): ",
      body,
    )
    return c.text("Invalid or missing session ID", 400)
  }

  console.log("Handling session request for ID:", sessionId)

  const transport = transports.streamable[sessionId]

  // Create mock Express-like req/res
  const req = {
    headers: Object.fromEntries(c.req.raw.headers.entries()),
    method: c.req.method,
    url: c.req.url,
  } as any

  const res = {
    status: (code: number) => ({
      send: (data: any) => c.text(data, code),
    }),
    send: (data: any) => c.text(data),
    setHeader: (name: string, value: string) => c.header(name, value),
    end: () => {},
  } as any

  await transport.handleRequest(req, res)
}

app.get("/mcp", handleSessionRequest)
app.delete("/mcp", handleSessionRequest)

// Legacy SSE endpoint for older clients
app.get("/sse", async (c) => {
  // Create SSE transport for legacy clients
  const apiKey = c.req.header("x-api-key")

  // Create mock Express response for SSE
  const res = {
    writeHead: (status: number, headers: any) => {
      Object.entries(headers).forEach(([key, value]) => {
        c.header(key, value as string)
      })
    },
    write: (data: string) => {
      // SSE data needs to be streamed
      return c.text(data)
    },
    end: () => {},
    on: (event: string, handler: () => void) => {
      if (event === 'close') {
        c.req.raw.signal.addEventListener('abort', handler)
      }
    },
  } as any

  const transport = new SSEServerTransport("/messages", res)
  transports.sse[transport.sessionId] = transport

  // Initialize R2 data service
  const r2AccountId = process.env.R2_ACCOUNT_ID
  const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID
  const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const r2Bucket = process.env.R2_BUCKET_NAME || "heroui-mcp"
  const isDevelopment = process.env.NODE_ENV === "development"

  const r2Endpoint = isDevelopment ?
    `https://${r2AccountId}.r2.cloudflarestorage.com` :
    `https://${r2AccountId}.r2.cloudflarestorage.com`

  const dataService = new ComponentDataServiceR2({
    accountId: r2AccountId!,
    accessKeyId: r2AccessKeyId!,
    secretAccessKey: r2SecretAccessKey!,
    bucketName: r2Bucket,
    endpoint: r2Endpoint
  })

  await initializeTools(server, { apiKey, dataService })
  await server.connect(transport)
})

// Legacy message endpoint for older clients
app.post("/messages", async (c) => {
  const sessionId = c.req.query("sessionId")
  const transport = transports.sse[sessionId as string]
  if (transport) {
    const body = await c.req.json()

    // Create mock Express-like req/res
    const req = {
      body,
      query: { sessionId },
    } as any

    const res = {
      status: (code: number) => ({
        send: (data: any) => c.text(data, code),
      }),
      send: (data: any) => c.text(data),
    } as any

    await transport.handlePostMessage(req, res, body)
  } else {
    console.error("No transport found for sessionId", sessionId)
    return c.text("No transport found for sessionId", 400)
  }
})

// Root endpoint
app.get("/", async (c) => {
  const packageJson = await import("../package.json", { assert: { type: "json" } }).then(m => m.default)
  const isDevelopment = process.env.NODE_ENV === "development"
  const baseUrl = isDevelopment ? "https://staging-mcp.heroui.com" : "https://mcp.heroui.com"

  return c.json({
    name: "HeroUI MCP Server",
    version: packageJson.version,
    description: "The official MCP server for HeroUI components",
    endpoints: {
      "/mcp": "Modern Streamable HTTP endpoint",
      "/sse": "Legacy SSE endpoint",
      "/messages": "Legacy message endpoint",
      "/health": "Health check endpoint",
    },
    environment: isDevelopment ? "staging" : "production",
    url: baseUrl
  })
})

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "production"
  })
})

// Export for different environments
export default app

// For Cloudflare Workers
export { app }