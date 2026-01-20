import type {AuthWorkerResponse} from "../types/auth";
import type {HonoContext} from "../types/context";
import type {Context, Next} from "hono";

import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

/**
 * Hybrid auth middleware for all environments
 * - Local dev: HTTP to localhost:8789
 * - Staging/Production: Service binding to api
 *
 * Uses analytics service from context (set by analytics middleware)
 */
export const authMiddleware = async (c: Context<HonoContext>, next: Next) => {
  const apiKey = c.req.header("X-API-Key");

  if (!apiKey) {
    return next();
  }

  const serviceToken = c.env.SERVICE_AUTH_TOKEN;

  if (!serviceToken) {
    console.warn("[Auth] SERVICE_AUTH_TOKEN not configured - skipping validation");

    return next();
  }

  const startTime = Date.now();
  const analytics = c.get("analytics");
  const apiVersion = c.req.path.startsWith("/v1/") ? "v1" : "legacy";

  try {
    // Determine environment and connection method
    const isDevelopment = c.env.NODE_ENV === "development";
    const platformApi = c.env.PLATFORM_API;

    let response;

    if (isDevelopment) {
      // Local development: HTTP to localhost
      response = await fetch("http://localhost:8789/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Service-Auth-Token": serviceToken,
        },
        body: JSON.stringify({apiKey}),
      });
    } else if (platformApi) {
      // Production: Service binding
      response = await platformApi.fetch("https://api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Service-Auth-Token": serviceToken,
        },
        body: JSON.stringify({apiKey}),
      });
    } else {
      console.warn("[Auth] No auth service available");

      return next();
    }

    const result = (await response.json()) as AuthWorkerResponse;

    if (!result.success) {
      console.error(`[Auth] Failed: ${result.error.code} - ${result.error.message}`);

      // Track auth failure
      analytics.track({
        event: AnalyticsErrorEvent.AUTH_FAILED,
        properties: {
          endpoint: "auth",
          apiVersion,
          responseTime: Date.now() - startTime,
          errorCode: result.error.code,
          errorMessage: result.error.message,
        },
      });

      return c.json(
        {
          error: result.error.code,
          message: result.error.message,
        },
        response.status as 401 | 403 | 500,
      );
    }

    // Set user ID in context for downstream middleware/handlers
    c.set("userId", result.data.user.id);

    // Update analytics distinctId with authenticated user
    analytics.distinctId = result.data.user.id;

    // Track successful auth
    analytics.track({
      event: AnalyticsEvent.AUTH_SUCCESS,
      properties: {
        endpoint: "auth",
        apiVersion,
        responseTime: Date.now() - startTime,
        apiKeyId: result.data.apiKeyId,
        apiKeyName: result.data.apiKey.name,
      },
    });

    return next();
  } catch (error) {
    console.error("[Auth] Error:", error instanceof Error ? error.message : String(error));

    // Track auth error
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.AUTH_ERROR,
      fallbackMessage: "Authentication service unavailable",
      properties: {
        endpoint: "auth",
        apiVersion,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: "Authentication service unavailable",
      },
      500,
    );
  }
};
