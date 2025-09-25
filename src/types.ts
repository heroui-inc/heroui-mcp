/**
 * Type definitions for the MCP Server Worker
 */

export interface Env {
  // Environment variables
  APP_ENV: "development" | "staging" | "production";
  LOG_LEVEL: "debug" | "info" | "warn" | "error";

  // Cloudflare R2 bucket for component data storage
  COMPONENTS_BUCKET?: R2Bucket;
}

export type HonoContext = {
  Bindings: Env;
  Variables: {
    userId?: string;
    requestId?: string;
    // Add any request-scoped variables
  };
};
