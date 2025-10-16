/**
 * API Response Types
 * Shared types for API responses used in tests and other consumers
 */

import type {NativeComponentDefinition} from "../../lib/native-types";

// Base API response types
export interface ApiError {
  error: string;
  details?: string;
}

export interface ZodValidationError {
  success: false;
  error: {
    issues: Array<{
      code: string;
      expected?: string;
      received?: string;
      path: (string | number)[];
      message: string;
    }>;
    name: "ZodError";
  };
}

// Component API responses
export interface ComponentListResponse {
  latestVersion: string;
  components: string[];
  examples: string[];
  count: number;
}

export interface ComponentDetailsResult {
  component: string;
  data?: NativeComponentDefinition;
  error?: string;
}

export interface ComponentDetailsResponse {
  version: string;
  results: ComponentDetailsResult[];
}

export interface ComponentPropsResult {
  component: string;
  props?: string;
  error?: string;
}

export interface ComponentPropsResponse {
  version: string;
  latestVersion: string;
  results: ComponentPropsResult[];
}

export interface ComponentExampleResult {
  example: string;
  content?: string;
  error?: string;
}

export interface ComponentExamplesResponse {
  version: string;
  results: ComponentExampleResult[];
  dependencies: Array<{name: string; path: string; content: string}>;
}

// Health API responses
export interface ApiInfoResponse {
  name: string;
  version: string;
  description: string;
  endpoints: Record<string, string>;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  environment: string;
}

// Versions API responses
export interface VersionsResponse {
  native: {
    latest: string;
    versions: string[];
  };
  mcp: {
    current: string;
  };
}

export interface PackageVersionResponse {
  package: string;
  currentVersion: string;
  latestVersion: string;
  isLatest: boolean;
  availableVersions?: string[];
}

// Theme API responses
export interface ThemeListResponse {
  version: string;
  themes: string[];
  latestVersion: string;
}

export interface ThemeVariablesResponse {
  theme: string;
  mode?: string;
  light?: {
    colors: Array<{
      name: string;
      value: string;
      category: string;
    }>;
  };
  dark?: {
    colors: Array<{
      name: string;
      value: string;
      category: string;
    }>;
  };
  colors?: Array<{
    name: string;
    value: string;
    category: string;
  }>;
  borderRadius?: Record<string, string>;
  opacity?: Record<string, number>;
  version: string;
  latestVersion: string;
}

export interface ThemeVersionsResponse {
  latest: string;
  versions: string[];
}

// Docs API responses
export interface DocSection {
  title: string;
  path: string;
  description: string;
}

export interface DocCategory {
  name: string;
  docs: DocSection[];
}

export interface DocsAvailableResponse {
  baseUrl: string;
  categories: DocCategory[];
  total: number;
}

export interface DocsContentResponse {
  path: string;
  url: string;
  content: string;
  contentType: string;
}
