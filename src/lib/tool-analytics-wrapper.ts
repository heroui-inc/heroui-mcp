import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {getAnalytics} from "../lib/analytics.js";
import {ErrorCode, ErrorMessages, MCPError} from "../lib/error-handler.js";

/**
 * Get helpful suggestion based on tool and error
 */
function getToolErrorSuggestion(toolName: string, errorMessage: string): string {
  const lowerError = errorMessage.toLowerCase();

  if (lowerError.includes("network") || lowerError.includes("timeout")) {
    return "Network issue detected. Please check your connection and try again.";
  }

  if (lowerError.includes("version")) {
    return 'Version issue detected. Try using "latest" or check available versions with check_version tool.';
  }

  switch (toolName) {
    case "list_components":
      return "Try specifying a different library (heroui or native) or version.";
    case "get_component_props":
    case "get_component_example":
      return "Use list_components to see available components first.";
    case "check_version":
      return "Valid packages are: heroui, native, or mcp.";
    default:
      return "Please try again. If the issue persists, contact support@heroui.com";
  }
}

/**
 * Wraps tool execution with analytics tracking
 */
export function wrapWithAnalytics<T>(
  server: McpServer,
  toolName: string,
  originalHandler: (params: T) => Promise<unknown>,
) {
  return async (params: T) => {
    const startTime = Date.now();
    const analytics = getAnalytics();

    // Extract session ID from transport if available
    const transport = (server as Record<string, unknown>).transport as
      | {sessionId?: string}
      | undefined;
    const sessionId = transport?.sessionId || "unknown";

    // Track tool invocation
    if (analytics) {
      analytics.trackToolInvocation(sessionId, {
        toolName,
        parameters: params,
        context: "mcp_tool_call",
      });
    }

    try {
      const result = await originalHandler(params);
      const executionTime = Date.now() - startTime;

      // Track tool success
      if (analytics) {
        analytics.trackToolSuccess(sessionId, {
          toolName,
          executionTime,
          resultSize: JSON.stringify(result).length,
        });

        // Track specific tool events
        switch (toolName) {
          case "get_component_example":
          case "get_component_props": {
            const {library, component} = params as {
              library: string;
              component: string;
              version?: string;
            };
            analytics.trackComponentGenerated(sessionId, {
              componentType: component,
              framework: library,
              features: [],
              generationTime: executionTime,
            });
            break;
          }

          case "list_components": {
            const componentList =
              (result as {content?: Array<{text?: string}>}).content?.[0]?.text || "";
            const matches = componentList.match(/Total: (\d+) components/);
            const count = matches ? parseInt(matches[1]) : 0;
            analytics.trackComponentSearch(sessionId, {
              query: "",
              filters: {library: (params as {library?: string})?.library},
              resultsCount: count,
              searchTime: executionTime,
            });
            break;
          }

          case "check_version": {
            analytics.trackFeatureUsage(sessionId, "version_check", {
              package: (params as {package?: string})?.package,
              executionTime,
            });
            break;
          }
        }

        // Track general performance
        analytics.trackResponseTime(sessionId, {
          operation: `tool_${toolName}`,
          duration: executionTime,
          success: true,
        });
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Track tool error
      if (analytics) {
        analytics.trackToolError(sessionId, {
          toolName,
          error: error instanceof Error ? error.message : "Unknown error",
          executionTime,
        });

        analytics.trackResponseTime(sessionId, {
          operation: `tool_${toolName}`,
          duration: executionTime,
          success: false,
        });
      }

      // Convert to user-friendly error if not already an MCPError
      if (error instanceof MCPError) {
        throw error;
      }

      // Create appropriate error based on tool and error type
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Check if it's a component not found error
      if (
        errorMessage.includes("not found") &&
        (toolName === "get_component_props" || toolName === "get_component_example")
      ) {
        const componentName = (params as {component?: string})?.component || "unknown";
        const library = (params as {library?: string})?.library || "unknown";
        throw new MCPError(
          ErrorMessages[ErrorCode.COMPONENT_NOT_FOUND]({
            component: componentName,
            library,
          }),
        );
      }

      // Tool-specific error
      throw new MCPError(
        ErrorMessages[ErrorCode.TOOL_EXECUTION_ERROR]({
          tool: toolName,
          error: errorMessage,
          suggestion: getToolErrorSuggestion(toolName, errorMessage),
        }),
      );
    }
  };
}
