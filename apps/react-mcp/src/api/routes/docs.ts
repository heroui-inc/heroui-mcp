import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {getComponentService} from "../services/component";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

const docs = new Hono<HonoContext>();

// Get available documentation paths from v3.heroui.com/react/llms.txt
docs.get("/available", async (c) => {
  const endpoint = "list-docs";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    const componentService = await getComponentService(c.env);
    const docsData = await componentService.getDocsPaths();

    if (!docsData) {
      analytics.trackError({
        error: "Failed to fetch documentation list",
        errorEvent: AnalyticsErrorEvent.LIST_DOCS_ERROR,
        properties: {
          endpoint,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json({error: "Failed to fetch documentation list"}, 500);
    }

    const categories = docsData.categories;
    const total = docsData.paths.length;

    analytics.track({
      event: AnalyticsEvent.LIST_DOCS,
      properties: {
        endpoint,
        responseTime: Date.now() - startTime,
        categories: categories.length,
        total,
      },
    });

    return c.json({
      baseUrl: "https://v3.heroui.com",
      categories,
      total,
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.LIST_DOCS_ERROR,
      fallbackMessage: "Failed to fetch documentation list",
      properties: {
        endpoint,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Internal server error while fetching documentation list",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get specific documentation content
docs.get("/content", async (c) => {
  const endpoint = "get-docs-content";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  let path: string | undefined = undefined;

  try {
    // Fetch latest version for response
    const componentService = await getComponentService(c.env);
    const version = (await componentService.getLatestVersion("heroui-react")) || "latest";

    path = c.req.query("path");

    if (!path) {
      analytics.trackError({
        error: "Missing required query parameter: path",
        errorEvent: AnalyticsErrorEvent.GET_DOCS_CONTENT_ERROR,
        properties: {
          endpoint,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {
          error: "Missing required query parameter: path",
        },
        400,
      );
    }

    // Transform all React docs paths: /docs/* -> /docs/react/*
    // This ensures backward compatibility while supporting the new URL structure
    // All HeroUI React documentation has been moved under /docs/react/
    // Note: handbook paths redirect to getting-started, so handle that transformation too
    let transformedPath = path;
    if (path.startsWith("/docs/") && !path.startsWith("/docs/react/")) {
      // Transform handbook paths to getting-started (handbook redirects to getting-started)
      if (path.startsWith("/docs/handbook/")) {
        transformedPath = path.replace("/docs/handbook/", "/docs/react/getting-started/");
      } else {
        transformedPath = path.replace("/docs/", "/docs/react/");
      }
    }

    // Construct the full URL for the documentation page
    let docUrl = transformedPath;

    // If path doesn't start with http, prepend the base URL
    if (!transformedPath.startsWith("http")) {
      // Remove leading slash if present
      const cleanPath = transformedPath.startsWith("/") ? transformedPath : `/${transformedPath}`;
      // Add .mdx extension if not present
      const pathWithExt =
        cleanPath.endsWith(".mdx") || cleanPath.endsWith(".md") ? cleanPath : `${cleanPath}.mdx`;
      docUrl = `https://v3.heroui.com${pathWithExt}`;
    }

    const response = await fetch(docUrl);

    if (!response.ok) {
      // Try without .mdx extension if it failed
      let finalStatus = response.status;
      let finalStatusText = response.statusText;
      let finalUrl = docUrl;

      if (docUrl.endsWith(".mdx")) {
        const urlWithoutExt = docUrl.replace(".mdx", "");
        const retryResponse = await fetch(urlWithoutExt);

        if (retryResponse.ok) {
          const content = await retryResponse.text();

          analytics.track({
            event: AnalyticsEvent.GET_DOCS_CONTENT,
            properties: {
              endpoint,
              path,
              url: urlWithoutExt,
              length: content.length,
              responseTime: Date.now() - startTime,
            },
          });

          return c.json({
            path,
            url: urlWithoutExt,
            content,
            contentType: retryResponse.headers.get("content-type") || "text/plain",
            version,
          });
        }

        // Use retry response status if retry was attempted
        finalStatus = retryResponse.status;
        finalStatusText = retryResponse.statusText;
        finalUrl = urlWithoutExt;
      }

      analytics.trackError({
        error: "Failed to fetch documentation from v3.heroui.com",
        errorEvent: AnalyticsErrorEvent.GET_DOCS_CONTENT_ERROR,
        properties: {
          endpoint,
          path,
          status: finalStatus,
          statusText: finalStatusText,
          url: finalUrl,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {
          error: `Documentation not found at path: ${path}`,
          status: finalStatus,
        },
        finalStatus as 400 | 401 | 403 | 404 | 500,
      );
    }

    const content = await response.text();
    const contentType = response.headers.get("content-type") || "text/plain";

    analytics.track({
      event: AnalyticsEvent.GET_DOCS_CONTENT,
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
      version,
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
      errorEvent: AnalyticsErrorEvent.GET_DOCS_CONTENT_ERROR,
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
