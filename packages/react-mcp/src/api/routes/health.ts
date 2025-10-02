import type {Env} from "../types";

import {Hono} from "hono";

import {packageInfo} from "../../lib/package-info";

const health = new Hono<{Bindings: Env}>();

// Root endpoint - API info
health.get("/", (c) => {
  return c.json({
    name: "HeroUI React MCP API",
    version: packageInfo.version,
    description: "REST API for HeroUI React component documentation",
    endpoints: {
      "/": "API information",
      "/health": "Health check",
      "/components": "List HeroUI components (latest version)",
      "/components/:component": "Get component details (latest version)",
      "/components/:component/props": "Get component props (latest version)",
      "/components/:component/examples": "Get component examples (latest version)",
      "/components/:component/source": "Get component source code (latest version)",
      "/components/:component/styles": "Get component CSS styles (latest version)",
      "/themes": "Get complete theme system (query: version)",
      "/themes/variables": "Get theme variables (query: theme, mode, version)",
      "/themes/colors": "Get theme colors (query: theme, mode, version)",
      "/themes/animations": "Get animation definitions (query: version)",
      "/themes/versions": "Get available theme versions",
      "/docs/available": "Get all available documentation paths from HeroUI v3 docs",
      "/docs/content": "Get documentation content from a specific path (query: path)",
      "/versions": "Get version information",
      "/versions/:package": "Check specific package version (heroui or mcp)",
    },
  });
});

// Health check
health.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: c.env?.APP_ENV || process.env.APP_ENV || "development",
  });
});

export {health};
