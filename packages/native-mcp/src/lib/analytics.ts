import {PostHog} from "posthog-node";

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

interface AnalyticsConfig {
  apiKey: string;
  host: string;
  environment: string;
}

interface EventProperties {
  [key: string]:
    | string
    | number
    | boolean
    | undefined
    | null
    | EventProperties
    | EventProperties[]
    | unknown;
}

class Analytics {
  private client: PostHog | null = null;
  private environment: string;
  private sessionId: string | null = null;

  constructor(config: AnalyticsConfig | null) {
    if (!config || !config.apiKey) {
      console.warn("Analytics: No API key provided, analytics disabled");
      this.environment = "development";

      return;
    }

    this.environment = config.environment;

    // Only initialize in production
    if (config.environment === "production") {
      this.client = new PostHog(config.apiKey, {
        host: config.host,
      });
    } else {
      console.info(
        `Analytics: Running in ${config.environment} mode, events will be logged but not sent`,
      );
    }
  }

  private getBaseProperties(): EventProperties {
    return {
      environment: this.environment,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };
  }

  private async track(
    event: AnalyticsEvent,
    properties: EventProperties = {},
    distinctId?: string,
  ) {
    const enrichedProperties = {
      ...this.getBaseProperties(),
      ...properties,
      project: "react",
    };

    // Always log in non-production for debugging (but not in tests)
    const isTestMode = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
    if (this.environment !== "production" && !isTestMode) {
      console.log("[Analytics Event]", {
        event,
        distinctId: distinctId || "anonymous",
        properties: enrichedProperties,
      });

      return;
    }

    // Skip tracking entirely in test mode
    if (isTestMode) {
      return;
    }

    // Send to PostHog in production
    if (this.client) {
      this.client.capture({
        distinctId: distinctId || "anonymous",
        event,
        properties: enrichedProperties,
      });

      await this.client.shutdown();
    }
  }

  // Session Management
  startSession(distinctId: string, properties?: EventProperties) {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.track(
      AnalyticsEvent.SESSION_START,
      {
        ...properties,
        sessionId: this.sessionId,
      },
      distinctId,
    );
  }

  endSession(distinctId: string, properties?: EventProperties) {
    if (this.sessionId) {
      this.track(
        AnalyticsEvent.SESSION_END,
        {
          ...properties,
          sessionId: this.sessionId,
          sessionDuration: properties?.duration,
        },
        distinctId,
      );
      this.sessionId = null;
    }
  }

  // MCP Request Tracking
  trackMcpRequest(
    distinctId: string,
    properties: {
      method: string;
      toolName?: string;
      requestSize?: number;
    },
  ) {
    this.track(AnalyticsEvent.MCP_REQUEST, properties, distinctId);
  }

  trackMcpSuccess(
    distinctId: string,
    properties: {
      method: string;
      toolName?: string;
      responseTime: number;
      responseSize?: number;
    },
  ) {
    this.track(AnalyticsEvent.MCP_REQUEST_SUCCESS, properties, distinctId);
  }

  trackMcpError(
    distinctId: string,
    properties: {
      method: string;
      toolName?: string;
      error: string;
      errorCode?: string;
      responseTime?: number;
    },
  ) {
    this.track(AnalyticsEvent.MCP_REQUEST_ERROR, properties, distinctId);
  }

  // Tool Usage Tracking
  trackToolInvocation(
    distinctId: string,
    properties: {
      toolName: string;
      parameters?: unknown;
      context?: string;
    },
  ) {
    this.track(AnalyticsEvent.TOOL_INVOKED, properties, distinctId);
  }

  trackToolSuccess(
    distinctId: string,
    properties: {
      toolName: string;
      executionTime: number;
      resultSize?: number;
    },
  ) {
    this.track(AnalyticsEvent.TOOL_SUCCESS, properties, distinctId);
  }

  trackToolError(
    distinctId: string,
    properties: {
      toolName: string;
      error: string;
      executionTime?: number;
    },
  ) {
    this.track(AnalyticsEvent.TOOL_ERROR, properties, distinctId);
  }

  // Component Tracking
  trackComponentGenerated(
    distinctId: string,
    properties: {
      componentType: string;
      framework: string;
      features?: string[];
      generationTime: number;
    },
  ) {
    this.track(AnalyticsEvent.COMPONENT_GENERATED, properties, distinctId);
  }

  trackComponentSearch(
    distinctId: string,
    properties: {
      query?: string;
      filters?: Record<string, unknown>;
      resultsCount: number;
      searchTime: number;
    },
  ) {
    this.track(AnalyticsEvent.COMPONENT_SEARCH, properties, distinctId);
  }

  // Performance Tracking
  trackResponseTime(
    distinctId: string,
    properties: {
      operation: string;
      duration: number;
      success: boolean;
    },
  ) {
    this.track(AnalyticsEvent.RESPONSE_TIME, properties, distinctId);
  }

  trackStreamPerformance(
    distinctId: string,
    properties: {
      streamId: string;
      chunks: number;
      totalBytes: number;
      duration: number;
      completed: boolean;
    },
  ) {
    const event = properties.completed
      ? AnalyticsEvent.STREAM_COMPLETED
      : AnalyticsEvent.STREAM_STARTED;
    this.track(event, properties, distinctId);
  }

  // Feature Usage
  trackFeatureUsage(distinctId: string, feature: string, properties?: EventProperties) {
    this.track(
      AnalyticsEvent.FEATURE_USED,
      {
        feature,
        ...properties,
      },
      distinctId,
    );
  }

  // Cleanup
  async flush() {
    if (this.client && this.environment === "production") {
      await this.client.flush();
    }
  }

  async shutdown() {
    if (this.client && this.environment === "production") {
      await this.client.shutdown();
    }
  }
}

// Singleton instance
let analyticsInstance: Analytics | null = null;

export function initializeAnalytics(config: AnalyticsConfig | null): Analytics {
  if (!analyticsInstance) {
    analyticsInstance = new Analytics(config);
  }

  return analyticsInstance;
}

export function getAnalytics(): Analytics | null {
  return analyticsInstance;
}
