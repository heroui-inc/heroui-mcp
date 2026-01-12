import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

const docs = new Hono<HonoContext>();

// Get specific documentation content
docs.get("/:path(*)", async (c) => {
  const endpoint = "get-docs";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  let path = c.req.param("path");

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
    // Ensure path starts with /docs/react/
    if (!path.startsWith("/docs/react/")) {
      // Transform paths if needed
      if (path.startsWith("/docs/")) {
        // Transform handbook paths to getting-started
        if (path.startsWith("/docs/handbook/")) {
          path = path.replace("/docs/handbook/", "/docs/react/getting-started/");
        } else {
          path = path.replace("/docs/", "/docs/react/");
        }
      } else {
        // Add /docs/react/ prefix if missing
        path = `/docs/react/${path}`;
      }
    }

    // Add .mdx extension if not present
    if (!path.endsWith(".mdx") && !path.endsWith(".md")) {
      path = `${path}.mdx`;
    }

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
