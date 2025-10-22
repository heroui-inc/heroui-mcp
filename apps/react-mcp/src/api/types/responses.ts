/**
 * API Response Types
 * Shared types for API responses used in tests and other consumers
 */

import type {ComponentData} from "../../types/data";

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
      path: string[];
      message: string;
    }>;
    name: "ZodError";
  };
}

// Component API responses
export interface ComponentListResponse {
  components: string[];
  latestVersion: string;
  count: number;
}

export interface ComponentDetailsResult {
  component: string;
  data?: ComponentData;
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
  results: ComponentPropsResult[];
}

export interface ComponentExampleResult {
  component: string;
  examples?: Array<{name: string; content: string}>;
  error?: string;
}

export interface ComponentExamplesResponse {
  version: string;
  results: ComponentExampleResult[];
}

export interface ComponentSourceResult {
  component: string;
  filePath?: string;
  sourceCode?: string;
  githubUrl?: string;
  error?: string;
}

export interface ComponentSourceResponse {
  version: string;
  results: ComponentSourceResult[];
}

export interface ComponentStylesResult {
  component: string;
  filePath?: string;
  stylesCode?: string;
  githubUrl?: string;
  error?: string;
}

export interface ComponentStylesResponse {
  version: string;
  results: ComponentStylesResult[];
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
  heroui: {
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
export interface ThemeVariable {
  name: string;
  value: string;
  description?: string;
  category?: string;
}

export interface ThemeVariables {
  base: ThemeVariable[];
  semantic: ThemeVariable[];
  calculated: ThemeVariable[];
}

export interface OptimizedThemeData {
  theme: string;
  common: {
    base: ThemeVariable[];
    calculated: ThemeVariable[];
  };
  light: {
    semantic: ThemeVariable[];
  };
  dark: {
    semantic: ThemeVariable[];
  };
}

export interface ThemeSystemResponse {
  version: string;
  themes: Record<string, any>;
  sharedVariables: ThemeVariable[];
  animations: {
    timings: Array<{name: string; value: string; description?: string}>;
    presets: Array<{name: string; value: string; description?: string}>;
  };
  guides: Record<string, any>;
  requestedVersion?: string;
  actualVersion: string;
  latestVersion: string;
}

export interface ThemeVariablesResponse {
  themes?: OptimizedThemeData[];
  theme?: string;
  common?: {
    base: ThemeVariable[];
    calculated: ThemeVariable[];
  };
  light?: {
    semantic: ThemeVariable[];
  };
  dark?: {
    semantic: ThemeVariable[];
  };
  mode?: string;
  variables?: ThemeVariables;
  count?: number;
  version: string;
  latestVersion: string;
}

export interface ThemeColorsResponse {
  themes?: Array<{
    theme: string;
    light?: ThemeVariable[];
    dark?: ThemeVariable[];
    mode?: string;
    colors?: ThemeVariable[];
  }>;
  theme?: string;
  light?: ThemeVariable[];
  dark?: ThemeVariable[];
  mode?: string;
  colors?: ThemeVariable[];
  count?: number;
  version: string;
  latestVersion: string;
}

export interface ThemeAnimationsResponse {
  timings: Array<{name: string; value: string; description?: string}>;
  presets: Array<{name: string; value: string; description?: string}>;
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
