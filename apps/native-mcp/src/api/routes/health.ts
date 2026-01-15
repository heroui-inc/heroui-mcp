import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import packageJson from "../../../package.json";

const health = new Hono<HonoContext>();

// Root endpoint - API info
health.get("/", (c) => {
  return c.json({
    name: "HeroUI Native MCP API",
    version: packageJson.version,
    description: "REST API for HeroUI Native component documentation",
    endpoints: {
      "/": "API information",
      "/health": "Health check",
      "GET /components": "List HeroUI Native components (latest version)",
      "GET /components/:component/docs": "Get component documentation from v3.heroui.com",
      "GET /docs/:path": "Get documentation content from a specific path",
      "/themes/variables": "Get theme variables",
    },
  });
});

// Health check
health.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: c.env?.NODE_ENV || process.env.NODE_ENV || "development",
  });
});

export {health};
