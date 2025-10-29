/* eslint-disable import/order */

/**
 * HeroUI React MCP API Server
 *
 * This is a Cloudflare Worker that serves component data from R2
 * It provides REST API endpoints for the STDIO client to consume
 */

import {Hono} from "hono";

import {corsMiddleware} from "./middleware/cors";
import {components} from "./routes/components";
import {ctx} from "./routes/ctx";
import {docs} from "./routes/docs";
import {health} from "./routes/health";
import {themes} from "./routes/themes";
import {versions} from "./routes/versions";
import type {HonoContext} from "./types/context";
import {analyticsMiddleware} from "./middleware/analytics";
import {authMiddleware} from "./middleware/auth";

const app = new Hono<HonoContext>();

// Apply middleware globally
app.use("*", corsMiddleware);
app.use("*", analyticsMiddleware);
// Hybrid auth middleware:
// - Local dev: HTTP to localhost:8789
// - Deployed: Service binding to internal-services
app.use("*", authMiddleware);

// Mount routes
app.route("/", health);
app.route("/ctx", ctx);
app.route("/components", components);
app.route("/themes", themes);
app.route("/versions", versions);
app.route("/docs", docs);

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
