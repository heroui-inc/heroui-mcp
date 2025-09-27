/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "./lib/domparser-polyfill.js";

import type {getAnalytics} from "./lib/analytics.js";
import type {Context} from "hono";

import {randomUUID} from "node:crypto";

import {StreamableHTTPServerTransport} from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {isInitializeRequest} from "@modelcontextprotocol/sdk/types.js";
import {Hono} from "hono";
import {cors} from "hono/cors";

import {initializeAnalytics} from "./lib/analytics.js";
import {
  ErrorCode,
  ErrorMessages,
  MCPError,
  createErrorResponse,
  handleError,
} from "./lib/error-handler.js";
import {server} from "./server.js";
import {ComponentDataServiceR2} from "./services/component-data-service-r2.js";
import {initializeTools} from "./tools/index.js";

const app = new Hono();

// Global error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);

  const mcpError = handleError(err, {
    operation: c.req.method + " " + c.req.path,
  });

  return c.json(createErrorResponse(mcpError), mcpError.statusCode as any);
});

// Security: CORS with proper Origin validation
app.use(
  "*",
  cors({
    origin: (origin) => {
      // In production, validate against known MCP clients
      const env = (global as {env?: Record<string, string>}).env || {};
      if (env.APP_ENV === "production") {
        const allowedPatterns = [
          /^https:\/\/claude\.ai$/,
          /^https:\/\/.*\.claude\.ai$/,
          /^https:\/\/cursor\.sh$/,
          /^https:\/\/.*\.cursor\.sh$/,
          /^http:\/\/localhost(:\d+)?$/,
          /^http:\/\/127\.0\.0\.1(:\d+)?$/,
        ];
        if (!origin || allowedPatterns.some((pattern) => pattern.test(origin))) {
          return origin || "*";
        }

        return null;
      }

      // Allow all origins in development/staging
      return "*";
    },
    credentials: true,
    allowHeaders: ["Content-Type", "Accept", "Mcp-Session-Id", "X-Api-Key"],
  }),
);

// Initialize analytics
let analytics: ReturnType<typeof getAnalytics> = null;

// Store transports
const transports: Record<string, StreamableHTTPServerTransport> = {};

