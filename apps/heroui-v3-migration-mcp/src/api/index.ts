/**
 * HeroUI v3 Migration MCP API Server
 *
 * Streamable HTTP transport implementation for MCP
 * Supports POST for JSON-RPC messages and GET for SSE streams
 */

import {Hono} from "hono";
import {cors} from "hono/cors";

import {mcpHandler} from "./routes/mcp";

const app = new Hono();

// CORS middleware - validate Origin header to prevent DNS rebinding attacks
app.use(
  "*",
  cors({
    origin: (origin) => {
      // In production, validate origin
      // For now, allow all origins (can be restricted later)
      return origin || "*";
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Accept",
      "MCP-Protocol-Version",
      "Mcp-Session-Id",
      "Last-Event-ID",
    ],
    exposeHeaders: ["Mcp-Session-Id"],
  }),
);

// MCP endpoint - handles both POST and GET
app.all("/", mcpHandler);

// Health check endpoint
app.get("/health", (c) => {
  return c.json({status: "ok", service: "heroui-v3-migration-mcp"});
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: "Not found",
      message: "The requested endpoint does not exist",
    },
    404,
  );
});

// Error handler
app.onError((err, c) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);

  return c.json(
    {
      error: "Internal server error",
      message: "An unexpected error occurred",
    },
    500,
  );
});

// Export for Cloudflare Workers
export default app;

// For local development
export {app};
