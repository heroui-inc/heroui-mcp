/**
 * Type definitions for the Native MCP API
 */

/// <reference types="@cloudflare/workers-types" />

import type {NativeComponentDefinition, NativeThemeDefinition} from "../lib/native-types";

export interface Env {
  // R2 bindings
  R2: R2Bucket;

  // Environment variables
  ENVIRONMENT?: string;

  // Analytics (optional)
  ANALYTICS?: AnalyticsEngineDataset;
}

export interface ComponentResult {
  component: string;
  data?: NativeComponentDefinition;
  error?: string;
}

export interface ThemeResult {
  theme: string;
  data?: NativeThemeDefinition;
  error?: string;
}

export interface ApiError {
  error: string;
  details?: string;
  statusCode?: number;
}

export interface VersionInfo {
  current: string;
  latest: string;
  available: string[];
}