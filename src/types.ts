/**
 * Type definitions for the MCP Server Worker
 */

export interface Env {
  // Environment variables
  APP_ENV: "development" | "staging" | "production";
  LOG_LEVEL: "debug" | "info" | "warn" | "error";

  // Cloudflare R2 bucket for component data storage
  COMPONENT_DATA?: R2Bucket;
}

export type HonoContext = {
  Bindings: Env;
  Variables: {
    userId?: string;
    requestId?: string;
    // Add any request-scoped variables
  };
};

// Component Data Types (shared across services and lib)
export interface ComponentProp {
  name: string;
  type: string;
  description?: string;
  default?: unknown;
  required?: boolean;
}

export interface ComponentExample {
  name: string;
  content: string;
}

export interface ComponentData {
  name: string;
  description?: string;
  importStatement?: string;
  anatomy?: string;
  props: Record<string, ComponentProp>;
  examples?: ComponentExample[];
}

export interface ComponentDataset {
  [componentName: string]: ComponentData;
}

export interface VersionInfo {
  current: string;
  lastExtracted: string;
  extractDuration: number;
}
