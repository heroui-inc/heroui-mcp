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
