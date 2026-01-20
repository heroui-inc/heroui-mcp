import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

const docs = new Hono<HonoContext>();

// Get specific documentation content
docs.get("*", async (c) => {
  const endpoint = "get-docs";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  // Extract path from c.req.path, removing the /v1/docs/ or /docs/ prefix from the base route
  // When mounted at /v1/docs, c.req.path includes the full path, so we need to strip the mount prefix
  const requestPath = c.req.path;
  let path: string;

  if (requestPath.startsWith("/v1/docs/")) {
    path = requestPath.slice(9); // Remove "/v1/docs/"
  } else if (requestPath === "/v1/docs") {
    path = ""; // Empty path when exactly "/v1/docs"
  } else if (requestPath.startsWith("/docs/")) {
    path = requestPath.slice(6); // Remove "/docs/"
  } else if (requestPath === "/docs") {
    path = ""; // Empty path when exactly "/docs"
  } else {
    path = requestPath.slice(1); // Remove leading "/"
  }

  // Check if path is empty or just whitespace
  if (!path || !path.trim()) {
    analytics.trackError({
      error: "Missing path parameter",
      errorEvent: AnalyticsErrorEvent.GET_DOCS_ERROR,
      properties: {
        endpoint,
        apiVersion: "v1",
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
      let errorBody: string | null = null;
      try {
        errorBody = await response.text();

        if (errorBody && errorBody.length > 300) {
          errorBody =
            errorBody.substring(0, 150) + "..." + errorBody.substring(errorBody.length - 150);
        }
      } catch {
        // Ignore if we can't read the body
      }

      analytics.trackError({
        error: new Error(`${response.status}: ${response.statusText}`),
        errorEvent: AnalyticsErrorEvent.GET_DOCS_ERROR,
        properties: {
          endpoint,
          apiVersion: "v1",
          path,
          url: docUrl,
          status: response.status,
          statusText: response.statusText,
          errorBody,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {
          error: `${response.status} ${response.statusText}`,
          status: response.status,
          statusText: response.statusText,
          url: docUrl,
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
        apiVersion: "v1",
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
    const docUrl = `https://v3.heroui.com${path}`;

    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_DOCS_ERROR,
      properties: {
        endpoint,
        apiVersion: "v1",
        path,
        url: docUrl,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        url: docUrl,
      },
      500,
    );
  }
});

export {docs};
