import {getAnalytics} from "./analytics";

export enum ErrorCode {
  // Data errors
  DATA_NOT_AVAILABLE = "DATA_NOT_AVAILABLE",
  R2_CONNECTION_ERROR = "R2_CONNECTION_ERROR",
  COMPONENT_NOT_FOUND = "COMPONENT_NOT_FOUND",

  // Request errors
  INVALID_REQUEST = "INVALID_REQUEST",
  INVALID_SESSION = "INVALID_SESSION",
  MALFORMED_JSON = "MALFORMED_JSON",

  // Server errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  INITIALIZATION_ERROR = "INITIALIZATION_ERROR",

  // Tool errors
  TOOL_EXECUTION_ERROR = "TOOL_EXECUTION_ERROR",
  TOOL_NOT_FOUND = "TOOL_NOT_FOUND",
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  userMessage: string;
  statusCode: number;
  metadata?: Record<string, unknown>;
}

export class MCPError extends Error {
  public code: ErrorCode;
  public userMessage: string;
  public statusCode: number;
  public metadata?: Record<string, unknown>;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = "MCPError";
    this.code = details.code;
    this.userMessage = details.userMessage;
    this.statusCode = details.statusCode;
    this.metadata = details.metadata;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.userMessage,
        details: this.metadata,
      },
    };
  }
}

export const ErrorMessages: Record<
  ErrorCode,
  (metadata?: Record<string, unknown>) => ErrorDetails
> = {
  [ErrorCode.DATA_NOT_AVAILABLE]: (metadata) => ({
    code: ErrorCode.DATA_NOT_AVAILABLE,
    message: `Data not available: ${metadata?.details || "R2 bucket may be empty"}`,
    userMessage:
      "Component data is currently being updated. Please try again in a few moments. If the issue persists, contact support@heroui.com",
    statusCode: 503,
    metadata,
  }),

  [ErrorCode.R2_CONNECTION_ERROR]: (metadata) => ({
    code: ErrorCode.R2_CONNECTION_ERROR,
    message: `R2 connection error: ${metadata?.error || "Unknown"}`,
    userMessage:
      "Unable to connect to the component database. Please try again later or contact support@heroui.com",
    statusCode: 503,
    metadata,
  }),

  [ErrorCode.COMPONENT_NOT_FOUND]: (metadata) => ({
    code: ErrorCode.COMPONENT_NOT_FOUND,
    message: `Component not found: ${metadata?.component}`,
    userMessage: `Component "${metadata?.component}" not found in ${metadata?.library}. Use list_components to see available components.`,
    statusCode: 404,
    metadata,
  }),

  [ErrorCode.INVALID_REQUEST]: (metadata) => ({
    code: ErrorCode.INVALID_REQUEST,
    message: `Invalid request: ${metadata?.details || "Malformed request"}`,
    userMessage: "Invalid request format. Please ensure you're using a compatible MCP client.",
    statusCode: 400,
    metadata,
  }),

  [ErrorCode.INVALID_SESSION]: (metadata) => ({
    code: ErrorCode.INVALID_SESSION,
    message: `Invalid session: ${metadata?.sessionId || "No session"}`,
    userMessage: "Session expired or invalid. Please reconnect to the MCP server.",
    statusCode: 401,
    metadata,
  }),

  [ErrorCode.MALFORMED_JSON]: (metadata) => ({
    code: ErrorCode.MALFORMED_JSON,
    message: `Malformed JSON: ${metadata?.error || "Parse error"}`,
    userMessage: "Invalid JSON in request. Please check your MCP client configuration.",
    statusCode: 400,
    metadata,
  }),

  [ErrorCode.INTERNAL_ERROR]: (metadata) => ({
    code: ErrorCode.INTERNAL_ERROR,
    message: `Internal error: ${metadata?.error || "Unknown"}`,
    userMessage:
      "An unexpected error occurred. Please try again or contact support@heroui.com with error code: " +
      (metadata?.errorId || "UNKNOWN"),
    statusCode: 500,
    metadata,
  }),

  [ErrorCode.SERVICE_UNAVAILABLE]: (metadata) => ({
    code: ErrorCode.SERVICE_UNAVAILABLE,
    message: `Service unavailable: ${metadata?.service || "MCP"}`,
    userMessage: "The MCP service is temporarily unavailable. Please try again in a few moments.",
    statusCode: 503,
    metadata,
  }),

  [ErrorCode.INITIALIZATION_ERROR]: (metadata) => ({
    code: ErrorCode.INITIALIZATION_ERROR,
    message: `Initialization error: ${metadata?.error || "Failed to initialize"}`,
    userMessage: "Failed to initialize MCP server. Please reconnect or contact support@heroui.com",
    statusCode: 500,
    metadata,
  }),

  [ErrorCode.TOOL_EXECUTION_ERROR]: (metadata) => ({
    code: ErrorCode.TOOL_EXECUTION_ERROR,
    message: `Tool execution error: ${metadata?.tool} - ${metadata?.error}`,
    userMessage: `Error executing tool "${metadata?.tool}". ${metadata?.suggestion || "Please try again or contact support@heroui.com"}`,
    statusCode: 500,
    metadata,
  }),

  [ErrorCode.TOOL_NOT_FOUND]: (metadata) => ({
    code: ErrorCode.TOOL_NOT_FOUND,
    message: `Tool not found: ${metadata?.tool}`,
    userMessage: `Tool "${metadata?.tool}" not found. Available tools: list_components, get_component_info, get_component_props, get_component_examples, get_component_source, get_theme_info`,
    statusCode: 404,
    metadata,
  }),
};

