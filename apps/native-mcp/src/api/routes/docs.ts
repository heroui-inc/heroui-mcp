/**
 * Documentation endpoints
 * Note: Native docs are fetched from HeroUI v3 documentation site
 */

import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {CACHE_CONTROL} from "../constants";
import {getComponentService} from "../services/component";
import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

const docs = new Hono<HonoContext>();

// Get available documentation paths from v3.heroui.com/native/llms.txt
docs.get("/available", async (c) => {
  const endpoint = "list-docs-available";
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

    // Set cache headers
    c.header("Cache-Control", CACHE_CONTROL.VERSIONED);

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

// Helper function to transform old paths to new HeroUI v3 paths
function transformPath(path: string): string {
  // If already a HeroUI v3 path, return as-is
  if (path.startsWith("/docs/native/")) {
    return path;
  }

  // Map old component paths: /docs/components/{name} -> /docs/native/components/{name}
  if (path.startsWith("/docs/components/")) {
    const componentName = path.replace("/docs/components/", "");

    return `/docs/native/components/${componentName}`;
  }

  // Map old core paths to getting-started paths
  const corePathMap: Record<string, string> = {
    "/docs/core/provider": "/docs/native/getting-started/provider",
    "/docs/core/theming": "/docs/native/getting-started/theming",
    "/docs/core/custom-fonts": "/docs/native/getting-started/theming", // Custom fonts is part of theming
  };

  if (corePathMap[path]) {
    return corePathMap[path];
  }

  // Map changelog to releases
  if (path === "/docs/changelog") {
    return "/docs/native/releases";
  }

  // If path starts with /docs/ but doesn't match above, assume it's a native path
  if (path.startsWith("/docs/")) {
    return `/docs/native${path.replace("/docs", "")}`;
  }

  // Default: prepend /docs/native/
  return `/docs/native${path.startsWith("/") ? path : `/${path}`}`;
}

// Get documentation content from v3.heroui.com
docs.get("/content", async (c) => {
  const endpoint = "get-docs-content";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  let path: string | undefined = undefined;

  try {
    // Fetch latest version for response
    const componentService = await getComponentService(c.env);
    const version = (await componentService.getLatestVersion("heroui-native")) || "latest";

    path = c.req.query("path");

    if (!path) {
      analytics.trackError({
        error: "Invalid request",
        errorEvent: AnalyticsErrorEvent.GET_DOCS_CONTENT_ERROR,
        properties: {
          responseTime: Date.now() - startTime,
          endpoint,
        },
      });

      return c.json(
        {
          error: "Invalid request",
          details: "path query parameter is required",
        },
        400,
      );
    }

    // Transform old paths to new HeroUI v3 paths
    const transformedPath = transformPath(path);

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

          c.header("Cache-Control", CACHE_CONTROL.VERSIONED);

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

    // Set cache headers
    c.header("Cache-Control", CACHE_CONTROL.VERSIONED);

    return c.json({
      path,
      url: docUrl,
      version,
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
