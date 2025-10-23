/**
 * Documentation endpoints
 * Note: Native docs are fetched from GitHub markdown files
 */

import type {HonoContext} from "../types/context";

import {Hono} from "hono";

import {CACHE_CONTROL} from "../constants";
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

// Get available documentation paths from GitHub README
// Only extracts links from ### sections within ## Documentation and ## Changelog
docs.get("/available", async (c) => {
  const endpoint = "list-docs-available";
  const startTime = Date.now();
  const analytics = c.get("analytics");

  try {
    // Fetch README.md from heroui-native repository
    const branch = "alpha";
    const readmeUrl = `https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/${branch}/README.md`;
    const response = await fetch(readmeUrl);

    if (!response.ok) {
      analytics.trackError({
        error: "Failed to fetch documentation list",
        errorEvent: AnalyticsErrorEvent.LIST_DOCS_ERROR,
        properties: {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          url: readmeUrl,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {
          error: "Failed to fetch documentation list",
          status: response.status,
        },
        404,
      );
    }

    const content = await response.text();

    // Parse the README to extract documentation structure
    const categories: DocCategory[] = [];
    let currentCategory: DocCategory | null = null;

    const lines = content.split("\n");
    let inDocumentationSection = false;
    let inChangelogSection = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Track when we enter the Documentation section
      if (trimmedLine === "## Documentation") {
        inDocumentationSection = true;
        inChangelogSection = false;
        continue;
      }

      // Track when we enter the Changelog section
      if (trimmedLine === "## Changelog") {
        inDocumentationSection = false;
        inChangelogSection = true;
        // Add changelog link as its own category
        categories.push({
          name: "Changelog",
          docs: [
            {
              title: "Changelog",
              path: "/docs/changelog",
              description: "History of changes to HeroUI Native",
            },
          ],
        });
        continue;
      }

      // Exit both sections when we hit another ## heading
      if (
        trimmedLine.startsWith("## ") &&
        trimmedLine !== "## Documentation" &&
        trimmedLine !== "## Changelog"
      ) {
        inDocumentationSection = false;
        inChangelogSection = false;
        continue;
      }

      // Only process ### sections within Documentation or Changelog
      if (!inDocumentationSection && !inChangelogSection) {
        continue;
      }

      // Category header (starts with ###) - only within allowed sections
      if (trimmedLine.startsWith("### ")) {
        const categoryName = trimmedLine.substring(4).trim();
        currentCategory = {
          name: categoryName,
          docs: [],
        };
        categories.push(currentCategory);
      }
      // Documentation entry (starts with -) - only within allowed sections
      else if (trimmedLine.startsWith("- [") && currentCategory) {
        // Parse format: - [Title](path) - Description
        // or: - [Title](path)
        const match = trimmedLine.match(/^- \[([^\]]+)\]\(([^)]+)\)(?:\s*-\s*(.+))?$/);
        if (match) {
          const [, title, githubPath, description = ""] = match;

          // Convert GitHub path to doc path
          let docPath = "";
          if (githubPath.includes("/providers/")) {
            // Core documentation
            if (githubPath.includes("provider.md")) {
              docPath = "/docs/core/provider";
            } else if (githubPath.includes("theme.md#custom-fonts")) {
              docPath = "/docs/core/custom-fonts";
            } else if (githubPath.includes("theme.md")) {
              docPath = "/docs/core/theming";
            }
          } else if (githubPath.includes("/components/")) {
            // Component documentation
            const componentName = githubPath.match(/\/components\/([^/]+)\//)?.[1];
            if (componentName) {
              docPath = `/docs/components/${componentName}`;
            }
          }

          if (docPath) {
            currentCategory.docs.push({
              title,
              path: docPath,
              description: description || title,
            });
          }
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

    // Set cache headers
    c.header("Cache-Control", CACHE_CONTROL.VERSIONED);

    return c.json({
      baseUrl: "https://github.com/heroui-inc/heroui-native",
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

// Helper function to convert doc path to GitHub file path
function getGithubPath(docPath: string): string | null {
  const pathMap: Record<string, string> = {
    "/docs/core/provider": "src/providers/hero-ui-native/provider.md",
    "/docs/core/theming": "src/providers/theme/theme.md",
    "/docs/core/custom-fonts": "src/providers/theme/theme.md",
    "/docs/changelog": "CHANGELOG.md",
  };

  // Check direct mapping first
  if (pathMap[docPath]) {
    return pathMap[docPath];
  }

  // Handle component paths
  if (docPath.startsWith("/docs/components/")) {
    const componentName = docPath.replace("/docs/components/", "");

    return `src/components/${componentName}/${componentName}.md`;
  }

  return null;
}

// Get documentation content from GitHub
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

    const githubPath = getGithubPath(path);

    if (!githubPath) {
      analytics.trackError({
        error: "Failed to get GitHub path",
        errorEvent: AnalyticsErrorEvent.GET_DOCS_CONTENT_ERROR,
        properties: {
          responseTime: Date.now() - startTime,
          endpoint,
          path,
        },
      });

      return c.json(
        {
          error: "Documentation not found",
          details: `No documentation available for path: ${path}`,
        },
        404,
      );
    }

    // Fetch from GitHub
    const branch = "alpha";
    const githubUrl = `https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/${branch}/${githubPath}`;

    const response = await fetch(githubUrl);

    if (!response.ok) {
      analytics.trackError({
        error: `Failed to fetch documentation from GitHub`,
        errorEvent: AnalyticsErrorEvent.GET_DOCS_CONTENT_ERROR,
        properties: {
          endpoint,
          path,
          status: response.status,
          statusText: response.statusText,
          url: githubUrl,
          responseTime: Date.now() - startTime,
        },
      });

      return c.json(
        {
          error: "Failed to fetch documentation",
          details: `GitHub returned ${response.status} for ${githubPath}`,
        },
        404,
      );
    }

    const content = await response.text();

    analytics.track({
      event: AnalyticsEvent.GET_DOCS_CONTENT,
      properties: {
        endpoint,
        path,
        url: githubUrl,
        length: content.length,
        responseTime: Date.now() - startTime,
      },
    });

    // Set cache headers
    c.header("Cache-Control", CACHE_CONTROL.VERSIONED);

    return c.json({
      path,
      url: githubUrl
        .replace("raw.githubusercontent.com", "github.com")
        .replace("/refs/heads/", "/blob/"),
      content,
      contentType: "markdown",
    });
  } catch (error) {
    analytics.trackError({
      error,
      errorEvent: AnalyticsErrorEvent.GET_DOCS_CONTENT_ERROR,
      properties: {
        endpoint,
        responseTime: Date.now() - startTime,
        path,
      },
    });

    return c.json(
      {
        error: "Failed to fetch documentation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export {docs};
