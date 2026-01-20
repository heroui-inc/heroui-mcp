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
      // Legacy endpoints (unchanged, production paths)
      "GET /components": "List components (legacy)",
      "POST /components": "Get component details (legacy)",
      "POST /components/props": "Get component props (legacy)",
      "POST /components/examples": "Get component examples (legacy)",
      "POST /components/source": "Get component source code (legacy)",
      "POST /components/styles": "Get component styles (legacy)",
      "GET /themes": "Get complete theme system (legacy)",
      "GET /themes/variables": "Get theme variables (legacy, query: theme, mode, version)",
      "GET /themes/colors": "Get theme colors (legacy)",
      "GET /themes/versions": "Get theme versions (legacy)",
      "GET /themes/animations": "Get theme animations (legacy)",
      "GET /versions": "Get version information (legacy)",
      "GET /ctx": "Get initialization context (legacy)",
      "GET /docs/available": "Get available documentation paths (legacy)",
      "GET /docs/content": "Get documentation content (legacy, query: path)",
      // New endpoints (v1 API)
      "GET /v1/components": "List HeroUI components",
      "POST /v1/components/docs": "Get component documentation (body: {components: string[]})",
      "POST /v1/components/source":
        "Get component source code for multiple components (body: {components: string[]})",
      "POST /v1/components/styles":
        "Get component CSS styles for multiple components (body: {components: string[]})",
      "GET /v1/themes/variables": "Get theme variables (simplified)",
      "GET /v1/docs/:path": "Get documentation content from a specific path",
      "GET /v1/ctx": "Get initialization context",
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
