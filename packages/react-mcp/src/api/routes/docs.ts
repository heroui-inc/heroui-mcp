import type {Env} from "../types";

import {Hono} from "hono";

import {getAnalytics, initAnalytics} from "../services";

const docs = new Hono<{Bindings: Env}>();

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
  const startTime = Date.now();
  initAnalytics(c.env);
  const analytics = getAnalytics();

  try {
    // Fetch the llms.txt file from HeroUI v3 docs
    const response = await fetch("https://v3.heroui.com/llms.txt");

    if (!response.ok) {
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

    const responseTime = Date.now() - startTime;
    analytics?.trackFeatureUsage("api-user", "docs-available", {
      responseTime,
      totalDocs: categories.reduce((acc, cat) => acc + cat.docs.length, 0),
    });

    return c.json({
      baseUrl: "https://v3.heroui.com",
      categories,
      total: categories.reduce((acc, cat) => acc + cat.docs.length, 0),
    });
  } catch (error) {
    console.error("Error fetching available docs:", error);

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
  const startTime = Date.now();
  initAnalytics(c.env);
  const analytics = getAnalytics();

  const path = c.req.query("path");

  if (!path) {
    return c.json(
      {
        error: "Missing required query parameter: path",
      },
      400,
    );
  }

  try {
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
          const responseTime = Date.now() - startTime;

          analytics?.trackFeatureUsage("api-user", "docs-content", {
            path,
            responseTime,
          });

          return c.json({
            path,
            url: urlWithoutExt,
            content,
            contentType: retryResponse.headers.get("content-type") || "text/plain",
          });
        }
      }

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
    const responseTime = Date.now() - startTime;

    analytics?.trackFeatureUsage("api-user", "docs-content", {
      path,
      responseTime,
    });

    return c.json({
      path,
      url: docUrl,
      content,
      contentType,
    });
  } catch (error) {
    console.error("Error fetching documentation content:", error);

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
