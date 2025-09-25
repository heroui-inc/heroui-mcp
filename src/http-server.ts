#!/usr/bin/env node

/**
 * HTTP Server Entry Point for MCP Streamable HTTP Transport
 * Starts the server in HTTP mode with streaming capabilities
 */

import {serve} from "@hono/node-server";

import app from "./index.js";

const port = parseInt(process.env.PORT || "3000");
const host = process.env.HOST || "0.0.0.0";
const env = process.env.NODE_ENV || "development";

console.log(`🚀 Starting HeroUI MCP Server (HTTP mode)`);
console.log(`📡 Environment: ${env}`);
console.log(`🌐 Server will be available at: http://${host}:${port}`);
console.log(`🔗 MCP Endpoint: http://${host}:${port}/mcp`);
console.log(`📊 Health Check: http://${host}:${port}/health`);
console.log();
console.log("🎯 MCP HTTP Features:");
console.log("   ✅ JSON-RPC over HTTP POST");
console.log("   ✅ Stateless request/response");
console.log("   ✅ CORS support for web clients");
console.log("   ✅ Cloudflare Workers compatible");
console.log();

// Start the server
serve(
  {
    fetch: app.fetch,
    hostname: host,
    port,
  },
  (info) => {
    console.log(`✅ MCP Server is running on http://${info.address}:${info.port}`);

    if (env === "development") {
      console.log();
      console.log("🧪 Development Mode - Test with:");
      console.log(`   curl http://localhost:${port}/health`);
      console.log(
        `   curl -H "Accept: application/json" -X POST http://localhost:${port}/mcp -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`,
      );
      console.log();
      console.log("🔗 For Claude Code integration, use:");
      console.log(`   Server URL: http://localhost:${port}/mcp`);
      console.log("   Transport: HTTP");
      console.log();
    }
  },
);

// Graceful shutdown handling
let isShuttingDown = false;

const shutdown = (signal: string) => {
  if (isShuttingDown) {
    console.log("⚠️  Force shutting down...");
    process.exit(1);
  }

  isShuttingDown = true;
  console.log(`🛑 Received ${signal}. Gracefully shutting down...`);

  // Give time for ongoing requests to complete
  setTimeout(() => {
    console.log("✅ Server shutdown complete");
    process.exit(0);
  }, 5000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  console.error("Stack:", error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

console.log("🎧 Listening for connections...");
