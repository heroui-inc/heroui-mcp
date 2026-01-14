import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

const docs = new Hono<HonoContext>();

// Get specific documentation content
docs.get("*", async (c) => {
  const endpoint = "get-docs";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  // Extract path from c.req.path, removing the /docs/ prefix from the base route
  let path = c.req.path.replace(/^\/docs\//, "");

  if (!path) {
    analytics.trackError({
      error: "Missing path parameter",
      errorEvent: AnalyticsErrorEvent.GET_DOCS_ERROR,
      properties: {
        endpoint,
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
    // Path param from route /docs/* is like "native/getting-started/theming"
    // Add /docs/ prefix and .mdx extension
    path = `/docs/${path}.mdx`;

    const docUrl = `https://v3.heroui.com${path}`;

    const response = await fetch(docUrl);

    if (!response.ok) {
      analytics.trackError({
        error: `Failed to fetch documentation: ${path}`,
        errorEvent: AnalyticsErrorEvent.GET_DOCS_ERROR,
        properties: {
          endpoint,
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