// Main MCP handler function
const handleMcpRequest = async (c: Context) => {
  const startTime = Date.now();
  let body: {method?: string; params?: {name?: string}; id?: string};
  const sessionId: string | undefined = c.req.header("Mcp-Session-Id"); // Use correct case for header

  try {
    body = await c.req.json();
  } catch (error) {
    const mcpError = new MCPError(
      ErrorMessages[ErrorCode.MALFORMED_JSON]({
        error: error instanceof Error ? error.message : "Invalid JSON",
      }),
    );

    return c.json(createErrorResponse(mcpError), mcpError.statusCode as any);
  }

  const apiKey = c.req.header("x-api-key");
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports[sessionId] = transport;

        // Set Mcp-Session-Id header in response (MCP spec compliance)
        if (c && c.header) {
          c.header("Mcp-Session-Id", sessionId);
        }

        // Initialize analytics on first session
        if (!analytics) {
          const env = c.env as Record<string, string | undefined>;
          analytics = initializeAnalytics({
            apiKey: env.POSTHOG_KEY || "",
            host: env.POSTHOG_HOST || "https://us.i.posthog.com",
            environment: env.APP_ENV || "development",
          });
        }

        // Track session start
        if (analytics) {
          analytics.startSession(sessionId, {
            endpoint: "streamable_http",
            clientInfo: c.req.header("user-agent"),
          });
        }
      },
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        // Track session end
        if (analytics) {
          const sessionDuration = Date.now() - startTime;
          analytics.endSession(transport.sessionId, {
            duration: sessionDuration,
          });
        }
        delete transports[transport.sessionId];
      }
    };

    try {
      // Initialize R2 data service
      const env = c.env as Record<string, string | undefined>;
      const r2AccountId = env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
      const r2AccessKeyId = env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
      const r2SecretAccessKey = env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
      const r2Bucket = env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || "heroui-mcp";
      const _isDevelopment =
        env.APP_ENV === "development" || process.env.NODE_ENV === "development";

      // Check if R2 credentials are available
      if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
        console.warn("R2 credentials not configured, data service will be limited");
        // Initialize tools without data service - will fallback to API
        await initializeTools(server, {apiKey});
      } else {
        const r2Endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;

        const dataService = new ComponentDataServiceR2({
          accountId: r2AccountId,
          accessKeyId: r2AccessKeyId,
          secretAccessKey: r2SecretAccessKey,
          bucketName: r2Bucket,
          endpoint: r2Endpoint,
        });

        await initializeTools(server, {apiKey, dataService});
      }

      // Connect to the MCP server
      await server.connect(transport);
    } catch (error) {
      console.error("Failed to initialize MCP:", error);
      const mcpError = handleError(error, {
        sessionId: transport.sessionId,
        operation: "initialization",
      });

      // Clean up failed session
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }

      return c.json(createErrorResponse(mcpError, body?.id), mcpError.statusCode as any);
    }
  } else {
    // Invalid request
    const mcpError = new MCPError(
      ErrorMessages[ErrorCode.INVALID_SESSION]({
        sessionId,
        details: "No valid session ID provided or not an initialization request",
      }),
    );

    return c.json(createErrorResponse(mcpError, body?.id), mcpError.statusCode as any);
  }

  // Create a mock Express-like req/res for the transport
  interface MockRequest {
    body: typeof body;
    headers: Record<string, string>;
    method: string;
    url: string;
  }

  const req: MockRequest = {
    body,
    headers: {} as Record<string, string>,
    method: c.req.method,
    url: c.req.url,
  };

  interface MockResponse {
    status: (code: number) => {
      json: (data: unknown) => Response | Promise<Response>;
      send: (data: string) => Response | Promise<Response>;
    };
    json: (data: unknown) => Response | Promise<Response>;
    send: (data: string) => Response | Promise<Response>;
    setHeader: (name: string, value: string) => void;
    writeHead: (statusCode: number, headers?: Record<string, string>) => void;
    write: (chunk: string | Buffer) => void;
    end: (data?: string | Buffer) => void;
  }

  const responseHeaders: Record<string, string> = {};
  const responseChunks: (string | Buffer)[] = [];

  const res: MockResponse = {
    status: (code: number) => ({
      json: (data: unknown) => c.json(data, code as any),
      send: (data: string) => c.text(data, code as any),
    }),
    json: (data: unknown) => c.json(data),
    send: (data: string) => c.text(data),
    setHeader: (name: string, value: string) => {
      responseHeaders[name] = value;
      c.header(name, value);
    },
    writeHead: (statusCode: number, headers?: Record<string, string>) => {
      c.status(statusCode as any);
      if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
          responseHeaders[key] = value;
          c.header(key, value);
        });
      }
    },
    write: (chunk: string | Buffer) => {
      responseChunks.push(chunk);
    },
    end: (data?: string | Buffer) => {
      if (data) {
        responseChunks.push(data);
      }
      const finalData = responseChunks
        .map((chunk) => (typeof chunk === "string" ? chunk : chunk.toString()))
        .join("");
      if (finalData) {
        c.text(finalData);
      }
    },
  };

  // Track MCP request
  const requestStartTime = Date.now();
  const method = body?.method || "unknown";
  const toolName = body?.params?.name || undefined;

  if (analytics && transport.sessionId) {
    analytics.trackMcpRequest(transport.sessionId, {
      method,
      toolName,
      requestSize: JSON.stringify(body).length,
    });
  }

  try {
    await transport.handleRequest(req as any, res as any, body);

    // Track success
    if (analytics && transport.sessionId) {
      const responseTime = Date.now() - requestStartTime;
      analytics.trackMcpSuccess(transport.sessionId, {
        method,
        toolName,
        responseTime,
      });
    }
  } catch (error) {
    console.error("Error handling MCP request:", error);

    // Track error
    if (analytics && transport.sessionId) {
      const responseTime = Date.now() - requestStartTime;
      analytics.trackMcpError(transport.sessionId, {
        method,
        toolName,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime,
      });
    }

    const mcpError = handleError(error, {sessionId: transport.sessionId, operation: method});

    return c.json(createErrorResponse(mcpError, body?.id), mcpError.statusCode as any);
  }
};

// MCP endpoint for POST requests
app.post("/mcp", handleMcpRequest);

