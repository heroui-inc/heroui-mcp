import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";
import {getClient} from "../utils/get-client";

const docs = new Hono<HonoContext>();

// Get specific documentation content
docs.get("*", async (c) => {
  const endpoint = "get-docs";
  const startTime = Date.now();
  const analytics = c.get("analytics");
  const client = getClient(c);

  // Get the path from the request URL (everything after /docs/)
  const requestPath = c.req.path;
  let path = requestPath.startsWith("/docs/") ? requestPath.slice(6) : requestPath.slice(1);

  if (!path) {
    analytics.trackError({
      error: "Missing path parameter",
      errorEvent: AnalyticsErrorEvent.GET_DOCS_ERROR,
      properties: {
        endpoint,
        client,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Missing required path parameter",
      },
      400,
    );
  }

  try {
    path = `/docs/${path}.mdx`;

    const docUrl = `https://v3.heroui.com${path}`;

    const response = await fetch(docUrl);

    if (!response.ok) {
      analytics.trackError({
        error: `Failed to fetch documentation: ${path}`,
        errorEvent: AnalyticsErrorEvent.GET_DOCS_ERROR,
        properties: {
          endpoint,
          client,
          path,
          status: response.status,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {
          error: `Documentation not found at path: ${path}`,
          status: response.status,
        },
        response.status as 400 | 404 | 500,
      );
    }

    const content = await response.text();
    const contentType = response.headers.get("content-type") || "text/plain";

    analytics.track({
      event: AnalyticsEvent.GET_DOCS,
      properties: {
        endpoint,
        client,
        path,
        url: docUrl,
        length: content.length,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json({
      path,
      url: docUrl,
      content,
      contentType,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isNetworkError =
      errorMessage.includes("fetch") ||
      errorMessage.includes("network") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("ENOTFOUND");

    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_DOCS_ERROR,
      fallbackMessage: "Failed to fetch documentation content",
      properties: {
        endpoint,
        client,
        path,
        responseTime: Date.now() - startTime,
        isNetworkError,
      },
    });

    if (isNetworkError) {
      return c.json(
        {
          error: "Network error while fetching documentation content",
          details: errorMessage,
          path,
        },
        500,
      );
    }

    return c.json(
      {
        error: "Internal server error while fetching documentation content",
        details: errorMessage,
        path,
      },
      500,
    );
  }
});

export {docs};