export function handleError(
  error: unknown,
  context?: {sessionId?: string; operation?: string},
): MCPError {
  // Generate error ID for tracking
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Track error in analytics
  const analytics = getAnalytics();
  if (analytics && context?.sessionId) {
    analytics.trackMcpError(context.sessionId, {
      method: context.operation || "unknown",
      error: error instanceof Error ? error.message : "Unknown error",
      errorCode: error instanceof MCPError ? error.code : ErrorCode.INTERNAL_ERROR,
    });
  }

  // If it's already an MCPError, add error ID and return
  if (error instanceof MCPError) {
    error.metadata = {...error.metadata, errorId};

    return error;
  }

  // Check for specific error patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // R2 or data related errors
    if (message.includes("r2") || message.includes("bucket") || message.includes("s3")) {
      return new MCPError(
        ErrorMessages[ErrorCode.R2_CONNECTION_ERROR]({
          error: error.message,
          errorId,
        }),
      );
    }

    // JSON parsing errors
    if (
      message.includes("json") ||
      message.includes("unexpected end") ||
      message.includes("unexpected token")
    ) {
      return new MCPError(
        ErrorMessages[ErrorCode.MALFORMED_JSON]({
          error: error.message,
          errorId,
        }),
      );
    }

    // Network errors
    if (message.includes("fetch") || message.includes("network") || message.includes("timeout")) {
      return new MCPError(
        ErrorMessages[ErrorCode.SERVICE_UNAVAILABLE]({
          error: error.message,
          errorId,
        }),
      );
    }

    // Data not found
    if (message.includes("not found") || message.includes("does not exist")) {
      return new MCPError(
        ErrorMessages[ErrorCode.DATA_NOT_AVAILABLE]({
          error: error.message,
          errorId,
        }),
      );
    }
  }

  // Default to internal error
  return new MCPError(
    ErrorMessages[ErrorCode.INTERNAL_ERROR]({
      error: error instanceof Error ? error.message : "Unknown error",
      errorId,
    }),
  );
}

export function createErrorResponse(error: MCPError, requestId?: string | null) {
  return {
    jsonrpc: "2.0",
    error: {
      code: -32000, // MCP error code
      message: error.userMessage,
      data: {
        errorCode: error.code,
        errorId: error.metadata?.errorId,
        details: error.metadata,
      },
    },
    id: requestId || null,
  };
}
