import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import packageJson from "../../../package.json";

const health = new Hono<HonoContext>();

// Root endpoint - API info
health.get("/", (c) => {
  return c.json({
    name: "HeroUI React MCP API",
    version: packageJson.version,
    description: "REST API for HeroUI React component documentation",
    endpoints: {
      "/": "API information",
      "/health": "Health check",
      "GET /components": "List HeroUI components (latest version)",
      "GET /components/:component/docs": "Get component documentation from v3.heroui.com",
      "POST /components/source":
        "Get component source code for multiple components (body: {components: string[]})",
      "POST /components/styles":
        "Get component CSS styles for multiple components (body: {components: string[]})",
      "GET /themes/variables": "Get theme variables (query: theme, mode, version)",
      "GET /docs/:path": "Get documentation content from a specific path",
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
