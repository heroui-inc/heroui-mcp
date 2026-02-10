/**
 * MCP Streamable HTTP Handler
 *
 * Uses @hono/mcp StreamableHTTPTransport for simplified MCP integration.
 * The transport handles all JSON-RPC protocol details, SSE streaming, etc.
 * Reference: https://github.com/honojs/middleware/tree/main/packages/mcp
 */

import type {HonoContext} from "../types/context";
import type {Context} from "hono";

import {StreamableHTTPTransport} from "@hono/mcp";

import {createMcpServer} from "../lib/server";

/**
 * Main MCP handler using @hono/mcp middleware
 *
 * Creates a stateless server instance for each request and uses
 * StreamableHTTPTransport to handle all JSON-RPC protocol details,
 * including initialize, tools/list, tools/call, SSE streaming, etc.
 */
export async function mcpHandler(c: Context<HonoContext>) {
  try {
    // Get analytics from context (set by analytics middleware)
    const analytics = c.get("analytics");

    // Get environment variables from Cloudflare Worker bindings
    const config = {
      nodeEnv: c.env?.NODE_ENV,
      docsBaseUrl: c.env?.MIGRATION_DOCS_BASE_URL,
      analytics,
    };

    // Create a new server instance for each request (stateless)
    const server = await createMcpServer(config);

    // Create transport instance (stateless - no session management)
    const transport = new StreamableHTTPTransport({
      sessionIdGenerator: undefined,
    });

    // Connect server to transport
    await server.connect(transport);

    // Handle the request using the transport
    // The transport handles all JSON-RPC protocol details, SSE streaming, etc.
    return transport.handleRequest(c);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error handling MCP request:", error);

    return c.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal error",
        },
        id: null,
      },
      500,
    );
  }
}
