import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {AnalyticsErrorEvent, AnalyticsEvent} from "../types/analytics";

const docs = new Hono<HonoContext>();

// Types for documentation structure
interface DocSection {
  title: string;
  path: string;
  description: string;
}

interface DocCategory {
  name: string;
  docs: DocSection[];
}

// Get available documentation paths from v3.heroui.com
docs.get("/available", async (c) => {
  const endpoint = "list-docs";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    // Fetch the llms.txt file from HeroUI v3 docs
    const response = await fetch("https://v3.heroui.com/llms.txt");

    if (!response.ok) {
      analytics.trackError({
        error: "Failed to fetch documentation list",
        errorEvent: AnalyticsErrorEvent.LIST_DOCS_ERROR,
        properties: {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          url: "https://v3.heroui.com/llms.txt",
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {
          error: "Failed to fetch documentation list",
          status: response.status,
        },
        response.status as 400 | 401 | 403 | 404 | 500,
      );
    }

    const content = await response.text();

    // Parse the content to extract documentation structure
    const categories: DocCategory[] = [];
    let currentCategory: DocCategory | null = null;

    const lines = content.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines and main headers
      if (!trimmedLine || trimmedLine === "# Docs") continue;

      // Category header (starts with ##)
      if (trimmedLine.startsWith("## ")) {
        const categoryName = trimmedLine.substring(3).trim();
        currentCategory = {
          name: categoryName,
          docs: [],
        };
        categories.push(currentCategory);
      }
      // Documentation entry (starts with -)
      else if (trimmedLine.startsWith("- ") && currentCategory) {
        // Parse format: - [Title](path): Description
        const match = trimmedLine.match(/^- \[([^\]]+)\]\(([^)]+)\)(?:\s*:\s*(.+))?$/);
        if (match) {
          const [, title, path, description = ""] = match;
          currentCategory.docs.push({
            title,
            path,
            description,
          });
        }
      }
    }

    const total = categories.reduce((acc, cat) => acc + cat.docs.length, 0);

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
    path = c.req.query("path");

    if (!path) {
      analytics.trackError({
        error: "Invalid request",
        errorEvent: AnalyticsErrorEvent.GET_DOCS_CONTENT_ERROR,
        properties: {
          endpoint,
          responseTime: Date.now() - startTime,
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

    // Construct the full URL for the documentation page
    let docUrl = path;

    // If path doesn't start with http, prepend the base URL
    if (!path.startsWith("http")) {
      // Remove leading slash if present
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      // Add .mdx extension if not present
      const pathWithExt =
        cleanPath.endsWith(".mdx") || cleanPath.endsWith(".md") ? cleanPath : `${cleanPath}.mdx`;
      docUrl = `https://v3.heroui.com${pathWithExt}`;
    }

    const response = await fetch(docUrl);

    if (!response.ok) {
      // Try without .mdx extension if it failed
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
          });
        }
      }

      analytics.trackError({
        error: "Failed to fetch documentation from v3.heroui.com",
        errorEvent: AnalyticsErrorEvent.GET_DOCS_CONTENT_ERROR,
        properties: {
          endpoint,
          path,
          status: response.status,
          statusText: response.statusText,
          url: docUrl,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {
          error: `Documentation not found at path: ${path}`,
          status: response.status,
        },
        response.status as 400 | 401 | 403 | 404 | 500,
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
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_DOCS_CONTENT_ERROR,
      fallbackMessage: "Failed to fetch documentation content",
      properties: {
        endpoint,
        path,
        responseTime: Date.now() - startTime,
      },
    });

    return c.json(
      {
        error: "Internal server error while fetching documentation content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export {docs};
