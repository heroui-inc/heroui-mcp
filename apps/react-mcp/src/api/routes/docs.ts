import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";
import {getApp} from "../utils/get-client";

const docs = new Hono<HonoContext>();

// Get specific documentation content
docs.get("*", async (c) => {
  const endpoint = "get-docs";
  const startTime = Date.now();
  const analytics = c.get("analytics");
  const app = getApp(c);

  const requestPath = c.req.path;
  let path: string;

  if (requestPath.startsWith("/v1/docs/")) {
    path = requestPath.slice(9); // Remove "/v1/docs/"
  } else if (requestPath.startsWith("/docs/")) {
    path = requestPath.slice(6); // Remove "/docs/"
  } else {
    path = requestPath.slice(1); // Remove leading "/"
  }

  if (!path) {
    analytics.trackError({
      error: "Missing path parameter",
      errorEvent: AnalyticsErrorEvent.GET_DOCS_ERROR,
      properties: {
        endpoint,
        apiVersion: "v1",
        app,
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
    let transformedPath = path;
    if (!path.startsWith("react/") && !path.startsWith("/react/")) {
      transformedPath = `react/${path}`;
    }

    path = `/docs/${transformedPath}.mdx`;

    const docUrl = `https://heroui.com${path}`;

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
          app,
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
        app,
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
    const docUrl = `https://heroui.com${path}`;

    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_DOCS_ERROR,
      properties: {
        endpoint,
        apiVersion: "v1",
        app,
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
