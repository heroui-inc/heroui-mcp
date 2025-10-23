/**
 * Health check endpoint
 */

import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {API_VERSION} from "../constants";

const health = new Hono<HonoContext>();

health.get("/", async (c) => {
  return c.json({
    status: "healthy",
    service: "heroui-native-mcp-api",
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    environment: c.env.NODE_ENV,
  });
});

export {health};
