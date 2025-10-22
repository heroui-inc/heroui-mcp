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
      "POST /components":
        "Get component details for multiple components (body: {components: string[]})",
      "POST /components/props":
        "Get component props for multiple components (body: {components: string[]})",
      "POST /components/examples":
        "Get component examples for multiple components (body: {components: string[]})",
      "POST /components/source":
        "Get component source code for multiple components (body: {components: string[]})",
      "POST /components/styles":
        "Get component CSS styles for multiple components (body: {components: string[]})",
      "/themes": "Get complete theme system (query: version)",
      "/themes/variables": "Get theme variables (query: theme, mode, version)",
      "/themes/colors": "Get theme colors (query: theme, mode, version)",
      "/themes/animations": "Get animation definitions (query: version)",
      "/themes/versions": "Get available theme versions",
      "/docs/available": "Get all available documentation paths from HeroUI v3 docs",
      "/docs/content": "Get documentation content from a specific path (query: path)",
      "/versions": "Get version information",
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
