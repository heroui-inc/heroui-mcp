/**
 * HeroUI Native MCP API Server
 *
 * This is a Cloudflare Worker that serves component and theme data from R2
 * It provides REST API endpoints for the STDIO client to consume
 */

import type {HonoContext} from "./types/context";

import {Hono} from "hono";

import {
  components as legacyComponents,
  ctx as legacyCtx,
  docs as legacyDocs,
  themes as legacyThemes,
} from "./legacy";
import {analyticsMiddleware} from "./middleware/analytics";
import {authMiddleware} from "./middleware/auth";
import {corsMiddleware} from "./middleware/cors";
import {versionCheckMiddleware} from "./middleware/version-check";
import {components} from "./routes/components";
import {ctx} from "./routes/ctx";
import {docs} from "./routes/docs";
import {health} from "./routes/health";
import {themes} from "./routes/themes";

const app = new Hono<HonoContext>();

app.use("*", corsMiddleware);
app.use("*", versionCheckMiddleware);
app.use("*", analyticsMiddleware);
// Hybrid auth middleware (uses analytics from context):
// - Local dev: HTTP to localhost:8789
// - Deployed: Service binding to api
app.use("*", authMiddleware);

// Mount routes
app.route("/", health);

// Mount legacy routes at original paths (unchanged)
app.route("/components", legacyComponents);
app.route("/themes", legacyThemes);
app.route("/ctx", legacyCtx);
app.route("/docs", legacyDocs);

// Mount NEW routes at /v1/* prefix
app.route("/v1/components", components);
app.route("/v1/themes", themes);
app.route("/v1/docs", docs);
app.route("/v1/ctx", ctx);

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
