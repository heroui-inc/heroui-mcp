export enum AnalyticsEvent {
  // Auth
  AUTH_SUCCESS = "AUTH_SUCCESS",
  // Context
  GET_CTX = "GET_CTX",
  // Component
  LIST_COMPONENTS = "LIST_COMPONENTS",
  GET_COMPONENT_DOCS = "GET_COMPONENT_DOCS",
  // Docs
  GET_DOCS = "GET_DOCS",
  // Themes
  GET_THEME_VARIABLES = "GET_THEME_VARIABLES",
}

export enum AnalyticsErrorEvent {
  // Auth
  AUTH_FAILED = "AUTH_FAILED",
  AUTH_ERROR = "AUTH_ERROR",
  // Context
  GET_CTX_ERROR = "GET_CTX_ERROR",
  // Component
  LIST_COMPONENTS_ERROR = "LIST_COMPONENTS_ERROR",
  GET_COMPONENT_DOCS_ERROR = "GET_COMPONENT_DOCS_ERROR",
  // Docs
  GET_DOCS_ERROR = "GET_DOCS_ERROR",
  // Themes
  GET_THEME_VARIABLES_ERROR = "GET_THEME_VARIABLES_ERROR",
}

export interface AnalyticsProperties {
  endpoint: string;
  responseTime: number;
  [key: string]: unknown;
}
