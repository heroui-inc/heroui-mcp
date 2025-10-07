/**
 * Health check endpoint
 */

import type {Env} from "../types";

import {Hono} from "hono";

import {API_VERSION} from "../constants";

const health = new Hono<{Bindings: Env}>();

health.get("/", async (c) => {
  return c.json({
    status: "healthy",
    service: "heroui-native-mcp-api",
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || "production",
  });
});

export {health};
