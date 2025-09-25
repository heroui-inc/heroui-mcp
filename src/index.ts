import type {HonoContext} from "./types";

import {Hono} from "hono";
import {cors} from "hono/cors";
import {logger} from "hono/logger";
import {requestId} from "hono/request-id";

import {McpServerCore} from "./services/mcp-server-core.js";

// Create Hono app with proper types
const app = new Hono<HonoContext>();

// Initialize MCP server (for development - Node.js environment)
const mcpServer = new McpServerCore();

await mcpServer.initialize();

// Enhanced CORS middleware for MCP
app.use(
  "*",
  cors({
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID", "Accept"],
    allowMethods: ["POST", "OPTIONS"],
    credentials: true,
    maxAge: 86400,
    origin: (origin) => {
      // Allow all origins in development
      if (process.env.NODE_ENV === "development") {
        return origin || "*";
      }

      // In production, validate against allowed origins
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
        "https://claude.ai",
        "https://api.claude.ai",
      ];

      return origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    }, // 24 hours
  }),
);

// Middleware
app.use("*", logger());
app.use("*", requestId());

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    capabilities: ["tools"],
    environment: c.env.APP_ENV,
    service: "heroui-mcp",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    environment: c.env.APP_ENV,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// MCP HTTP endpoint - stateless request/response
app.post("/mcp", async (c) => {
  try {
    // Validate request
    const contentType = c.req.header("Content-Type");

    if (!contentType?.includes("application/json")) {
      return c.json({error: "Content-Type must be application/json"}, 400);
    }

    // Parse request body
    const body = await c.req.json();

    // Handle both single messages and batches
    const isBatch = Array.isArray(body);
    const messages = isBatch ? body : [body];
    const responses: unknown[] = [];

    // Process each message
    for (const message of messages) {
      try {
        // Validate JSON-RPC format
        if (!message || typeof message !== "object" || message.jsonrpc !== "2.0") {
          responses.push({
            error: {
              code: -32600,
              message: "Invalid Request - must be valid JSON-RPC 2.0",
            },
            id: message?.id || null,
            jsonrpc: "2.0",
          });
          continue;
        }

        let response = null;

        if ("method" in message) {
          if (message.method === "initialize") {
            const result = await mcpServer.handleInitialize(message.params || {});

            response = {
              id: message.id,
              jsonrpc: "2.0",
              result,
            };
          } else if (message.method === "initialized") {
            await mcpServer.handleInitialized();
            response = {
              id: message.id,
              jsonrpc: "2.0",
              result: {},
            };
          } else if (message.method === "tools/list") {
            const result = await mcpServer.handleListTools();

            response = {
              id: message.id,
              jsonrpc: "2.0",
              result,
            };
          } else if (message.method === "tools/call") {
            const result = await mcpServer.handleToolCall(message.params || {});

            response = {
              id: message.id,
              jsonrpc: "2.0",
              result,
            };
          } else {
            response = {
              error: {
                code: -32601,
                message: `Method not found: ${message.method}`,
              },
              id: message.id,
              jsonrpc: "2.0",
            };
          }
        } else {
          response = {
            error: {
              code: -32600,
              message: "Invalid Request - missing method",
            },
            id: message.id || null,
            jsonrpc: "2.0",
          };
        }

        if (response) {
          responses.push(response);
        }
      } catch (error) {
        responses.push({
          error: {
            code: -32603,
            data: error instanceof Error ? error.message : "Unknown error",
            message: "Internal error",
          },
          id: message?.id || null,
          jsonrpc: "2.0",
        });
      }
    }

    // Return appropriate response format
    const responseData = isBatch ? responses : responses[0] || null;

    return c.json(responseData);
  } catch (error) {
    console.error("MCP request error:", error);

    return c.json(
      {
        error: {
          code: -32700,
          data: error instanceof Error ? error.message : "Failed to parse request",
          message: "Parse error",
        },
        id: null,
        jsonrpc: "2.0",
      },
      400,
    );
  }
});

// Handle OPTIONS for CORS preflight
app.options("/mcp", () => {
  return new Response(null, {status: 200});
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      availableEndpoints: ["GET /", "GET /health", "POST /mcp"],
      error: "Not found",
      path: c.req.path,
    },
    404,
  );
});

// Error handler
app.onError((err, c) => {
  console.error(`Error: ${err.message}`, err);

  return c.json(
    {
      error: "Internal server error",
      message: c.env.APP_ENV === "development" ? err.message : "An error occurred",
      requestId: c.get("requestId"),
    },
    500,
  );
});

export default app;
