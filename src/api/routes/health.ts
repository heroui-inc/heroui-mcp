import type {Env} from "../types";

import {Hono} from "hono";

import {packageInfo} from "../../lib/package-info";

const health = new Hono<{Bindings: Env}>();

// Root endpoint - API info
health.get("/", (c) => {
  return c.json({
    name: "HeroUI MCP API",
    version: packageInfo.version,
    description: "REST API for HeroUI component documentation",
    endpoints: {
      "/": "API information",
      "/health": "Health check",
      "/components/:library": "List components",
      "/components/:library/:component": "Get component details",
      "/components/:library/:component/props": "Get component props",
      "/components/:library/:component/examples": "Get component examples",
      "/components/:library/:component/source": "Get component source code",
      "/components/:library/:component/styles": "Get component CSS styles",
      "/themes": "Get complete theme system (query: version)",
      "/themes/variables": "Get theme variables (query: theme, mode, version)",
      "/themes/colors": "Get theme colors (query: theme, mode, version)",
      "/themes/animations": "Get animation definitions (query: version)",
      "/themes/versions": "Get available theme versions",
      "/docs/:guide": "Get documentation guide (theming, colors, styling, etc.)",
      "/versions": "Get version information",
      "/versions/:package": "Check specific package version",
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
