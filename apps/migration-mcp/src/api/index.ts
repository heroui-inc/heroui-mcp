/**
 * HeroUI Migration MCP API Server
 *
 * Streamable HTTP transport implementation for MCP
 * Supports POST for JSON-RPC messages and GET for SSE streams
 */

import type {HonoContext} from "./types/context";

import {Hono} from "hono";
import {cors} from "hono/cors";

import {analyticsMiddleware} from "./middleware/analytics";
import {mcpHandler} from "./routes/mcp";
import {AnalyticsErrorEvent, AnalyticsEvent} from "./types/analytics";

const app = new Hono<HonoContext>();

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

// Analytics middleware - must be after CORS but before routes
app.use("*", analyticsMiddleware);

// MCP endpoint - handles both POST and GET
app.all("/", mcpHandler);

// Health check endpoint
app.get("/health", (c) => {
  const analytics = c.get("analytics");
  const startTime = Date.now();

  try {
    analytics.track({
      event: AnalyticsEvent.HEALTH_CHECK,
      properties: {
        endpoint: "health",
        responseTime: Date.now() - startTime,
      },
    });

    return c.json({status: "ok", service: "migration-mcp"});
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.HEALTH_CHECK_ERROR,
      fallbackMessage: "Health check failed",
      properties: {
        endpoint: "health",
        responseTime: Date.now() - startTime,
      },
    });

    return c.json({status: "error", service: "migration-mcp"}, 500);
  }
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

  // Try to track error if analytics is available
  try {
    const analytics = c.get("analytics");
    analytics.trackError({
      error: err,
      errorEvent: AnalyticsErrorEvent.HEALTH_CHECK_ERROR,
      fallbackMessage: "Unhandled error in error handler",
      properties: {
        endpoint: c.req.path,
        responseTime: 0,
      },
    });
  } catch {
    // Ignore analytics errors in error handler
  }

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
