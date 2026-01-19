import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {getComponentService} from "../services/component";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";
import {getApp} from "../utils/get-client";

const ctx = new Hono<HonoContext>();

// Get initialization context (components, docs paths)
ctx.get("/", async (c) => {
  const endpoint = "get-ctx";
  const startTime = Date.now();
  const analytics = c.get("analytics");
  const app = getApp(c);

  try {
    const componentService = await getComponentService(c.env);
    const ctxData = await componentService.getContext();

    if (!ctxData) {
      return c.json(
        {
          error: "Context data not available",
        },
        503,
      );
    }

    analytics.track({
      event: AnalyticsEvent.GET_CTX,
      properties: {
        endpoint,
        apiVersion: "v1",
        app,
        componentsCount: ctxData.components.length,
        docPathsCount: ctxData.docs.paths.length,
        version: ctxData.version,
        responseTime: Date.now() - startTime,
      },
    });

    const response: Record<string, unknown> = {
      components: ctxData.components,
      docs: {
        paths: ctxData.docs.paths,
        categories: ctxData.docs.categories,
      },
      version: ctxData.version,
      timestamp: ctxData.timestamp,
    };

    // Add user ID if authenticated (from auth middleware)
    const userId = c.get("userId");
    if (userId) {
      response.userId = userId;
    }

    return c.json(response);
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_CTX_ERROR,
      fallbackMessage: "Failed to get initialization context",
      properties: {
        endpoint,
        apiVersion: "v1",
        app,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Failed to get initialization context",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export {ctx};
