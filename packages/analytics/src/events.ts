export enum AnalyticsEvent {
  // MCP Request Events
  MCP_REQUEST = "mcp_request",
  MCP_REQUEST_SUCCESS = "mcp_request_success",
  MCP_REQUEST_ERROR = "mcp_request_error",

  // Tool Usage Events
  TOOL_INVOKED = "tool_invoked",
  TOOL_SUCCESS = "tool_success",
  TOOL_ERROR = "tool_error",

  // Component Events
  COMPONENT_GENERATED = "component_generated",
  COMPONENT_SEARCH = "component_search",
  COMPONENT_LIST = "component_list",

  // Performance Events
  RESPONSE_TIME = "response_time",
  STREAM_STARTED = "stream_started",
  STREAM_COMPLETED = "stream_completed",

  // User Behavior Events
  SESSION_START = "session_start",
  SESSION_END = "session_end",
  FEATURE_USED = "feature_used",
}