// Handler for GET requests (SSE streaming)
const handleSessionGet = async (c: Context) => {
  const sessionId = c.req.header("Mcp-Session-Id");
  if (!sessionId || !transports[sessionId]) {
    const body = await c.req.text().catch(() => "");
    console.error("Invalid Streamable HTTP request (invalid/missing session ID): ", body);

    return c.text("Invalid or missing session ID", 400);
  }

  // Check Accept header for SSE support
  const acceptHeader = c.req.header("Accept") || "";
  if (!acceptHeader.includes("text/event-stream")) {
    return c.newResponse("Method Not Allowed - Accept header must include text/event-stream", 405);
  }

  const transport = transports[sessionId];

  // Create mock Express-like req/res
  interface MockGetRequest {
    headers: Record<string, string>;
    method: string;
    url: string;
  }

  const req: MockGetRequest = {
    headers: {} as Record<string, string>,
    method: c.req.method,
    url: c.req.url,
  };

  interface MockGetResponse {
    status: (code: number) => {
      send: (data: string) => Response | Promise<Response>;
    };
    send: (data: string) => Response | Promise<Response>;
    setHeader: (name: string, value: string) => void;
    writeHead: (statusCode: number, headers?: Record<string, string>) => void;
    write: (chunk: string | Buffer) => void;
    end: (data?: string | Buffer) => void;
  }

  const responseHeaders: Record<string, string> = {};
  const responseChunks: (string | Buffer)[] = [];

  const res: MockGetResponse = {
    status: (code: number) => ({
      send: (data: string) => c.text(data, code as any),
    }),
    send: (data: string) => c.text(data),
    setHeader: (name: string, value: string) => {
      responseHeaders[name] = value;
      c.header(name, value);
    },
    writeHead: (statusCode: number, headers?: Record<string, string>) => {
      c.status(statusCode as any);
      if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
          responseHeaders[key] = value;
          c.header(key, value);
        });
      }
    },
    write: (chunk: string | Buffer) => {
      responseChunks.push(chunk);
    },
    end: (data?: string | Buffer) => {
      if (data) {
        responseChunks.push(data);
      }
      const finalData = responseChunks
        .map((chunk) => (typeof chunk === "string" ? chunk : chunk.toString()))
        .join("");
      if (finalData) {
        c.text(finalData);
      }
    },
  };

  await transport.handleRequest(req as any, res as any);
};

// Handler for DELETE requests (session termination)
const handleSessionDelete = async (c: Context) => {
  const sessionId = c.req.header("Mcp-Session-Id");

  if (!sessionId) {
    return c.text("Mcp-Session-Id header required", 400);
  }

  const transport = transports[sessionId];
  if (!transport) {
    return c.text("Session not found", 404);
  }

  // Clean up session
  delete transports[sessionId];

  // Track session end
  if (analytics) {
    analytics.endSession(sessionId, {
      duration: Date.now(),
    });
  }

  return c.newResponse(null, 204); // 204 No Content as per spec
};

// MCP endpoints for GET and DELETE
app.get("/mcp", handleSessionGet);
app.delete("/mcp", handleSessionDelete);

// Root endpoint - returns server info
app.get("/", async (c) => {
  const packageJson = await import("../package.json", {assert: {type: "json"}}).then(
    (m) => m.default,
  );
  const env = c.env as Record<string, string | undefined>;
  const appEnv = env.APP_ENV || process.env.APP_ENV || "development";

  // Determine base URL based on environment
  let baseUrl: string;
  switch (appEnv) {
    case "production":
      baseUrl = "https://mcp.heroui.com";
      break;
    case "staging":
      baseUrl = "https://staging-mcp.heroui.com";
      break;
    default:
      baseUrl = "http://localhost:8787";
  }

  return c.json({
    name: "HeroUI MCP Server",
    version: packageJson.version,
    description: "The official MCP server for HeroUI components",
    transport: "streamable-http",
    protocol: "2025-03-26",
    endpoints: {
      "/mcp": "MCP Streamable HTTP endpoint (POST, GET, DELETE)",
      "/health": "Health check endpoint",
      "/": "Server information",
    },
    features: {
      sessions: true,
      sse: true,
      batching: true,
    },
    environment: appEnv,
    url: baseUrl,
  });
});

// Health check endpoint
app.get("/health", async (c) => {
  // Flush analytics before health check
  if (analytics) {
    await analytics.flush();
  }

  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment:
      (c.env as Record<string, string | undefined>).APP_ENV || process.env.APP_ENV || "production",
  });
});

// Cleanup function for worker shutdown
export async function cleanup() {
  if (analytics) {
    await analytics.shutdown();
  }
}

// Export for different environments
export default app;

// For Cloudflare Workers
export {app};
